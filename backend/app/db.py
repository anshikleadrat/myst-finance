from collections.abc import AsyncIterator
from typing import Any

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings


def use_schema(engine: AsyncEngine, schema: str) -> None:
    """Point every new connection's search_path at `schema` (validated identifier in Settings)."""

    @event.listens_for(engine.sync_engine, "connect", insert=True)
    def _set_search_path(dbapi_connection: Any, _record: Any) -> None:
        # Run outside a transaction so a later rollback cannot undo the SET.
        autocommit = dbapi_connection.autocommit
        dbapi_connection.autocommit = True
        cursor = dbapi_connection.cursor()
        cursor.execute(f'SET SESSION search_path TO "{schema}"')
        cursor.close()
        dbapi_connection.autocommit = autocommit


engine = create_async_engine(get_settings().database_url, pool_pre_ping=True)
if get_settings().database_schema:
    use_schema(engine, get_settings().database_schema)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
