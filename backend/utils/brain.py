import json
import os

import anthropic

client = anthropic.AsyncAnthropic()

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


async def decide(
    strategy: str,
    prices: dict[str, float],
    policy: dict,
) -> dict:
    """
    Ask Claude to make a trading decision based on strategy + market data.

    Returns a dict with keys: action, token_in, token_out, amount_usd, reasoning
    """
    market_snapshot = json.dumps(
        {
            "prices_usd": prices,
            "whitelisted_tokens": policy.get("tokens", []),
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
