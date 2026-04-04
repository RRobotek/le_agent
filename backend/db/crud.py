from eth_account import Account
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AgentModel
from models.agent import AgentCreate


async def create_agent(db: AsyncSession, data: AgentCreate, owner: str) -> AgentModel:
    pkey = Account.create().key.hex()
    agent = AgentModel(**data.model_dump(), owner=owner.lower(), pkey=pkey)
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


async def get_agent_by_id(db: AsyncSession, agent_id: int) -> AgentModel | None:
    result = await db.execute(select(AgentModel).where(AgentModel.id == agent_id))
    return result.scalar_one_or_none()


async def get_agents_by_owner(db: AsyncSession, owner: str) -> list[AgentModel]:
    result = await db.execute(
        select(AgentModel).where(AgentModel.owner == owner.lower())
    )
    return list(result.scalars().all())
