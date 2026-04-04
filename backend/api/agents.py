from fastapi import APIRouter, HTTPException

from db.crud import create_agent, get_agent_by_name, get_agents_by_owner
from db.database import get_db
from models.agent import AgentCreate, AgentResponse

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("", response_model=AgentResponse, status_code=201)
async def create(body: AgentCreate):
    async with get_db() as db:
        existing = await get_agent_by_name(db, body.name)
        if existing:
            raise HTTPException(status_code=409, detail="Agent name already taken")
        return await create_agent(db, body)


@router.get("/{name}", response_model=AgentResponse)
async def get_by_name(name: str):
    async with get_db() as db:
        agent = await get_agent_by_name(db, name)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.get("", response_model=list[AgentResponse])
async def get_by_owner(owner: str):
    async with get_db() as db:
        return await get_agents_by_owner(db, owner)
