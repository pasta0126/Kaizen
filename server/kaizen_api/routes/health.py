from fastapi import APIRouter

from ..db import pool

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    async with pool().acquire() as con:
        await con.fetchval("SELECT 1")
    return {"status": "ok"}
