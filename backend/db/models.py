from sqlalchemy import (
    DECIMAL,
    JSON,
    Integer,
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
    id = Column(Integer, primary_key=True, autoincrement=True)
    owner = Column(String, nullable=False)

    name = Column(String, nullable=False)
    description = Column(String)
    image_uri = Column(String)

    strategy_type = Column(
        String, nullable=False
    )  # todo: enum ["PRICE_ACTION", "POLYMARKET", "X_SENTIMENT"]
    strategy_prompt = Column(String, nullable=False)

    # policy data can be queried from the contract / ENS json using id

    policy = Column(JSON)
    pkey = Column(String, nullable=False)
    active = Column(Boolean, default=True)
    status = Column(JSON)

    trades = relationship("TradeModel", back_populates="agent")


class TradeModel(Base):
    __tablename__ = "trades"

    tx_hash = Column(String, primary_key=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)

    token_in = Column(String, nullable=False)
    token_out = Column(String, nullable=False)
    amount_in = Column(Numeric(78, 0), nullable=False)  # uint256 fits in Numeric(78,0)
    amount_out = Column(Numeric(78, 0))

    # vallue usd can just be a float with 2 decimals
    value_usd = Column(DECIMAL, nullable=False)

    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    success = Column(Boolean, default=True)

    tx_info = Column(JSON)

    agent = relationship("AgentModel", back_populates="trades")
