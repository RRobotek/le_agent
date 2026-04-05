import json
import os

import httpx

from utils.keys import derive_wallet

BASE_URL = "https://offchain-manager.namespace.ninja/api/v1"
PARENT_NAME = "leagent.eth"
ETH_COIN = 60


def _headers() -> dict:
    key = os.getenv("NAMESPACE_APIKEY")
    if not key:
        raise RuntimeError("NAMESPACE_APIKEY env var is not set")
    return {"x-auth-token": key}


def build_ens_label(owner: str, agent_name: str) -> str:
    prefix = owner.lower()[2:8]  # first 6 chars of address after 0x
    return f"{prefix}-{agent_name}"


def build_ens_name(owner: str, agent_name: str) -> str:
    return f"{build_ens_label(owner, agent_name)}.{PARENT_NAME}"


def _build_texts(data: dict, owner: str, record_sig: str) -> list[dict]:
    texts = [
        {"key": "owner", "value": owner.lower()},
        {"key": "strategy", "value": data["strategy"]},
        {"key": "policy", "value": json.dumps(data["policy"])},
        {"key": "record_sig", "value": record_sig},
    ]
    if data.get("description"):
        texts.append({"key": "description", "value": data["description"]})
    if data.get("image_uri"):
        texts.append({"key": "avatar", "value": data["image_uri"]})
    if data.get("contract_address"):
        texts.append({"key": "contract_address", "value": data["contract_address"]})

    return texts


def _parse_subname(raw: dict) -> dict | None:
    texts = raw.get("texts", {})
    if not isinstance(texts, dict):
        texts = {t["key"]: t["value"] for t in texts}
    if "owner" not in texts or "strategy" not in texts:
        return None
    try:
        policy = json.loads(texts.get("policy", "{}"))
    except Exception:
        policy = {}
    ens_name = raw.get("fullName", "")
    return {
        "ens_name": ens_name,
        "name": raw.get("label", ens_name.split(".")[0]),
        "owner": texts["owner"],
        "strategy": texts["strategy"],
        "policy": policy,
        "contract_address": texts.get("contract_address"),
        "description": texts.get("description"),
        "image_uri": texts.get("avatar"),
        "wallet": derive_wallet(ens_name),
    }


async def create_agent_subname(
    owner: str, agent_name: str, data: dict, record_sig: str, contract_address: str | None = None
) -> str:
    ens_name = build_ens_name(owner, agent_name)
    wallet = derive_wallet(ens_name)
    label = build_ens_label(owner, agent_name)

    if contract_address:
        data = {**data, "contract_address": contract_address}

    async with httpx.AsyncClient() as client:
        await client.post(
            f"{BASE_URL}/subnames",
            headers=_headers(),
            json={
                "parentName": PARENT_NAME,
                "label": label,
                "owner": owner,  # user's wallet owns the subname
                "addresses": [{"coin": ETH_COIN, "value": wallet}],
                "texts": _build_texts(data, owner, record_sig),
            },
        )
    return ens_name


async def update_agent_subname(
    ens_name: str, owner: str, data: dict, record_sig: str
) -> None:
    # Namespace create endpoint also handles updates
    label = ens_name.split(".")[0]
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{BASE_URL}/subnames",
            headers=_headers(),
            json={
                "parentName": PARENT_NAME,
                "label": label,
                "owner": owner,
                "texts": _build_texts(data, owner, record_sig),
            },
        )


async def delete_agent_subname(ens_name: str) -> None:
    async with httpx.AsyncClient() as client:
        await client.delete(
            f"{BASE_URL}/subnames/{ens_name}",
            headers=_headers(),
        )


async def get_subname(ens_name: str) -> dict | None:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{BASE_URL}/subnames/{ens_name}",
            headers=_headers(),
        )
    if res.status_code == 404 or not res.text.strip():
        return None
    return _parse_subname(res.json())


async def get_all_subnames() -> list[dict]:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{BASE_URL}/subnames/search",
            headers=_headers(),
            json={"parentName": PARENT_NAME, "page": 1, "size": 1000},
        )
    if res.status_code != 200 or not res.text.strip():
        return []
    data = res.json()
    return [
        p for raw in data.get("items", []) if (p := _parse_subname(raw)) is not None
    ]


async def get_subnames_by_owner(owner: str) -> list[dict]:
    all_subnames = await get_all_subnames()
    return [s for s in all_subnames if s["owner"] == owner.lower()]
