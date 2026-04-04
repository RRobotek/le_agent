from fastapi import FastAPI

from api.agents import router as agents_router

app = FastAPI()

app.include_router(agents_router)
