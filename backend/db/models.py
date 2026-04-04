from pydantic import BaseModel

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Numeric,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import DeclarativeBase, relationship
from datetime import datetime, timezone


class Base(DeclarativeBase):
    pass


class AgentModel(Base):
    __tablename__ = "agents"

    name = Column(String, primary_key=True)
    owner = Column(String, nullable=False)
    image_uri = Column(String)
    strategy_prompt = Column(String, nullable=False)
    pkey = Column(String, nullable=False)
    active = Column(Boolean, default=True)

    trades = relationship("TradeModel", back_populates="agent")


class TradeModel(Base):
    __tablename__ = "trades"

    tx_hash = Column(String, primary_key=True)
    agent_name = Column(String, ForeignKey("agents.name"), nullable=False)
    token_in = Column(String, nullable=False)
    token_out = Column(String, nullable=False)
    amount_in = Column(Numeric(78, 0), nullable=False)  # uint256 fits in Numeric(78,0)
    amount_out = Column(Numeric(78, 0))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    success = Column(Boolean, default=True)
    error = Column(String)

    agent = relationship("AgentModel", back_populates="trades")


"""
payload for policy definition when Creating an agent (POST /agents)
stored on chain in the contract / ENS json

class Policy(BaseModel):
tokens: list[str] # whitelisted token addresses
contracts: list[str] # whitelisted contract addresses (e.g. Uniswap router)
price_range: dict[
str, tuple[int, int]
] # token_address -> (min_price, max_price) in USD # only trade this token if price is within range # omit a token to skip price check for it, if no price range is provided for a token, trade at any range
tx_amount_limit: int # max number of trades per 24h
tx_value_limit: int # in USD equivalent, hard cap per single trade
"""
