from pydantic import BaseModel


class AgentCreate(BaseModel):
    name: str
    description: str | None = None
    image_uri: str | None = None
    strategy_type: str  # "PRICE_ACTION" | "POLYMARKET" | "X_SENTIMENT"
    strategy_prompt: str
    policy: dict



class AgentResponse(BaseModel):
    id: int
    owner: str
    name: str
    description: str | None
    image_uri: str | None
    strategy_type: str
    strategy_prompt: str
    active: bool
    status: dict | None
    policy: dict | None

    model_config = {"from_attributes": True}
