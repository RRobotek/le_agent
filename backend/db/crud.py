from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AgentModel
from models.agent import AgentCreate


async def create_agent(db: AsyncSession, data: AgentCreate) -> AgentModel:
    agent = AgentModel(**data.model_dump())
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


async def get_agent_by_name(db: AsyncSession, name: str) -> AgentModel | None:
    result = await db.execute(select(AgentModel).where(AgentModel.name == name))
    return result.scalar_one_or_none()


async def get_agents_by_owner(db: AsyncSession, owner: str) -> list[AgentModel]:
    result = await db.execute(select(AgentModel).where(AgentModel.owner == owner))
    return list(result.scalars().all())
