import calendar
import datetime as dt
import uuid

from fastapi import APIRouter, Depends

from ..auth import current_user_id
from ..db import pool

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


async def _daily_totals(con, user_uuid: uuid.UUID, start: dt.date, end: dt.date) -> dict[dt.date, int]:
    rows = await con.fetch(
        """
        SELECT occurred_on, COALESCE(SUM(score), 0) AS total
        FROM log_entry
        WHERE user_id = $1 AND occurred_on >= $2 AND occurred_on <= $3
        GROUP BY occurred_on
        """,
        user_uuid,
        start,
        end,
    )
    return {r["occurred_on"]: r["total"] for r in rows}


def _week_bounds(date: dt.date) -> tuple[dt.date, dt.date]:
    start = date - dt.timedelta(days=date.weekday())  # Monday
    return start, start + dt.timedelta(days=6)


@router.get("/day")
async def day_view(date: dt.date | None = None, user_id: str = Depends(current_user_id)) -> dict:
    target = date or dt.date.today()
    user_uuid = uuid.UUID(user_id)
    async with pool().acquire() as con:
        totals = await _daily_totals(con, user_uuid, target, target)
        entries = await con.fetch(
            """
            SELECT id, indicator_id, variant_id, occurred_on, occurred_at, score
            FROM log_entry WHERE user_id = $1 AND occurred_on = $2
            ORDER BY occurred_at
            """,
            user_uuid,
            target,
        )
    return {
        "date": target.isoformat(),
        "total": totals.get(target, 0),
        "entries": [
            {
                "id": str(e["id"]),
                "indicator_id": str(e["indicator_id"]),
                "variant_id": str(e["variant_id"]) if e["variant_id"] else None,
                "occurred_at": e["occurred_at"].isoformat(),
                "score": e["score"],
            }
            for e in entries
        ],
    }


@router.get("/week")
async def week_view(date: dt.date | None = None, user_id: str = Depends(current_user_id)) -> dict:
    target = date or dt.date.today()
    start, end = _week_bounds(target)
    user_uuid = uuid.UUID(user_id)
    async with pool().acquire() as con:
        totals = await _daily_totals(con, user_uuid, start, end)
    days = []
    d = start
    while d <= end:
        days.append({"date": d.isoformat(), "total": totals.get(d, 0)})
        d += dt.timedelta(days=1)
    return {
        "week_start": start.isoformat(),
        "week_end": end.isoformat(),
        "total": sum(day["total"] for day in days),
        "days": days,
        "previous": (start - dt.timedelta(days=7)).isoformat(),
        "next": (start + dt.timedelta(days=7)).isoformat(),
    }


@router.get("/month")
async def month_view(
    year: int | None = None, month: int | None = None, user_id: str = Depends(current_user_id)
) -> dict:
    today = dt.date.today()
    year = year or today.year
    month = month or today.month
    start = dt.date(year, month, 1)
    end = dt.date(year, month, calendar.monthrange(year, month)[1])
    user_uuid = uuid.UUID(user_id)
    async with pool().acquire() as con:
        totals = await _daily_totals(con, user_uuid, start, end)
    days = []
    d = start
    while d <= end:
        days.append({"date": d.isoformat(), "total": totals.get(d, 0)})
        d += dt.timedelta(days=1)
    prev_month = start - dt.timedelta(days=1)
    next_month = end + dt.timedelta(days=1)
    return {
        "year": year,
        "month": month,
        "total": sum(day["total"] for day in days),
        "days": days,
        "previous": {"year": prev_month.year, "month": prev_month.month},
        "next": {"year": next_month.year, "month": next_month.month},
    }


@router.get("/year")
async def year_view(year: int | None = None, user_id: str = Depends(current_user_id)) -> dict:
    year = year or dt.date.today().year
    start = dt.date(year, 1, 1)
    end = dt.date(year, 12, 31)
    user_uuid = uuid.UUID(user_id)
    async with pool().acquire() as con:
        rows = await con.fetch(
            """
            SELECT EXTRACT(MONTH FROM occurred_on)::int AS month, COALESCE(SUM(score), 0) AS total
            FROM log_entry
            WHERE user_id = $1 AND occurred_on >= $2 AND occurred_on <= $3
            GROUP BY month
            """,
            user_uuid,
            start,
            end,
        )
    totals_by_month = {r["month"]: r["total"] for r in rows}
    months = [{"month": m, "total": totals_by_month.get(m, 0)} for m in range(1, 13)]
    return {
        "year": year,
        "total": sum(m["total"] for m in months),
        "months": months,
        "previous": year - 1,
        "next": year + 1,
    }


@router.get("/heatmap")
async def heatmap(
    date_from: dt.date | None = None,
    date_to: dt.date | None = None,
    user_id: str = Depends(current_user_id),
) -> dict:
    end = date_to or dt.date.today()
    start = date_from or (end - dt.timedelta(days=364))
    user_uuid = uuid.UUID(user_id)
    async with pool().acquire() as con:
        totals = await _daily_totals(con, user_uuid, start, end)
    days = []
    d = start
    while d <= end:
        days.append({"date": d.isoformat(), "total": totals.get(d, 0)})
        d += dt.timedelta(days=1)
    return {"from": start.isoformat(), "to": end.isoformat(), "days": days}
