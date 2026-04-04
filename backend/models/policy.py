from decimal import Decimal
from pydantic import BaseModel


class Policy(BaseModel):
    tokens: list[str]  # whitelisted token addresses
    contracts: list[str]  # whitelisted contract addresses (e.g. Uniswap router)
    price_range: dict[str, tuple[Decimal, Decimal]]  # token_address -> (min_price, max_price) in USD, 16 decimal points
    rate_limit_24h: int  # max number of trades per 24h
    value_limit_24h: Decimal  # max USD value per single trade
