import datetime as dt

from kaizen_api.routes.dashboard import _build_days_list


def test_days_with_data_include_total_and_entry_count():
    start = dt.date(2026, 1, 1)
    end = dt.date(2026, 1, 3)
    totals = {dt.date(2026, 1, 2): {"total": 3, "entry_count": 2}}

    days = _build_days_list(totals, start, end)

    assert days == [
        {"date": "2026-01-01", "total": 0, "entry_count": 0},
        {"date": "2026-01-02", "total": 3, "entry_count": 2},
        {"date": "2026-01-03", "total": 0, "entry_count": 0},
    ]


def test_multiple_entries_same_day_sum_total_and_count():
    day = dt.date(2026, 1, 5)
    totals = {day: {"total": 1, "entry_count": 3}}

    days = _build_days_list(totals, day, day)

    assert days == [{"date": "2026-01-05", "total": 1, "entry_count": 3}]
