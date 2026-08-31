import pytest

from kaizen_api.scoring import Indicator, ScoringError, score_occurrence, validate_indicator_rule


def test_per_occurrence_always_same_value():
    healthy_eating = Indicator("per_occurrence", per_occurrence_value=1, first_value=None, repeat_value=None)
    assert score_occurrence(healthy_eating) == 1
    assert score_occurrence(healthy_eating, prior_occurrences_today=5) == 1


def test_first_then_repeat_first_occurrence_today():
    instagram = Indicator("first_then_repeat", per_occurrence_value=None, first_value=0, repeat_value=-1)
    assert score_occurrence(instagram, prior_occurrences_today=0) == 0


def test_first_then_repeat_second_occurrence_today():
    instagram = Indicator("first_then_repeat", per_occurrence_value=None, first_value=0, repeat_value=-1)
    assert score_occurrence(instagram, prior_occurrences_today=1) == -1
    assert score_occurrence(instagram, prior_occurrences_today=2) == -1


def test_variant_uses_selected_variant_value():
    tea = Indicator("variant", per_occurrence_value=None, first_value=None, repeat_value=None)
    assert score_occurrence(tea, variant_value=0) == 0  # con azucar
    assert score_occurrence(tea, variant_value=1) == 1  # sin azucar


def test_variant_without_selection_raises():
    tea = Indicator("variant", per_occurrence_value=None, first_value=None, repeat_value=None)
    with pytest.raises(ScoringError):
        score_occurrence(tea)


def test_validate_per_occurrence_requires_value():
    with pytest.raises(ScoringError):
        validate_indicator_rule(
            "per_occurrence", per_occurrence_value=None, first_value=None, repeat_value=None, variants=None
        )


def test_validate_first_then_repeat_requires_both_values():
    with pytest.raises(ScoringError):
        validate_indicator_rule(
            "first_then_repeat", per_occurrence_value=None, first_value=0, repeat_value=None, variants=None
        )


def test_validate_variant_requires_at_least_one_variant():
    with pytest.raises(ScoringError):
        validate_indicator_rule(
            "variant", per_occurrence_value=None, first_value=None, repeat_value=None, variants=[]
        )
    validate_indicator_rule(
        "variant", per_occurrence_value=None, first_value=None, repeat_value=None, variants=[("sin azucar", 1)]
    )
