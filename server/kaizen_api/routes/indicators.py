import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..auth import current_user_id
from ..db import pool
from ..scoring import ScoringError, validate_indicator_rule

router = APIRouter(prefix="/indicators", tags=["indicators"])

# Fixed, product-owned set. Kept here (not a DB CHECK) so it can evolve without a
# migration. The matching colors live in the web app (web/src/categories.js).
ALLOWED_CATEGORIES = {
    "Salud",
    "Productividad",
    "Relaciones",
    "Finanzas",
    "Crecimiento personal",
    "Ocio y descanso",
}

def _normalize_category(value):
    """Map "" -> None (explicitly uncategorized); reject anything outside the set."""
    if value is None or value == "":
        return None
    if value not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=422, detail=f"unknown category: {value}")
    return value


class VariantIn(BaseModel):
    label: str
    value: int


class IndicatorCreate(BaseModel):
    name: str = Field(min_length=1)
    rule_type: str
    per_occurrence_value: int | None = None
    first_value: int | None = None
    repeat_value: int | None = None
    variants: list[VariantIn] | None = None
    category: str | None = None


class IndicatorUpdate(BaseModel):
    name: str | None = None
    rule_type: str | None = None
    per_occurrence_value: int | None = None
    first_value: int | None = None
    repeat_value: int | None = None
    variants: list[VariantIn] | None = None
    # Omitted -> unchanged. "" -> clear to uncategorized. A name -> set it.
    category: str | None = Field(default=None)


def _row_to_dict(row) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "rule_type": row["rule_type"],
        "category": row["category"],
        "per_occurrence_value": row["per_occurrence_value"],
        "first_value": row["first_value"],
        "repeat_value": row["repeat_value"],
        "archived_at": row["archived_at"].isoformat() if row["archived_at"] else None,
        "created_at": row["created_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
    }


async def _load_variants(con, indicator_id: uuid.UUID) -> list[dict]:
    rows = await con.fetch(
        "SELECT id, label, value FROM indicator_variant WHERE indicator_id = $1 ORDER BY created_at",
        indicator_id,
    )
    return [{"id": str(r["id"]), "label": r["label"], "value": r["value"]} for r in rows]


async def _get_owned_indicator(con, indicator_id: uuid.UUID, user_id: str):
    row = await con.fetchrow(
        "SELECT * FROM indicator WHERE id = $1 AND user_id = $2",
        indicator_id,
        uuid.UUID(user_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="indicator not found")
    return row


@router.post("", status_code=201)
async def create_indicator(body: IndicatorCreate, user_id: str = Depends(current_user_id)) -> dict:
    variant_pairs = [(v.label, v.value) for v in (body.variants or [])]
    try:
        validate_indicator_rule(
            body.rule_type,
            per_occurrence_value=body.per_occurrence_value,
            first_value=body.first_value,
            repeat_value=body.repeat_value,
            variants=variant_pairs,
        )
    except ScoringError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    category = _normalize_category(body.category)

    async with pool().acquire() as con:
        async with con.transaction():
            row = await con.fetchrow(
                """
                INSERT INTO indicator
                    (user_id, name, rule_type, per_occurrence_value, first_value, repeat_value, category)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
                """,
                uuid.UUID(user_id),
                body.name,
                body.rule_type,
                body.per_occurrence_value,
                body.first_value,
                body.repeat_value,
                category,
            )
            for v in body.variants or []:
                await con.execute(
                    "INSERT INTO indicator_variant (indicator_id, label, value) VALUES ($1, $2, $3)",
                    row["id"],
                    v.label,
                    v.value,
                )
            variants = await _load_variants(con, row["id"])
    return {**_row_to_dict(row), "variants": variants}


@router.get("")
async def list_indicators(
    include_archived: bool = False, user_id: str = Depends(current_user_id)
) -> list[dict]:
    query = "SELECT * FROM indicator WHERE user_id = $1"
    if not include_archived:
        query += " AND archived_at IS NULL"
    query += " ORDER BY created_at"
    async with pool().acquire() as con:
        rows = await con.fetch(query, uuid.UUID(user_id))
        result = []
        for row in rows:
            variants = await _load_variants(con, row["id"])
            result.append({**_row_to_dict(row), "variants": variants})
    return result


@router.get("/{indicator_id}")
async def get_indicator(indicator_id: uuid.UUID, user_id: str = Depends(current_user_id)) -> dict:
    async with pool().acquire() as con:
        row = await _get_owned_indicator(con, indicator_id, user_id)
        variants = await _load_variants(con, indicator_id)
    return {**_row_to_dict(row), "variants": variants}


@router.patch("/{indicator_id}")
async def update_indicator(
    indicator_id: uuid.UUID, body: IndicatorUpdate, user_id: str = Depends(current_user_id)
) -> dict:
    async with pool().acquire() as con:
        async with con.transaction():
            existing = await _get_owned_indicator(con, indicator_id, user_id)

            rule_type = body.rule_type if body.rule_type is not None else existing["rule_type"]
            per_occurrence_value = (
                body.per_occurrence_value
                if body.per_occurrence_value is not None
                else existing["per_occurrence_value"]
            )
            first_value = body.first_value if body.first_value is not None else existing["first_value"]
            # Omitted (None) -> keep; "" -> clear; a name -> set (validated).
            category = existing["category"] if body.category is None else _normalize_category(body.category)
            repeat_value = (
                body.repeat_value if body.repeat_value is not None else existing["repeat_value"]
            )

            if body.variants is not None:
                variant_pairs = [(v.label, v.value) for v in body.variants]
            else:
                variant_pairs = [(v["label"], v["value"]) for v in await _load_variants(con, indicator_id)]

            try:
                validate_indicator_rule(
                    rule_type,
                    per_occurrence_value=per_occurrence_value,
                    first_value=first_value,
                    repeat_value=repeat_value,
                    variants=variant_pairs,
                )
            except ScoringError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc

            row = await con.fetchrow(
                """
                UPDATE indicator
                SET name = $1, rule_type = $2, per_occurrence_value = $3,
                    first_value = $4, repeat_value = $5, category = $6, updated_at = now()
                WHERE id = $7
                RETURNING *
                """,
                body.name if body.name is not None else existing["name"],
                rule_type,
                per_occurrence_value,
                first_value,
                repeat_value,
                category,
                indicator_id,
            )

            if body.variants is not None:
                await con.execute("DELETE FROM indicator_variant WHERE indicator_id = $1", indicator_id)
                for v in body.variants:
                    await con.execute(
                        "INSERT INTO indicator_variant (indicator_id, label, value) VALUES ($1, $2, $3)",
                        indicator_id,
                        v.label,
                        v.value,
                    )

            variants = await _load_variants(con, indicator_id)
    return {**_row_to_dict(row), "variants": variants}


@router.post("/{indicator_id}/archive")
async def archive_indicator(indicator_id: uuid.UUID, user_id: str = Depends(current_user_id)) -> dict:
    async with pool().acquire() as con:
        await _get_owned_indicator(con, indicator_id, user_id)
        row = await con.fetchrow(
            "UPDATE indicator SET archived_at = now(), updated_at = now() WHERE id = $1 RETURNING *",
            indicator_id,
        )
        variants = await _load_variants(con, indicator_id)
    return {**_row_to_dict(row), "variants": variants}
