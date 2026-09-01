## Why

Three rough edges are slowing down daily use of Kaizen: logged entries can only be created, never removed from the dashboard where mistakes are noticed; the "Kaizen" header is oversized and its logo/title are dead (not a way back home); and indicators are an undifferentiated flat list where every logging button is the same blue, making a growing list hard to scan. Grouping indicators into a small set of generic categories, each with its own color, fixes the last two problems at once.

## What Changes

- **Delete a logged entry from the dashboard.** Each row in the selected day's entry list gets a trash icon; activating it deletes that `log_entry` immediately (no confirmation) via the existing `DELETE /logs/{id}` endpoint, and the dashboard totals/chart refresh.
- **Header (`Nav`) rework.** The header height matches the height of its icon. The icon and the "Kaizen" title become a single clickable control that navigates to the home view (the dashboard tab).
- **Fixed indicator categories.** A predefined, system-owned set of categories: `Salud`, `Productividad`, `Relaciones`, `Finanzas`, `Crecimiento personal`, `Ocio y descanso`, plus an implicit `Sin categoría` default. Categories are not user-editable.
- **Each indicator belongs to exactly one category.** New nullable `category` column on `indicator` (null renders as `Sin categoría`). Create/edit forms gain a category selector. `indicators` API accepts and returns `category`.
- **Category-colored logging controls.** Each category has an assigned color. The indicator's logging button (`btn-log`, currently always blue) is rendered in its category's color in both `QuickLogBar` and `IndicatorManager`.
- **Grouped indicator list.** `IndicatorManager` groups indicators under category headings instead of one flat alphabetical list.

## Capabilities

### New Capabilities
- `app-navigation`: the app's top-level header/navigation shell — its sizing and the way users return to the home view.

### Modified Capabilities
- `indicator-management`: indicators gain a single fixed category, a category selector in create/edit, a category-colored logging control, and a category-grouped list.
- `action-logging`: a user can delete one of their log entries directly from the dashboard day-detail list.
- `progress-dashboard`: the day-detail entry list exposes a per-entry delete control and refreshes totals after a deletion.

## Impact

- **DB**: `server/kaizen_api/schema.sql` — add `category text` to `indicator` (idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
- **API**: `server/kaizen_api/routes/indicators.py` — `IndicatorCreate`, `IndicatorUpdate`, `_row_to_dict`, INSERT/UPDATE statements carry `category`; validate against the fixed set. No change to `routes/logs.py` (delete endpoint already exists).
- **Web**: `web/src/api.js` (no change — `deleteLog` exists), `web/src/components/Dashboard.jsx` (delete control + refresh), `web/src/components/Nav.jsx` + `web/src/App.css` (header sizing, clickable home), `web/src/components/IndicatorForm.jsx` (category selector), `web/src/components/IndicatorManager.jsx` (grouping + colored button), `web/src/components/QuickLogBar.jsx` (colored button), a shared categories module (`web/src/categories.js`).
- **Tests**: `server/tests/` — indicator category acceptance/validation; existing log-delete tests already cover the endpoint.
