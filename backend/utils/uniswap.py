import os

import httpx
from eth_account import Account
from web3 import Web3

from utils.keys import derive_pkey

API_URL = "https://trade-api.gateway.uniswap.org/v1"
HEADERS = {
    "Content-Type": "application/json",
    "x-universal-router-version": "2.0",
}

# Minimal ABI — only the function the agent wallet calls on LeAgentExecutor
EXECUTOR_ABI = [
    {
        "name": "executeSwap",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "tokenIn",    "type": "address"},
            {"name": "amountIn",   "type": "uint256"},
            {"name": "swapTarget", "type": "address"},
            {"name": "swapValue",  "type": "uint256"},
            {"name": "swapData",   "type": "bytes"},
        ],
        "outputs": [],
    }
]


def _headers() -> dict[str, str]:
    return {**HEADERS, "x-api-key": os.environ["UNISWAP_API_KEY"]}


def _get_w3() -> Web3:
    rpc = os.environ["WEB3_RPC_URL"]
    w3 = Web3(Web3.HTTPProvider(rpc))
    if not w3.is_connected():
        raise RuntimeError(f"Cannot connect to RPC: {rpc}")
    return w3


def _sign_and_send(w3: Web3, tx: dict, private_key: str) -> str:
    signed = w3.eth.account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    return tx_hash.hex()


async def check_approval(
    wallet_address: str,
    token: str,
    amount: str,
    chain_id: int = 1,
) -> dict | None:
    """Check if a token is approved for the Trading API. Returns approval tx data or None."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{API_URL}/check_approval",
            headers=_headers(),
            json={
                "walletAddress": wallet_address,
                "token": token,
                "amount": amount,
                "chainId": chain_id,
            },
        )
        resp.raise_for_status()
        return resp.json().get("approval")


async def get_quote(
    swapper: str,
    token_in: str,
    token_out: str,
    amount: str,
    chain_id: int = 1,
    slippage: float = 0.5,
    recipient: str | None = None,
) -> dict:
    """Get a swap quote from the Trading API. Returns the full quote response."""
    body: dict = {
        "swapper": swapper,
        "tokenIn": token_in,
        "tokenOut": token_out,
        "tokenInChainId": str(chain_id),
        "tokenOutChainId": str(chain_id),
        "amount": amount,
        "type": "EXACT_INPUT",
        "slippageTolerance": slippage,
        "routingPreference": "BEST_PRICE",
    }
    if recipient:
        body["recipient"] = recipient

    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{API_URL}/quote", headers=_headers(), json=body)
        resp.raise_for_status()
        return resp.json()


def _prepare_swap_request(quote_response: dict) -> dict:
    """Strip permitData/permitTransaction for smart-contract (legacy approval) flow."""
    # Contracts can't sign EIP-712, so we always use the legacy approval path.
    # The contract does tokenIn.approve(router) itself before calling the swap.
    return {k: v for k, v in quote_response.items() if k not in ("permitData", "permitTransaction")}


async def execute_swap(
    ens_name: str,
    contract_address: str,
    owner_address: str,
    token_in: str,
    token_out: str,
    amount_in_wei: int,
    chain_id: int = 1,
) -> str:
    """
    Execute a swap via LeAgentExecutor on behalf of the owner.

    The agent wallet (derived from ens_name) signs and sends a tx to the contract.
    The contract pulls tokenIn from owner, approves the router, executes the swap.
    tokenOut is sent directly to owner (set as recipient in the quote).

    Prerequisites:
      - owner has approved tokenIn to contract_address
      - CRE has called updatePolicy() on the contract with current ENS policy
    """
    w3 = _get_w3()
    private_key = derive_pkey(ens_name)
    agent_account = Account.from_key(private_key)
    contract_address = Web3.to_checksum_address(contract_address)
    owner_address = Web3.to_checksum_address(owner_address)
    amount_str = str(amount_in_wei)

    # 1. Quote: contract is the swapper (has the tokens), owner is the recipient
    quote_response = await get_quote(
        swapper=contract_address,
        token_in=token_in,
        token_out=token_out,
        amount=amount_str,
        chain_id=chain_id,
        recipient=owner_address,
    )

    # 2. Get swap calldata
    swap_request = _prepare_swap_request(quote_response)
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{API_URL}/swap", headers=_headers(), json=swap_request)
        resp.raise_for_status()
        swap_data = resp.json()

    swap_tx = swap_data["swap"]
    if not swap_tx.get("data") or swap_tx["data"] in ("", "0x"):
        raise RuntimeError("Empty swap data — quote may have expired")

    # 3. Encode call to contract.executeSwap(tokenIn, amountIn, swapTarget, swapValue, swapData)
    executor = w3.eth.contract(address=contract_address, abi=EXECUTOR_ABI)
    calldata = executor.encodeABI(
        fn_name="executeSwap",
        args=[
            Web3.to_checksum_address(token_in),
            amount_in_wei,
            Web3.to_checksum_address(swap_tx["to"]),
            int(swap_tx.get("value", "0")),
            bytes.fromhex(swap_tx["data"].removeprefix("0x")),
        ],
    )

    # 4. Agent wallet sends tx to the contract (pays gas only, never touches tokens)
    tx = {
        "to": contract_address,
        "from": agent_account.address,
        "data": calldata,
        "value": 0,
        "nonce": w3.eth.get_transaction_count(agent_account.address),
        "gas": int(swap_tx.get("gasLimit", 350_000)),
        "gasPrice": w3.eth.gas_price,
        "chainId": chain_id,
    }

    return _sign_and_send(w3, tx, private_key)
