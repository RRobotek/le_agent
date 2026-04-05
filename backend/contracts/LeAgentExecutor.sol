// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title LeAgentExecutor
/// @notice Executes Uniswap swaps on behalf of the owner via an authorized agent wallet.
///
/// Flow:
///   1. Owner approves tokenIn to this contract (one-time).
///   2. Chainlink CRE DON calls updatePolicy() after reading ENS records + Polymarket prices.
///      Policy is stored on-chain and enforced for every swap.
///   3. Agent wallet calls executeSwap() with Trading API calldata.
///      Contract pulls tokenIn from owner, approves the swap router, executes the swap.
///      tokenOut goes directly to owner (set as recipient in the Trading API quote).
///   4. Agent wallet only pays gas — never holds or touches tokens.
contract LeAgentExecutor {
    // ─── Roles ────────────────────────────────────────────────────────────────

    address public immutable owner; // user whose tokens are swapped
    address public agent;           // agent wallet (calls executeSwap, pays gas)
    address public cre;             // Chainlink CRE DON transmitter (calls updatePolicy)

    // ─── Policy (set by CRE from ENS) ─────────────────────────────────────────

    mapping(address => bool) public whitelistedTokens;
    address[] private _tokenList; // for clearing on updatePolicy

    mapping(address => bool) public whitelistedTargets; // Uniswap routers
    address[] private _targetList;

    /// @notice When the agent has Polymarket triggers, swaps are only allowed when
    ///         the condition is met (verified off-chain by CRE, written here).
    ///         When there are no triggers, CRE always sets this to true.
    bool public triggerActive;

    uint256 public maxTradesPerDay;
    uint256 public maxValuePerTrade; // tokenIn base units (e.g. 1e18 = 1 WETH)

    // ─── Rate limiting ─────────────────────────────────────────────────────────

    uint256 private _windowStart;
    uint256 private _tradesThisWindow;

    // ─── Events ────────────────────────────────────────────────────────────────

    event SwapExecuted(address indexed tokenIn, uint256 amountIn, address indexed swapTarget);
    event PolicyUpdated(bool triggerActive, uint256 maxTradesPerDay, uint256 maxValuePerTrade);
    event AgentUpdated(address indexed newAgent);
    event CREUpdated(address indexed newCRE);

    // ─── Errors ────────────────────────────────────────────────────────────────

    error NotOwner();
    error NotAgent();
    error NotCRE();
    error TriggerNotMet();
    error TokenNotWhitelisted(address token);
    error TargetNotWhitelisted(address target);
    error ExceedsValueLimit(uint256 amount, uint256 max);
    error RateLimitExceeded(uint256 trades, uint256 max);
    error SwapFailed();

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    modifier onlyCRE() {
        if (msg.sender != cre) revert NotCRE();
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────────────

    /// @param _agent  Agent wallet address (derived from ENS name + seed in the backend).
    /// @param _cre    Chainlink CRE DON transmitter address.
    constructor(address _agent, address _cre) {
        owner = msg.sender;
        agent = _agent;
        cre = _cre;
        _windowStart = block.timestamp;
        // Policy starts empty; CRE must call updatePolicy() before any swap.
        triggerActive = false;
    }

    // ─── CRE: policy update ────────────────────────────────────────────────────

    /// @notice Called by the Chainlink CRE DON after reading ENS records and
    ///         evaluating Polymarket trigger conditions.
    /// @param tokens           Whitelisted tokenIn/tokenOut addresses (from ENS policy.tokens).
    /// @param targets          Whitelisted swap router addresses (from ENS policy.contracts).
    /// @param _triggerActive   true if no triggers defined, or if Polymarket condition is met.
    /// @param _maxTradesPerDay From ENS policy.rate_limit_24h.
    /// @param _maxValuePerTrade From ENS policy.value_limit_24h converted to tokenIn base units.
    function updatePolicy(
        address[] calldata tokens,
        address[] calldata targets,
        bool _triggerActive,
        uint256 _maxTradesPerDay,
        uint256 _maxValuePerTrade
    ) external onlyCRE {
        // Clear old token whitelist
        for (uint256 i = 0; i < _tokenList.length; i++) {
            whitelistedTokens[_tokenList[i]] = false;
        }
        delete _tokenList;

        // Set new token whitelist
        for (uint256 i = 0; i < tokens.length; i++) {
            whitelistedTokens[tokens[i]] = true;
            _tokenList.push(tokens[i]);
        }

        // Clear old target whitelist
        for (uint256 i = 0; i < _targetList.length; i++) {
            whitelistedTargets[_targetList[i]] = false;
        }
        delete _targetList;

        // Set new target whitelist
        for (uint256 i = 0; i < targets.length; i++) {
            whitelistedTargets[targets[i]] = true;
            _targetList.push(targets[i]);
        }

        triggerActive = _triggerActive;
        maxTradesPerDay = _maxTradesPerDay;
        maxValuePerTrade = _maxValuePerTrade;

        emit PolicyUpdated(_triggerActive, _maxTradesPerDay, _maxValuePerTrade);
    }

    // ─── Agent: execute swap ───────────────────────────────────────────────────

    /// @notice Execute a swap on behalf of the owner using Trading API calldata.
    ///         The Trading API quote must be requested with:
    ///           swapper  = address(this)   (contract is the token spender)
    ///           recipient = owner          (tokenOut goes directly to user)
    /// @param tokenIn    ERC-20 token the owner is selling.
    /// @param amountIn   Amount of tokenIn in base units.
    /// @param swapTarget Swap router address (from Trading API swap.to).
    /// @param swapValue  ETH value to forward (from Trading API swap.value, usually 0).
    /// @param swapData   Encoded swap calldata (from Trading API swap.data).
    function executeSwap(
        address tokenIn,
        uint256 amountIn,
        address swapTarget,
        uint256 swapValue,
        bytes calldata swapData
    ) external onlyAgent {
        // ── Policy checks ──────────────────────────────────────────────────────
        if (!triggerActive) revert TriggerNotMet();
        if (!whitelistedTokens[tokenIn]) revert TokenNotWhitelisted(tokenIn);
        if (!whitelistedTargets[swapTarget]) revert TargetNotWhitelisted(swapTarget);
        if (amountIn > maxValuePerTrade) revert ExceedsValueLimit(amountIn, maxValuePerTrade);

        // ── Rate limit ─────────────────────────────────────────────────────────
        if (block.timestamp >= _windowStart + 1 days) {
            _windowStart = block.timestamp;
            _tradesThisWindow = 0;
        }
        if (_tradesThisWindow >= maxTradesPerDay) {
            revert RateLimitExceeded(_tradesThisWindow, maxTradesPerDay);
        }
        _tradesThisWindow++;

        // ── Execute ────────────────────────────────────────────────────────────
        IERC20(tokenIn).transferFrom(owner, address(this), amountIn);
        IERC20(tokenIn).approve(swapTarget, amountIn);

        (bool ok,) = swapTarget.call{value: swapValue}(swapData);
        if (!ok) revert SwapFailed();

        emit SwapExecuted(tokenIn, amountIn, swapTarget);
    }

    // ─── Owner admin ───────────────────────────────────────────────────────────

    function setAgent(address _agent) external onlyOwner {
        agent = _agent;
        emit AgentUpdated(_agent);
    }

    function setCRE(address _cre) external onlyOwner {
        cre = _cre;
        emit CREUpdated(_cre);
    }

    receive() external payable {}
}
