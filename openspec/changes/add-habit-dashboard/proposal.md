## Why

There is currently no way to track the small daily actions and decisions that compound into "being your 1% better version" — habits, health choices, discipline. Existing habit trackers don't support custom, per-action scoring rules (e.g. first Instagram check of the day is neutral, every one after costs a point; sugar-free tea always earns a point) or a fast, GitHub-contributions-style visual read of progress across day/week/month/year.

## What Changes

- Add the ability to define custom **indicators** (trackable actions/decisions), each with a scoring rule that determines how logging an occurrence affects the day's score (e.g. flat +1 every time, +1 only once then +0/-1 for extras, +1/+0 based on a variant of the action).
- Add the ability to **log occurrences** of an indicator (with timestamp), which are scored according to that indicator's rule and roll up into a daily total.
- Add a **progress dashboard** with a GitHub-contributions-style heatmap (one cell per day, color intensity by daily score) plus day/week/month/year aggregate views, for a fast visual read of the "1% growth" trend.
- Add **auth integration** with the platform's shared GoTrue identity provider so each user's indicators, logs, and dashboard are scoped to their own account (multi-user from day one).

## Capabilities

### New Capabilities
- `indicator-management`: create, edit, and archive personal indicators, each with a configurable scoring rule.
- `action-logging`: record occurrences of an indicator and compute the score contribution of each occurrence per its indicator's rule.
- `progress-dashboard`: aggregate logged scores into day/week/month/year views and a GitHub-style activity heatmap.
- `auth-integration`: authenticate users via the platform's shared GoTrue instance and scope all indicators/logs/dashboard data to the authenticated user.

### Modified Capabilities
(none — this is a new application, no pre-existing specs)

## Impact

- New backend service (FastAPI + asyncpg) reading/writing a new `kaizen` database on the platform's shared Postgres, following the same JWT-verification pattern as `nurk-api` against the shared GoTrue instance.
- New Postgres role/database (`kaizen_app` / `kaizen`) to add to `infra/platform/postgres/init`.
- New frontend SPA (dashboard) served as static assets via nginx, routed through the shared Traefik reverse proxy on a new subdomain.
- No existing project/capability is modified; this is a net-new application in this repo.
