// LeAgentExecutor contract ABI + bytecode
//
// To get the bytecode: compile backend/contracts/LeAgentExecutor.sol
//   solc --bin --abi --optimize backend/contracts/LeAgentExecutor.sol
// or use Hardhat/Foundry and paste the bytecode hex below.

export const EXECUTOR_BYTECODE =
  "0x60a060405234801561000f575f5ffd5b50604051610d66380380610d6683398101604081905261002e9161008b565b336080525f80546001600160a01b039384166001600160a01b03199182161790915560018054929093169116179055426009556006805460ff191690556100bc565b80516001600160a01b0381168114610086575f5ffd5b919050565b5f5f6040838503121561009c575f5ffd5b6100a583610070565b91506100b360208401610070565b90509250929050565b608051610c7d6100e95f395f818161012c01528181610401015281816108af01526109410152610c7d5ff3fe6080604052600436106100a8575f3560e01c8063daf9c21011610062578063daf9c210146101a4578063e5f9138c146101e2578063ef96d61a146101fb578063f5ff5c761461021a578063f676f97e14610238578063fb9ed2571461024d575f5ffd5b806318b13d02146100b35780632ead797d146100db57806350ac31f6146100fc5780638da5cb5b1461011b578063a05b6d5814610166578063bcf685ed14610185575f5ffd5b366100af57005b5f5ffd5b3480156100be575f5ffd5b506100c860085481565b6040519081526020015b60405180910390f35b3480156100e6575f5ffd5b506100fa6100f5366004610a17565b61027b565b005b348015610107575f5ffd5b506100fa610116366004610b10565b6105c5565b348015610126575f5ffd5b5061014e7f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020016100d2565b348015610171575f5ffd5b506100fa610180366004610ba4565b6108a4565b348015610190575f5ffd5b506100fa61019f366004610ba4565b610936565b3480156101af575f5ffd5b506101d26101be366004610ba4565b60026020525f908152604090205460ff1681565b60405190151581526020016100d2565b3480156101ed575f5ffd5b506006546101d29060ff1681565b348015610206575f5ffd5b5060015461014e906001600160a01b031681565b348015610225575f5ffd5b505f5461014e906001600160a01b031681565b348015610243575f5ffd5b506100c860075481565b348015610258575f5ffd5b506101d2610267366004610ba4565b60046020525f908152604090205460ff1681565b5f546001600160a01b031633146102a557604051630d9ab13f60e01b815260040160405180910390fd5b60065460ff166102c85760405163332df9f360e11b815260040160405180910390fd5b6001600160a01b0386165f9081526002602052604090205460ff166103105760405163751dff9760e11b81526001600160a01b03871660048201526024015b60405180910390fd5b6001600160a01b0384165f9081526004602052604090205460ff16610353576040516347ccabe760e01b81526001600160a01b0385166004820152602401610307565b60085485111561038457600854604051636ed7e5b160e11b8152610307918791600401918252602082015260400190565b6009546103949062015180610bd8565b42106103a357426009555f600a555b600754600a54106103d657600a54600754604051632fb89ac360e11b815260048101929092526024820152604401610307565b600a8054905f6103e583610bf1565b90915550506040516323b872dd60e01b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000081166004830152306024830152604482018790528716906323b872dd906064016020604051808303815f875af115801561045c573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906104809190610c09565b5060405163095ea7b360e01b81526001600160a01b0385811660048301526024820187905287169063095ea7b3906044016020604051808303815f875af11580156104cd573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906104f19190610c09565b505f846001600160a01b031684848460405161050e929190610c24565b5f6040518083038185875af1925050503d805f8114610548576040519150601f19603f3d011682016040523d82523d5f602084013e61054d565b606091505b505090508061056f5760405163081ceff360e41b815260040160405180910390fd5b846001600160a01b0316876001600160a01b03167f114c818c577214864b77070e90d0b43155d675b526946a2a8da2ef1b1154188d886040516105b491815260200190565b60405180910390a350505050505050565b6001546001600160a01b031633146105f0576040516306545bef60e31b815260040160405180910390fd5b5f5b60035481101561064e575f60025f6003848154811061061357610613610c33565b5f918252602080832091909101546001600160a01b031683528201929092526040019020805460ff19169115159190911790556001016105f2565b5061065a60035f6109c6565b5f5b8681101561071757600160025f8a8a8581811061067b5761067b610c33565b90506020020160208101906106909190610ba4565b6001600160a01b0316815260208101919091526040015f20805460ff191691151591909117905560038888838181106106cb576106cb610c33565b90506020020160208101906106e09190610ba4565b8154600180820184555f93845260209093200180546001600160a01b0319166001600160a01b03929092169190911790550161065c565b505f5b600554811015610776575f60045f6005848154811061073b5761073b610c33565b5f918252602080832091909101546001600160a01b031683528201929092526040019020805460ff191691151591909117905560010161071a565b5061078260055f6109c6565b5f5b8481101561083f57600160045f8888858181106107a3576107a3610c33565b90506020020160208101906107b89190610ba4565b6001600160a01b0316815260208101919091526040015f20805460ff191691151591909117905560058686838181106107f3576107f3610c33565b90506020020160208101906108089190610ba4565b8154600180820184555f93845260209093200180546001600160a01b0319166001600160a01b039290921691909117905501610784565b506006805460ff191684151590811790915560078390556008829055604080519182526020820184905281018290527fff997528fa0f3ff72ecb91ef2b10ef659a86270931f53d85145eedd969bb12269060600160405180910390a150505050505050565b336001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016146108ed576040516330cd747160e01b815260040160405180910390fd5b600180546001600160a01b0319166001600160a01b0383169081179091556040517f18780c7d9174f2bf71e3197dbb620e0842b65170929d2680d391022aef5b5898905f90a250565b336001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000161461097f576040516330cd747160e01b815260040160405180910390fd5b5f80546001600160a01b0319166001600160a01b038316908117825560405190917fe9f337c154e801e0f86b6bc993df9a2cd349bb210385592c7a52e38ea726334f91a250565b5080545f8255905f5260205f20906109de91906109e0565b565b5f5b808211156109f7575f818401556001016109e2565b505050565b80356001600160a01b0381168114610a12575f5ffd5b919050565b5f5f5f5f5f5f60a08789031215610a2c575f5ffd5b610a35876109fc565b955060208701359450610a4a604088016109fc565b935060608701359250608087013567ffffffffffffffff811115610a6c575f5ffd5b8701601f81018913610a7c575f5ffd5b803567ffffffffffffffff811115610a92575f5ffd5b896020828401011115610aa3575f5ffd5b60208201935080925050509295509295509295565b5f5f83601f840112610ac8575f5ffd5b50813567ffffffffffffffff811115610adf575f5ffd5b6020830191508360208260051b8501011115610af9575f5ffd5b9250929050565b8015158114610b0d575f5ffd5b50565b5f5f5f5f5f5f5f60a0888a031215610b26575f5ffd5b873567ffffffffffffffff811115610b3c575f5ffd5b610b488a828b01610ab8565b909850965050602088013567ffffffffffffffff811115610b67575f5ffd5b610b738a828b01610ab8565b9096509450506040880135610b8781610b00565b969995985093969295946060840135945060809093013592915050565b5f60208284031215610bb4575f5ffd5b610bbd826109fc565b9392505050565b634e487b7160e01b5f52601160045260245ffd5b80820180821115610beb57610beb610bc4565b92915050565b5f60018201610c0257610c02610bc4565b5060010190565b5f60208284031215610c19575f5ffd5b8151610bbd81610b00565b818382375f9101908152919050565b634e487b7160e01b5f52603260045260245ffdfea26469706673582212204a8244d527f1c4064c86a0a91c951eb04cdf96178fc415c32bda28fffbe4ce9164736f6c63430008220033" as `0x${string}`;

export const EXECUTOR_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_agent", type: "address" },
      { internalType: "address", name: "_cre", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "max", type: "uint256" },
    ],
    name: "ExceedsValueLimit",
    type: "error",
  },
  { inputs: [], name: "NotAgent", type: "error" },
  { inputs: [], name: "NotCRE", type: "error" },
  { inputs: [], name: "NotOwner", type: "error" },
  {
    inputs: [
      { internalType: "uint256", name: "trades", type: "uint256" },
      { internalType: "uint256", name: "max", type: "uint256" },
    ],
    name: "RateLimitExceeded",
    type: "error",
  },
  { inputs: [], name: "SwapFailed", type: "error" },
  {
    inputs: [{ internalType: "address", name: "target", type: "address" }],
    name: "TargetNotWhitelisted",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "TokenNotWhitelisted",
    type: "error",
  },
  { inputs: [], name: "TriggerNotMet", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "newAgent",
        type: "address",
      },
    ],
    name: "AgentUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "newCRE",
        type: "address",
      },
    ],
    name: "CREUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bool",
        name: "triggerActive",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxTradesPerDay",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxValuePerTrade",
        type: "uint256",
      },
    ],
    name: "PolicyUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "tokenIn",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountIn",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "swapTarget",
        type: "address",
      },
    ],
    name: "SwapExecuted",
    type: "event",
  },
  {
    inputs: [],
    name: "agent",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cre",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address", name: "swapTarget", type: "address" },
      { internalType: "uint256", name: "swapValue", type: "uint256" },
      { internalType: "bytes", name: "swapData", type: "bytes" },
    ],
    name: "executeSwap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "maxTradesPerDay",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxValuePerTrade",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_agent", type: "address" }],
    name: "setAgent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_cre", type: "address" }],
    name: "setCRE",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "triggerActive",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "tokens", type: "address[]" },
      { internalType: "address[]", name: "targets", type: "address[]" },
      { internalType: "bool", name: "_triggerActive", type: "bool" },
      { internalType: "uint256", name: "_maxTradesPerDay", type: "uint256" },
      { internalType: "uint256", name: "_maxValuePerTrade", type: "uint256" },
    ],
    name: "updatePolicy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "whitelistedTargets",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "whitelistedTokens",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
] as const;

/**

  [
  {
    type: "constructor",
    inputs: [
      { name: "_agent", type: "address" },
      { name: "_cre", type: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executeSwap",
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "swapTarget", type: "address" },
      { name: "swapValue", type: "uint256" },
      { name: "swapData", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updatePolicy",
    inputs: [
      { name: "tokens", type: "address[]" },
      { name: "targets", type: "address[]" },
      { name: "_triggerActive", type: "bool" },
      { name: "_maxTradesPerDay", type: "uint256" },
      { name: "_maxValuePerTrade", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setAgent",
    inputs: [{ name: "_agent", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setCRE",
    inputs: [{ name: "_cre", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "agent",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "triggerActive",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "SwapExecuted",
    inputs: [
      { name: "tokenIn", type: "address", indexed: true },
      { name: "amountIn", type: "uint256", indexed: false },
      { name: "swapTarget", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "PolicyUpdated",
    inputs: [
      { name: "triggerActive", type: "bool", indexed: false },
      { name: "maxTradesPerDay", type: "uint256", indexed: false },
      { name: "maxValuePerTrade", type: "uint256", indexed: false },
    ],
  },
  {
    type: "error",
    name: "NotOwner",
    inputs: [],
  },
  {
    type: "error",
    name: "NotAgent",
    inputs: [],
  },
  {
    type: "error",
    name: "SwapFailed",
    inputs: [],
  },
] as const;

**/
