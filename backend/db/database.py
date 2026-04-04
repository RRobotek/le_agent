import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

_async_engine = None
_async_session_maker = None


def _get_database_engine():
    global _async_engine, _async_session_maker

    if _async_engine is None:
        _database = os.getenv("POSTGRES_DB")
        _user = os.getenv("POSTGRES_USER")
        _password = os.getenv("POSTGRES_PASSWORD")
        _host = os.getenv("POSTGRES_HOST")
        _port = os.getenv("POSTGRES_PORT")

        if not all([_database, _user, _password, _host, _port]):
            raise ValueError("Missing required database environment variables. ")

        _async_engine = create_async_engine(
            f"postgresql+asyncpg://{_user}:{_password}@{_host}:{_port}/{_database}",
            pool_size=20,
            max_overflow=20,
            pool_timeout=30,
            pool_pre_ping=True,
            connect_args={"command_timeout": 30},
            echo=False,
        )

        _async_session_maker = async_sessionmaker(
            _async_engine, expire_on_commit=False, class_=AsyncSession
        )

    return _async_engine, _async_session_maker


@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSession]:
    """Simple context manager for database sessions"""
    _, session_maker = _get_database_engine()
    session = session_maker()
    try:
        yield session
    finally:
        await session.close()
