from pathlib import Path

import asyncpg

from .config import settings

_pool: asyncpg.Pool | None = None
_SCHEMA = (Path(__file__).parent / "schema.sql").read_text()


async def connect() -> None:
    global _pool
    _pool = await asyncpg.create_pool(settings.database_url, min_size=1, max_size=10)
    async with _pool.acquire() as con:
        await con.execute(_SCHEMA)


async def disconnect() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("database pool not initialised")
    return _pool
