-- Applied idempotently on every startup. Greenfield project: plain
-- CREATE ... IF NOT EXISTS is enough; a migration tool can come later.

CREATE TABLE IF NOT EXISTS indicator (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               uuid NOT NULL,                 -- GoTrue token `sub`
    name                  text NOT NULL,
    rule_type             text NOT NULL
                          CHECK (rule_type IN ('per_occurrence', 'first_then_repeat', 'variant')),
    -- rule_type = per_occurrence
    per_occurrence_value  integer,
    -- rule_type = first_then_repeat
    first_value           integer,
    repeat_value          integer,
    archived_at           timestamptz,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS indicator_user_idx ON indicator (user_id);

CREATE TABLE IF NOT EXISTS indicator_variant (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_id  uuid NOT NULL REFERENCES indicator (id) ON DELETE CASCADE,
    label         text NOT NULL,
    value         integer NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS indicator_variant_indicator_idx ON indicator_variant (indicator_id);

CREATE TABLE IF NOT EXISTS log_entry (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL,                         -- GoTrue token `sub`
    indicator_id  uuid NOT NULL REFERENCES indicator (id) ON DELETE CASCADE,
    variant_id    uuid REFERENCES indicator_variant (id) ON DELETE SET NULL,
    occurred_on   date NOT NULL,                          -- day this log counts toward
    occurred_at   timestamptz NOT NULL DEFAULT now(),      -- exact instant, for ordering same-day logs
    score         integer NOT NULL,                        -- fixed at write time, never recomputed
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- Powers day/week/month/year aggregation and the heatmap (range scan by user + date).
CREATE INDEX IF NOT EXISTS log_entry_user_day_idx ON log_entry (user_id, occurred_on);
-- Powers the same-day-count-so-far lookup for the first_then_repeat rule.
CREATE INDEX IF NOT EXISTS log_entry_indicator_day_idx ON log_entry (indicator_id, occurred_on);
