import json

import os

import anthropic

from utils.uniswap import get_quote

client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
_DUMMY_SWAPPER = "0x0000000000000000000000000000000000000001"

DECISION_SCHEMA = {
    "type": "object",
    "properties": {
        "action": {
            "type": "string",
            "enum": ["swap", "hold"],
            "description": "Whether to execute a swap or hold",
        },
        "token_in": {
            "type": "string",
            "description": "ERC-20 address of the token to sell (empty string if holding)",
        },
        "token_out": {
            "type": "string",
            "description": "ERC-20 address of the token to buy (empty string if holding)",
        },
        "amount_usd": {
            "type": "number",
            "description": "USD value of the swap (0 if holding)",
        },
        "reasoning": {
            "type": "string",
            "description": "Short explanation of the decision",
        },
    },
    "required": ["action", "token_in", "token_out", "amount_usd", "reasoning"],
    "additionalProperties": False,
}


async def fetch_prices(tokens: list[str]) -> dict[str, float]:
    """
    Fetch USD prices for a list of ERC-20 token addresses using Uniswap quotes.

    Quotes 1 USDC → token to get tokens-per-dollar, then inverts.
    Assumes 18-decimal tokens. Skips tokens that fail to quote.
    """
    prices: dict[str, float] = {}
    for token in tokens:
        if token.lower() == USDC.lower():
            prices[token] = 1.0
            continue
        try:
            quote = await get_quote(
                swapper=_DUMMY_SWAPPER,
                token_in=USDC,
                token_out=token,
                amount="1000000",  # 1 USDC (6 decimals)
            )
            # output amount in raw token units (18 decimals assumed)
            output_raw = int(quote["quote"]["output"]["amount"])
            if output_raw > 0:
                prices[token] = 1e18 / output_raw
        except Exception:
            pass
    return prices


async def decide(
    strategy: str,
    policy: dict,
) -> dict:
    """
    Ask Claude to make a trading decision based on strategy + live market data.

    Fetches current prices from Uniswap before calling the model.
    Returns a dict with keys: action, token_in, token_out, amount_usd, reasoning
    """
    tokens = policy.get("tokens", [])
    prices = await fetch_prices(tokens)

    market_snapshot = json.dumps(
        {
            "prices_usd": prices,
            "whitelisted_tokens": tokens,
            "whitelisted_contracts": policy.get("contracts", []),
            "rate_limit_24h": policy.get("rate_limit_24h", 10),
            "value_limit_24h": policy.get("value_limit_24h", 1000),
        },
        indent=2,
    )

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=strategy,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Current market data:\n{market_snapshot}\n\n"
                    "Based on your strategy, decide whether to swap tokens or hold. "
                    "Only use tokens and contracts from the whitelisted lists. "
                    "Respect the value and rate limits in the policy."
                ),
            }
        ],
        tools=[
            {
                "name": "trading_decision",
                "description": "Submit your trading decision",
                "input_schema": DECISION_SCHEMA,
            }
        ],
        tool_choice={"type": "tool", "name": "trading_decision"},
    )

    block = next(b for b in response.content if b.type == "tool_use")
    return block.input
