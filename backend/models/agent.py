from pydantic import BaseModel


class AgentCreate(BaseModel):
    name: str
    owner: str
    strategy_prompt: str
    pkey: str
    image_uri: str | None = None
    active: bool = True


class AgentResponse(BaseModel):
    name: str
    owner: str
    strategy_prompt: str
    image_uri: str | None
    active: bool

    model_config = {"from_attributes": True}
