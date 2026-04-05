from fastapi import APIRouter, Depends, HTTPException

from api.auth import get_current_user
from models.agent import AgentCreate, AgentResponse, AgentUpdate
from runners.manager import is_running, start_runner, stop_runner
from utils.ens import (
    PARENT_NAME,
    build_ens_name,
    create_agent_subname,
    delete_agent_subname,
    get_subname,
    get_subnames_by_owner,
    update_agent_subname,
)
from utils.keys import derive_wallet
from utils.signing import build_record_payload, verify_record_sig

router = APIRouter(prefix="/agents", tags=["agents"])


def _to_response(data: dict) -> AgentResponse:
    return AgentResponse(
        **data,
        running=is_running(data["ens_name"]),
    )


async def _get_owned(ens_name: str, user: str) -> dict:
    agent = await get_subname(ens_name)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent["owner"] != user.lower():
        raise HTTPException(status_code=403, detail="Forbidden")
    return agent


@router.get("/wallet")
async def get_wallet(name: str, user: str = Depends(get_current_user)):
    """Return the derived ENS name and agent wallet address for a given agent name."""
    ens_name = build_ens_name(user, name)
    return {"ens_name": ens_name, "wallet": derive_wallet(ens_name)}


@router.post("", response_model=AgentResponse, status_code=201)
async def create(body: AgentCreate, user: str = Depends(get_current_user)):
    payload = build_record_payload(
        name=body.name,
        strategy=body.strategy,
        policy=body.policy.model_dump(mode="json"),
        description=body.description,
        image_uri=body.image_uri,
    )
    verify_record_sig(payload, body.record_sig, user)

    ens_name = build_ens_name(user, body.name)

    await create_agent_subname(
        owner=user,
        agent_name=body.name,
        data=body.model_dump(mode="json"),
        record_sig=body.record_sig,
        contract_address=body.contract_address,
    )
    start_runner(ens_name)

    return _to_response({
        "ens_name": ens_name,
        "name": body.name,
        "owner": user.lower(),
        "wallet": derive_wallet(ens_name),
        "contract_address": body.contract_address,
        "strategy": body.strategy,
        "policy": body.policy.model_dump(mode="json"),
        "description": body.description,
        "image_uri": body.image_uri,
    })


@router.get("", response_model=list[AgentResponse])
async def get_all(user: str = Depends(get_current_user)):
    subnames = await get_subnames_by_owner(user)
    return [_to_response(s) for s in subnames]


@router.get("/{name}", response_model=AgentResponse)
async def get_by_name(name: str, user: str = Depends(get_current_user)):
    ens_name = f"{name}.{PARENT_NAME}"
    agent = await _get_owned(ens_name, user)
    return _to_response(agent)


@router.patch("/{name}", response_model=AgentResponse)
async def update(name: str, body: AgentUpdate, user: str = Depends(get_current_user)):
    ens_name = f"{name}.{PARENT_NAME}"
    agent = await _get_owned(ens_name, user)

    merged = {
        "strategy": body.strategy or agent["strategy"],
        "policy": body.policy.model_dump(mode="json") if body.policy else agent["policy"],
        "description": body.description if body.description is not None else agent["description"],
        "image_uri": body.image_uri if body.image_uri is not None else agent["image_uri"],
    }
    payload = build_record_payload(
        name=name,
        **merged,
    )
    verify_record_sig(payload, body.record_sig, user)

    await update_agent_subname(ens_name, owner=user, data=merged, record_sig=body.record_sig)
    updated = await get_subname(ens_name)
    return _to_response(updated)


@router.delete("/{name}", status_code=204)
async def delete(name: str, user: str = Depends(get_current_user)):
    ens_name = f"{name}.{PARENT_NAME}"
    await _get_owned(ens_name, user)
    stop_runner(ens_name)
    await delete_agent_subname(ens_name)


@router.post("/{name}/start", status_code=204)
async def start(name: str, user: str = Depends(get_current_user)):
    ens_name = f"{name}.{PARENT_NAME}"
    await _get_owned(ens_name, user)
    start_runner(ens_name)


@router.post("/{name}/stop", status_code=204)
async def stop(name: str, user: str = Depends(get_current_user)):
    ens_name = f"{name}.{PARENT_NAME}"
    await _get_owned(ens_name, user)
    stop_runner(ens_name)
