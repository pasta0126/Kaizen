## Context

See proposal.md - Why. This is a net-new application deployed on the shared `void-server` infra: one Traefik reverse proxy (TLS via `northernarchive.com`), one shared Postgres 17 instance (per-tenant role/database, e.g. `nurk_app`/`nurk`), and one shared GoTrue instance issuing HS256 JWTs (`auth.northernarchive.com`) that tenant backends verify locally with the shared `PLATFORM_JWT_SECRET`. `nurk-api` (FastAPI + asyncpg + pyjwt, no ORM, plain `schema.sql`) is the closest existing precedent for a new tenant API on this host.

## Goals / Non-Goals

**Goals:**
- Reuse the platform's shared Postgres and GoTrue rather than standing up new auth/data infra.
- Keep the backend a thin, stateless API following the `nurk-api` pattern (FastAPI, asyncpg, JWT verification, no ORM).
- Make the dashboard (heatmap + day/week/month/year) fast and interactive, which favors a client-rendered SPA over server-rendered HTML.

**Non-Goals:**
- Native mobile app (web app only, per proposal).
- Local-only/offline mode — the app always talks to the backend API.
- Row-Level Security in Postgres — scoping is enforced in application queries, consistent with how `nurk-api` already does it on this host.

## Decisions

### Backend: FastAPI + asyncpg (mirrors nurk-api)
Chosen over the .NET pattern also present on this host (`foodprint`, `webtest`) because it's a CRUD+aggregation-heavy API, not a compute-heavy service, and reusing `nurk-api`'s auth verification code (`verify_token` against the shared `PLATFORM_JWT_SECRET`) is close to a direct copy, minimizing new patterns on the host.
- New Postgres role/database `kaizen_app` / `kaizen`, added to `infra/platform/postgres/init/01-init-roles-databases.sh` the same way `nurk_app`/`nurk` was added.
- Plain SQL schema (`schema.sql`) + asyncpg, no ORM — consistent with `nurk-api`.
- Score for a log entry is computed and stored server-side at write time (see "Score is computed and stored at write time" below), not recomputed on every read.

### Frontend: React + Vite SPA, static build served by nginx
Chosen over a server-rendered app (like `genealogia-web`'s Express+Nunjucks) because the dashboard's core interactions — heatmap hover/select, switching day/week/month/year, live score updates after logging — are client-side and benefit from a component model and a charting library, and a static build served by nginx (like `nurk-web`) needs no Node runtime in production.
- Charting/heatmap implementation library is an implementation detail left to tasks.md, not a spec-level or architectural decision.

### Score is computed and stored at write time
When a log entry is created, the backend computes its score immediately from the indicator's current rule (and, for `first-then-repeat`, same-day prior log count for that indicator) and stores it on the log row. Alternative considered: compute scores on every read by re-evaluating the rule against historical logs. Rejected because (a) it would require keeping full rule-change history to stay correct, and (b) `action-logging` spec requires that editing a rule must not retroactively change already-logged scores — storing the score at write time makes that guarantee trivial instead of requiring rule versioning.

### first-then-repeat same-day counting uses a DB transaction
Determining "is this the first occurrence today" requires counting existing same-day logs for that indicator. This SHALL be done inside the same transaction that inserts the new log row (`SELECT ... FOR UPDATE`/serializable insert ordering) to avoid a race where two concurrent logs both see "zero prior logs today" and are both scored as the first occurrence.

### No Row-Level Security; scoping enforced in queries
Every query filters by the `user_id` derived from the verified JWT `sub` claim (`auth-integration` requirement), matching how `nurk-api` scopes data today, rather than introducing Postgres RLS policies as a new pattern on this host.

## Risks / Trade-offs

- [Indicator rule changes don't rescore history] → Documented, intended behavior per the `action-logging` spec (scores are fixed at log time); dashboard trend lines stay stable across rule edits instead of silently shifting.
- [Heatmap over a rolling year requires scanning/aggregating many log rows] → Mitigate with an index on `(user_id, occurred_on)` and a daily-total aggregation query (or materialized view) rather than summing raw logs per page load.
- [Concurrent logging race for first-then-repeat rule] → Mitigated by transactional same-day counting (see Decisions).

## Migration Plan

Greenfield deploy, no existing data or users to migrate:
1. Add `kaizen_app`/`kaizen` role and database to `infra/platform/postgres/init/01-init-roles-databases.sh`, restart `platform-postgres` to apply (or apply manually if the volume already exists, since the init script only runs on first cluster init).
2. Apply `schema.sql` to the new `kaizen` database.
3. Deploy `kaizen-api` (FastAPI) container behind Traefik on a new subdomain (e.g. `kaizen-api.northernarchive.com`), env-configured with the shared `PLATFORM_JWT_SECRET`.
4. Deploy `kaizen-web` (static SPA build via nginx) behind Traefik on a new subdomain (e.g. `kaizen.northernarchive.com`).
5. Rollback: stop/remove the two new containers; the shared platform Postgres/GoTrue are untouched since no other tenant depends on the `kaizen` database.
