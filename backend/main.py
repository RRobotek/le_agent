import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.agents import router as agents_router
from api.auth import router as auth_router
from runners.manager import start_all, stop_all
from utils.ens import get_all_subnames


@asynccontextmanager
async def lifespan(app: FastAPI):
    subnames = await get_all_subnames()
    start_all([s["ens_name"] for s in subnames])
    yield
    stop_all()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    print(tb)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": tb},
    )


app.include_router(auth_router)
app.include_router(agents_router)
