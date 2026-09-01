## Context

See proposal.md — Why. Current state relevant to the approach:
- `indicator` table has no category concept; `routes/indicators.py` maps a fixed column list in `_row_to_dict` and explicit INSERT/UPDATE statements.
- `DELETE /logs/{id}` already exists and is owner-scoped; `web/src/api.js` already exposes `deleteLog(id)`. The dashboard just never calls it.
- `Dashboard.jsx` refreshes everything off a `refreshSignal` counter passed from `App.jsx`; the chart/day effects both depend on it.
- `Nav.jsx` renders `<h1 class="nav-title">` with an `<img class="nav-icon">`; tab state lives in `App.jsx` (`tab`, `setTab`).
- No shared front-end constants module exists yet.

## Goals / Non-Goals

**Goals:**
- One authoritative definition of the category set + colors, shared by all front-end surfaces, mirrored by a back-end whitelist.
- Category is optional end-to-end; absence is a first-class "Sin categoría" state, not an error.
- Log deletion reuses the existing endpoint and the existing refresh mechanism.

**Non-Goals:**
- User-defined or user-recolored categories.
- Multi-category / tagging.
- Migrating or backfilling existing indicators (they simply read as `Sin categoría`).
- Confirmation dialogs or undo for deletion.
- Reworking the tab system into a router.

## Decisions

### Category set lives in code, not the database
A fixed `CATEGORIES` list is defined in `web/src/categories.js` (id, label, color) and mirrored as a plain set of allowed values in `routes/indicators.py`. Rationale: the set is small, product-owned, and needs an associated color the DB has no reason to hold. Alternative considered: a `category` table seeded on startup — rejected as overkill for a closed set with no CRUD.

Stored representation: the category **label string** (e.g. `"Salud"`) in a nullable `indicator.category` column. `NULL` means uncategorized. Alternative considered: a short slug/enum — rejected to keep the API response directly human-readable and avoid a mapping layer; the set is stable.

### Colors
Each category gets one hex color chosen to stay legible as a button background in the existing dark theme, distinct from the others and from the current `btn-log` blue. `Sin categoría` keeps the current blue so untouched indicators look unchanged. Colors are applied via inline `style={{ backgroundColor }}` on the `btn-log` element (and a matching hover handled in CSS via a CSS custom property `--cat-color` set inline), avoiding seven new CSS classes.

### Back-end validation
`IndicatorCreate` / `IndicatorUpdate` gain `category: str | None = None`. Validation: if `category` is not `None` and not in `ALLOWED_CATEGORIES`, raise `HTTPException(422)`. `_row_to_dict` adds `"category": row["category"]`. INSERT and UPDATE statements add the column. `PATCH` keeps the existing "None means leave unchanged" convention — a client that wants to clear the category is out of scope (edit form always sends an explicit value, and "Sin categoría" is sent as `null`... see risk below).

### Schema migration
`schema.sql` is applied idempotently on every startup. Add:
`ALTER TABLE indicator ADD COLUMN IF NOT EXISTS category text;`
No `CHECK` constraint — validation is in the API so the allowed set can evolve without a migration.

### Front-end grouping
`IndicatorManager` builds groups by iterating `CATEGORIES` in declared order, filtering the (already search-filtered, already sorted) indicators for each, then appending a `Sin categoría` group for those whose `category` is null or unrecognized. Empty groups are skipped. `QuickLogBar` stays a flat list (its job is speed) but each button gets its category color.

### Log deletion + refresh
`Dashboard.jsx` gets a `handleDeleteEntry(id)` that calls `api.deleteLog(id)` then bumps refresh. Because both the chart effect and the day effect key off the refresh signal, one bump refreshes everything. Cleanest wiring: lift a local `localRefresh` counter in `Dashboard` OR route through `App`'s `refreshSignal`. Decision: add an `onEntryDeleted` callback from `App` (reuse the same `setRefreshSignal((n) => n + 1)` used by `handleQuickLog`) so today/yesterday/best-day — all derived from the chart data inside `Dashboard` — recompute too. The trash control is a `<button class="entry-delete">` with an inline SVG or a `🗑` glyph; row layout in `App.css` `.entry-row` changes from two columns to name / score / action.

### Header
`.nav` CSS: remove any fixed height, set `padding` to a small vertical value, `align-items: center`. `.nav-title` becomes a `<button>` (or `<a role>`), styled to strip default button chrome, `cursor: pointer`, calling `onTabChange("dashboard")`. `.nav-icon` height becomes the reference (e.g. `1.75rem`); title font-size ≤ icon height so it never drives header height.

## Risks / Trade-offs

- **Clearing a category via PATCH** → The `PATCH` convention treats `None` as "unchanged", so a user moving an indicator back to "Sin categoría" can't be expressed as `null`. Mitigation: the edit form sends the literal string for real categories and, for "Sin categoría", we accept a sentinel `""` (empty string) which the API maps to `NULL`. Documented in tasks; validation allows `"" → NULL`.
- **Unrecognized stored category** (set changes later) → front-end falls back to the `Sin categoría` group/color; no crash. Acceptable.
- **No delete confirmation** → accidental data loss. Accepted per explicit product decision; the entry can be re-logged.
- **Inline colors vs. theme** → hand-picked palette may clash if the theme changes later. Contained to one file (`categories.js`).

## Migration Plan

1. Ship schema `ALTER TABLE` (idempotent, safe on redeploy).
2. Deploy API (backward compatible: `category` optional in, always present out).
3. Deploy web. Existing indicators show under `Sin categoría` until edited.
Rollback: revert web + API; the unused `category` column can stay (harmless) or be dropped manually.
