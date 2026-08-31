import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import current_user_id
from ..db import pool
from ..scoring import Indicator, ScoringError, score_occurrence

router = APIRouter(prefix="/logs", tags=["logs"])


class LogCreate(BaseModel):
    indicator_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    occurred_on: dt.date | None = None


def _row_to_dict(row) -> dict:
    return {
        "id": str(row["id"]),
        "indicator_id": str(row["indicator_id"]),
        "variant_id": str(row["variant_id"]) if row["variant_id"] else None,
        "occurred_on": row["occurred_on"].isoformat(),
        "occurred_at": row["occurred_at"].isoformat(),
        "score": row["score"],
    }


@router.post("", status_code=201)
async def create_log(body: LogCreate, user_id: str = Depends(current_user_id)) -> dict:
    occurred_on = body.occurred_on or dt.date.today()
    user_uuid = uuid.UUID(user_id)

    async with pool().acquire() as con:
        async with con.transaction():
            indicator_row = await con.fetchrow(
                "SELECT * FROM indicator WHERE id = $1 AND user_id = $2",
                body.indicator_id,
                user_uuid,
            )
            if indicator_row is None:
                raise HTTPException(status_code=404, detail="indicator not found")

            indicator = Indicator(
                rule_type=indicator_row["rule_type"],
                per_occurrence_value=indicator_row["per_occurrence_value"],
                first_value=indicator_row["first_value"],
                repeat_value=indicator_row["repeat_value"],
            )

            variant_value = None
            if indicator.rule_type == "variant":
                if body.variant_id is None:
                    raise HTTPException(status_code=422, detail="variant_id is required for this indicator")
                variant_row = await con.fetchrow(
                    "SELECT value FROM indicator_variant WHERE id = $1 AND indicator_id = $2",
                    body.variant_id,
                    body.indicator_id,
                )
                if variant_row is None:
                    raise HTTPException(status_code=404, detail="variant not found")
                variant_value = variant_row["value"]

            prior_occurrences_today = 0
            if indicator.rule_type == "first_then_repeat":
                # Serialize same-day scoring for this indicator so two near-concurrent
                # logs can't both be scored as "the first occurrence today".
                await con.execute(
                    "SELECT pg_advisory_xact_lock(hashtextextended($1::text || $2::text, 0))",
                    str(body.indicator_id),
                    occurred_on.isoformat(),
                )
                prior_occurrences_today = await con.fetchval(
                    "SELECT count(*) FROM log_entry WHERE indicator_id = $1 AND occurred_on = $2",
                    body.indicator_id,
                    occurred_on,
                )

            try:
                score = score_occurrence(
                    indicator,
                    prior_occurrences_today=prior_occurrences_today,
                    variant_value=variant_value,
                )
            except ScoringError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc

            row = await con.fetchrow(
                """
                INSERT INTO log_entry (user_id, indicator_id, variant_id, occurred_on, score)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
                """,
                user_uuid,
                body.indicator_id,
                body.variant_id,
                occurred_on,
                score,
            )
    return _row_to_dict(row)


@router.get("")
async def list_logs(
    date_from: dt.date | None = None,
    date_to: dt.date | None = None,
    user_id: str = Depends(current_user_id),
) -> list[dict]:
    user_uuid = uuid.UUID(user_id)
    query = "SELECT * FROM log_entry WHERE user_id = $1"
    params: list = [user_uuid]
    if date_from is not None:
        params.append(date_from)
        query += f" AND occurred_on >= ${len(params)}"
    if date_to is not None:
        params.append(date_to)
        query += f" AND occurred_on <= ${len(params)}"
    query += " ORDER BY occurred_at DESC"
    async with pool().acquire() as con:
        rows = await con.fetch(query, *params)
    return [_row_to_dict(r) for r in rows]


@router.delete("/{log_id}", status_code=204)
async def delete_log(log_id: uuid.UUID, user_id: str = Depends(current_user_id)) -> None:
    async with pool().acquire() as con:
        result = await con.execute(
            "DELETE FROM log_entry WHERE id = $1 AND user_id = $2",
            log_id,
            uuid.UUID(user_id),
        )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="log entry not found")
