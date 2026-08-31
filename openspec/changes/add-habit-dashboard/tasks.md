## 1. Platform prep

- [x] 1.1 Add `kaizen_app` role and `kaizen` database to `infra/platform/postgres/init/01-init-roles-databases.sh` (mirroring the existing `nurk_app`/`nurk` block) and verify `platform-postgres` initializes them on a fresh volume (or apply the equivalent `CREATE ROLE`/`CREATE DATABASE` manually against the running instance if the data volume already exists)
- [x] 1.2 Add `KAIZEN_DB_PASSWORD` to the platform's environment and confirm `psql` can connect to `kaizen` as `kaizen_app`

## 2. Backend: project scaffolding

- [x] 2.1 Create `kaizen/server/` FastAPI project scaffolding (`pyproject`/`requirements.txt`, `Dockerfile`, `.env.example`) mirroring `nurk/server`, and verify `uvicorn` boots locally against the `kaizen` database
- [x] 2.2 Copy/adapt `nurk-api`'s JWT verification module (`auth.py`, `config.py`) to verify tokens against the shared `PLATFORM_JWT_SECRET`, and verify a unit test confirms a valid token resolves a user id and an invalid/expired token is rejected

## 3. Backend: data model

- [x] 3.1 Write `schema.sql` with `indicators`, `indicator_variants`, and `logs` tables (including `user_id`, `occurred_on`/timestamp, and a stored `score` column on `logs`) and apply it to the `kaizen` database
- [x] 3.2 Add an index on `logs (user_id, occurred_on)` and verify a query plan (`EXPLAIN`) uses it for a date-range scan

## 4. Backend: indicator-management API

- [x] 4.1 Implement create/list/get indicator endpoints (per-occurrence, first-then-repeat, and variant rule types) scoped to the authenticated user, and verify with tests covering each rule type per the `indicator-management` spec scenarios
- [x] 4.2 Implement update indicator (rename, rule config, variants) and verify a test confirms previously logged entries keep their original score after a rule change
- [x] 4.3 Implement archive indicator and verify a test confirms archived indicators are excluded from the active list but retained in historical queries
- [x] 4.4 Verify a test confirms one user cannot read another user's indicators (403/404 or empty result, per API convention)

## 5. Backend: action-logging API

- [x] 5.1 Implement create log entry endpoint that computes score at write time per the indicator's current rule, and verify tests for per-occurrence and variant rule scoring
- [x] 5.2 Implement transactional same-day counting for the first-then-repeat rule and verify a test simulating two near-concurrent logs both resolve to the correct first/repeat score (no double "first")
- [x] 5.3 Implement delete log entry endpoint and verify a test confirms the deleted entry no longer contributes to aggregate scores
- [x] 5.4 Verify a test confirms one user cannot delete another user's log entry

## 6. Backend: progress-dashboard API

- [x] 6.1 Implement a daily-totals aggregation endpoint/query and verify a test confirms the sum matches manually computed expected totals for a fixture set of logs
- [x] 6.2 Implement a heatmap endpoint returning per-day totals for a rolling 12-month window and verify a test confirms correct date range and totals
- [x] 6.3 Implement week/month/year aggregate endpoints with previous/next period navigation and verify tests for each granularity
- [x] 6.4 Verify a test confirms dashboard endpoints only return the authenticated user's data

## 7. Frontend: project scaffolding

- [x] 7.1 Create `kaizen/web/` React + Vite project, verify `npm run build` produces a static bundle
- [x] 7.2 Implement sign-in flow against the shared GoTrue instance and verify a logged-in session attaches a bearer token to API requests

## 8. Frontend: indicator management UI

- [x] 8.1 Build indicator list/create/edit/archive screens covering all three rule types and verify manually against the running API that each rule type can be created and edited

## 9. Frontend: logging UI

- [x] 9.1 Build a quick-log UI (one tap/click per indicator, variant picker when required) and verify manually that logging updates the day's visible total without a page reload

## 10. Frontend: dashboard UI

- [x] 10.1 Build the GitHub-style activity heatmap component and verify it renders correct color intensity for a fixture set of daily totals (positive/zero/negative distinguishable)
- [x] 10.2 Build day/week/month/year views with period navigation and verify manually that switching views and navigating periods shows correct aggregated data
- [x] 10.3 Verify selecting a heatmap day shows that day's individual log entries

## 11. Deployment

- [x] 11.1 Write `kaizen/server/docker-compose.yml` and Traefik labels for `kaizen-api.northernarchive.com`, mirroring `nurk-api`'s compose file, and verify the container is reachable through Traefik with a valid token
- [x] 11.2 Write `kaizen/web/docker-compose.yml`, nginx config, and Traefik labels for `kaizen.northernarchive.com`, mirroring `nurk-web`'s compose file, and verify the static site is reachable and successfully calls the API

## 12. End-to-end verification

- [x] 12.1 Manually walk through: sign in, create one indicator of each rule type, log occurrences (including a same-day repeat and a variant selection), and confirm the heatmap and day/week/month/year views reflect the expected totals
