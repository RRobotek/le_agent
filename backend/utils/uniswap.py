import os
import time

from eth_account import Account
from web3 import Web3

from utils.keys import derive_pkey

# Minimal ABIs
ERC20_ABI = [
    {
        "name": "allowance",
        "type": "function",
        "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
    {
        "name": "approve",
        "type": "function",
        "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
    },
]

SWAP_ROUTER_ABI = [
    {
        "name": "exactInputSingle",
        "type": "function",
        "inputs": [
            {
                "name": "params",
                "type": "tuple",
                "components": [
                    {"name": "tokenIn", "type": "address"},
                    {"name": "tokenOut", "type": "address"},
                    {"name": "fee", "type": "uint24"},
                    {"name": "recipient", "type": "address"},
                    {"name": "deadline", "type": "uint256"},
                    {"name": "amountIn", "type": "uint256"},
                    {"name": "amountOutMinimum", "type": "uint256"},
                    {"name": "sqrtPriceLimitX96", "type": "uint160"},
                ],
            }
        ],
        "outputs": [{"name": "amountOut", "type": "uint256"}],
        "stateMutability": "payable",
    }
]

# Uniswap V3 SwapRouter (original — has deadline in params)
DEFAULT_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
MAX_UINT256 = 2**256 - 1


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


def approve_token(
    w3: Web3,
    private_key: str,
    token_address: str,
    spender: str,
    amount: int,
) -> str | None:
    """Approve spender to spend token. Returns tx_hash or None if already approved."""
    account = Account.from_key(private_key)
    token = w3.eth.contract(address=Web3.to_checksum_address(token_address), abi=ERC20_ABI)

    allowance = token.functions.allowance(account.address, Web3.to_checksum_address(spender)).call()
    if allowance >= amount:
        return None

    tx = token.functions.approve(
        Web3.to_checksum_address(spender), MAX_UINT256
    ).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": 60000,
        "gasPrice": w3.eth.gas_price,
    })
    tx_hash = _sign_and_send(w3, tx, private_key)
    w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    return tx_hash


def execute_swap(
    ens_name: str,
    token_in: str,
    token_out: str,
    amount_in_wei: int,
    router: str = DEFAULT_ROUTER,
    fee: int = 3000,
) -> str:
    """
    Execute a Uniswap V3 exactInputSingle swap.
    Returns tx_hash.
    """
    w3 = _get_w3()
    private_key = derive_pkey(ens_name)
    account = Account.from_key(private_key)

    token_in = Web3.to_checksum_address(token_in)
    token_out = Web3.to_checksum_address(token_out)
    router = Web3.to_checksum_address(router)

    approve_token(w3, private_key, token_in, router, amount_in_wei)

    router_contract = w3.eth.contract(address=router, abi=SWAP_ROUTER_ABI)

    tx = router_contract.functions.exactInputSingle({
        "tokenIn": token_in,
        "tokenOut": token_out,
        "fee": fee,
        "recipient": account.address,
        "deadline": int(time.time()) + 300,
        "amountIn": amount_in_wei,
        "amountOutMinimum": 0,
        "sqrtPriceLimitX96": 0,
    }).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": 250000,
        "gasPrice": w3.eth.gas_price,
    })

    return _sign_and_send(w3, tx, private_key)
