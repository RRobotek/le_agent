import os
import secrets
from datetime import datetime, timedelta, timezone

from eth_account import Account
from eth_account.messages import encode_defunct
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

_JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_hex(32))
_JWT_ALGORITHM = "HS256"
_JWT_EXPIRE_HOURS = 24

_bearer = HTTPBearer()

# In-memory nonce store: address -> nonce
# Fine for a hackathon; swap for Redis/DB in production
_nonces: dict[str, str] = {}


class VerifyRequest(BaseModel):
    address: str
    message: str
    signature: str


@router.get("/nonce/{address}")
async def get_nonce(address: str):
    nonce = secrets.token_hex(16)
    _nonces[address.lower()] = nonce
    return {"nonce": nonce}


@router.post("/verify")
async def verify(body: VerifyRequest):
    address = body.address.lower()
    expected_nonce = _nonces.get(address)

    if not expected_nonce:
        raise HTTPException(status_code=400, detail="Request a nonce first")

    if expected_nonce not in body.message:
        raise HTTPException(status_code=400, detail="Nonce mismatch")

    try:
        msg = encode_defunct(text=body.message)
        recovered = Account.recover_message(msg, signature=body.signature)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if recovered.lower() != address:
        raise HTTPException(status_code=401, detail="Signature does not match address")

    del _nonces[address]  # consume nonce — can't be reused

    token = jwt.encode(
        {
            "sub": address,
            "exp": datetime.now(timezone.utc) + timedelta(hours=_JWT_EXPIRE_HOURS),
        },
        _JWT_SECRET,
        algorithm=_JWT_ALGORITHM,
    )
    return {"token": token}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """FastAPI dependency — returns the verified wallet address from the Bearer JWT."""
    try:
        payload = jwt.decode(
            credentials.credentials, _JWT_SECRET, algorithms=[_JWT_ALGORITHM]
        )
        address: str = payload.get("sub")
        if not address:
            raise HTTPException(status_code=401, detail="Invalid token")
        return address.lower()
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
