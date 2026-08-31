"""Pure scoring logic, independent of the database.

An indicator's rule determines the point value of one occurrence. Keeping
this pure (no DB access) means the rule math can be unit-tested directly,
and the score is always computed once, at log time (see db.py / routes/logs.py) -
editing a rule later never touches already-scored log entries.
"""

from dataclasses import dataclass


class ScoringError(ValueError):
    pass


@dataclass(frozen=True)
class Indicator:
    rule_type: str
    per_occurrence_value: int | None
    first_value: int | None
    repeat_value: int | None


def score_occurrence(
    indicator: Indicator,
    *,
    prior_occurrences_today: int = 0,
    variant_value: int | None = None,
) -> int:
    """Compute the score for one new occurrence of `indicator`.

    `prior_occurrences_today` is how many occurrences of this indicator were
    already logged for the same day, before this one (only meaningful for
    first_then_repeat). `variant_value` is the chosen variant's point value
    (only meaningful for the variant rule).
    """
    if indicator.rule_type == "per_occurrence":
        if indicator.per_occurrence_value is None:
            raise ScoringError("per_occurrence indicator missing per_occurrence_value")
        return indicator.per_occurrence_value

    if indicator.rule_type == "first_then_repeat":
        if indicator.first_value is None or indicator.repeat_value is None:
            raise ScoringError("first_then_repeat indicator missing first_value/repeat_value")
        return indicator.first_value if prior_occurrences_today == 0 else indicator.repeat_value

    if indicator.rule_type == "variant":
        if variant_value is None:
            raise ScoringError("variant indicator requires a variant to be selected")
        return variant_value

    raise ScoringError(f"unknown rule_type: {indicator.rule_type!r}")


def validate_indicator_rule(
    rule_type: str,
    *,
    per_occurrence_value: int | None,
    first_value: int | None,
    repeat_value: int | None,
    variants: list[tuple[str, int]] | None,
) -> None:
    """Raise ScoringError if the rule configuration is incomplete/invalid."""
    if rule_type == "per_occurrence":
        if per_occurrence_value is None:
            raise ScoringError("per_occurrence rule requires per_occurrence_value")
    elif rule_type == "first_then_repeat":
        if first_value is None or repeat_value is None:
            raise ScoringError("first_then_repeat rule requires first_value and repeat_value")
    elif rule_type == "variant":
        if not variants:
            raise ScoringError("variant rule requires at least one variant")
    else:
        raise ScoringError(f"unknown rule_type: {rule_type!r}")
