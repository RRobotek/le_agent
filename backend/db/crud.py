from eth_account import Account
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AgentModel, TradeModel
from models.agent import AgentCreate, AgentUpdate


async def create_agent(db: AsyncSession, data: AgentCreate, owner: str) -> AgentModel:
    pkey = Account.create().key.hex()
    dumped = data.model_dump(mode="json")
    agent = AgentModel(**dumped, owner=owner.lower(), pkey=pkey)
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


async def get_agent_by_id(db: AsyncSession, agent_id: int) -> AgentModel | None:
    result = await db.execute(select(AgentModel).where(AgentModel.id == agent_id))
    return result.scalar_one_or_none()


async def update_agent(db: AsyncSession, agent: AgentModel, data: AgentUpdate) -> AgentModel:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(agent, field, value)
    await db.commit()
    await db.refresh(agent)
    return agent


async def delete_agent(db: AsyncSession, agent: AgentModel) -> None:
    await db.delete(agent)
    await db.commit()


async def get_agents_by_owner(db: AsyncSession, owner: str) -> list[AgentModel]:
    result = await db.execute(
        select(AgentModel).where(AgentModel.owner == owner.lower())
    )
    return list(result.scalars().all())


async def get_trades_by_agent(db: AsyncSession, agent_id: int) -> list[TradeModel]:
    result = await db.execute(
        select(TradeModel).where(TradeModel.agent_id == agent_id)
    )
    return list(result.scalars().all())


async def get_trades_by_owner(db: AsyncSession, owner: str) -> list[TradeModel]:
    result = await db.execute(
        select(TradeModel)
        .join(AgentModel)
        .where(AgentModel.owner == owner.lower())
    )
    return list(result.scalars().all())
