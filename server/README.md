# kaizen-api

FastAPI backend for Kaizen. Talks to the shared platform Postgres (`kaizen` database),
authenticates requests by verifying GoTrue HS256 tokens, and is published at
`https://kaizen-api.northernarchive.com` via Traefik.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | no | liveness + DB check |
| POST | `/indicators` | yes | create an indicator (per_occurrence / first_then_repeat / variant rule) |
| GET | `/indicators` | yes | list the caller's indicators (`?include_archived=true` to include archived) |
| GET | `/indicators/{id}` | yes | get one indicator |
| PATCH | `/indicators/{id}` | yes | update name/rule/variants (never rescores past logs) |
| POST | `/indicators/{id}/archive` | yes | archive an indicator (history kept) |
| POST | `/logs` | yes | log an occurrence; score computed and stored immediately |
| GET | `/logs` | yes | list the caller's log entries (`?date_from=&date_to=`) |
| DELETE | `/logs/{id}` | yes | delete a log entry |
| GET | `/dashboard/day` | yes | a day's total + entries (`?date=`) |
| GET | `/dashboard/week` | yes | a week's per-day totals + prev/next (`?date=`) |
| GET | `/dashboard/month` | yes | a month's per-day totals + prev/next (`?year=&month=`) |
| GET | `/dashboard/year` | yes | a year's per-month totals + prev/next (`?year=`) |
| GET | `/dashboard/heatmap` | yes | per-day totals for a range, default trailing 12 months (`?date_from=&date_to=`) |

## Local development

```bash
python3.12 -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
pytest                       # unit tests (auth + scoring rules), no DB needed
```

To run against a database, set `DATABASE_URL` and `JWT_SECRET` and:
`uvicorn kaizen_api.main:app --reload --port 8080`

## Configuration (`server/.env` on the host)

See `.env.example`. `DATABASE_URL` uses `KAIZEN_DB_PASSWORD` and `JWT_SECRET` is the exact
`PLATFORM_JWT_SECRET`, both from `~/infra/platform/.env`. No `$` in values (Compose
interpolates `env_file`), verify with `docker compose exec kaizen-api printenv`.

## Deploy

On `void-server`: `docker compose up -d --build` from this directory.

The schema (`kaizen_api/schema.sql`) is applied idempotently on every startup.
