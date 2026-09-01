import pytest
from fastapi import HTTPException

from kaizen_api.routes.indicators import ALLOWED_CATEGORIES, _normalize_category


def test_none_stays_none():
    assert _normalize_category(None) is None


def test_empty_string_clears_to_none():
    assert _normalize_category("") is None


@pytest.mark.parametrize("category", sorted(ALLOWED_CATEGORIES))
def test_allowed_category_passes_through(category):
    assert _normalize_category(category) == category


def test_unknown_category_rejected():
    with pytest.raises(HTTPException) as exc:
        _normalize_category("Deportes")
    assert exc.value.status_code == 422
