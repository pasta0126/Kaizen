## 1. Backend: indicator categories

- [x] 1.1 Add `ALTER TABLE indicator ADD COLUMN IF NOT EXISTS category text;` to `server/kaizen_api/schema.sql`; verify the API starts against a fresh and an existing DB without error.
- [x] 1.2 In `routes/indicators.py` define `ALLOWED_CATEGORIES = {"Salud", "Productividad", "Relaciones", "Finanzas", "Crecimiento personal", "Ocio y descanso"}` and a helper that normalizes `""` → `None` and rejects any other value not in the set with `HTTPException(422)`.
- [x] 1.3 Add `category: str | None = None` to `IndicatorCreate` and `IndicatorUpdate`; add `"category": row["category"]` to `_row_to_dict`.
- [x] 1.4 Include `category` in the INSERT (create) and the UPDATE (patch) statements, applying the normalize/validate helper; keep the existing "None = unchanged" PATCH convention except that `""` explicitly clears to `NULL`. Verify by unit test.
- [x] 1.5 Add tests in `server/tests/test_indicators.py` (create file if absent): create with valid category returns it; create without category returns `null`; invalid category → 422; patch changes category; patch `""` clears to `null`. Verify `pytest` passes.

## 2. Frontend: shared categories module

- [x] 2.1 Create `web/src/categories.js` exporting `CATEGORIES` (ordered array of `{ label, color }`) for the six categories plus an exported `UNCATEGORIZED = { label: "Sin categoría", color: <current btn-log blue> }`, and a `colorForCategory(category)` helper that falls back to the uncategorized color. Verify by importing in a component.

## 3. Frontend: indicator form + manager

- [x] 3.1 `IndicatorForm.jsx`: add a category `<select>` (options from `CATEGORIES` plus a "Sin categoría" option with value `""`), initialised from `initial?.category ?? ""`, and include `category` in the submitted body. Verify the create and edit flows send the value (network tab / test).
- [x] 3.2 `IndicatorManager.jsx`: replace the flat `visibleIndicators` list with per-category groups rendered in `CATEGORIES` order, each as a heading + `<ul>`, followed by a `Sin categoría` group; skip empty groups; keep the existing search filter and alphabetical sort within each group. Verify grouping and that empty categories are hidden.
- [x] 3.3 `IndicatorManager.jsx`: give each indicator's `btn-log` (the "Registrar" / variant buttons) an inline `style={{ backgroundColor: colorForCategory(ind.category) }}`. Verify buttons show category colors.

## 4. Frontend: quick log bar

- [x] 4.1 `QuickLogBar.jsx`: apply `style={{ backgroundColor: colorForCategory(ind.category) }}` to each indicator/variant `btn-log`. Verify colors match the manager.

## 5. Frontend: delete log entry from dashboard

- [x] 5.1 `App.jsx`: pass an `onEntryDeleted` prop to `Dashboard` that runs `setRefreshSignal((n) => n + 1)` (same as `handleQuickLog`).
- [x] 5.2 `Dashboard.jsx`: add `handleDeleteEntry(id)` → `await api.deleteLog(id); onEntryDeleted();`. Render a `<button className="entry-delete" aria-label="Eliminar registro">` with a trash glyph/SVG on each `.entry-row`, wired to `handleDeleteEntry(e.id)`.
- [x] 5.3 `App.css`: update `.entry-row` layout to fit name / score / delete control; style `.entry-delete` (ghost, hover danger color). Verify a deleted entry disappears and the chart + today/yesterday + best-day values update.

## 6. Frontend: header rework

- [x] 6.1 `Nav.jsx`: make the icon + "Kaizen" title a single `<button className="nav-home">` (or `<h1>` wrapping a button) that calls `onTabChange("dashboard")`; keep it keyboard focusable.
- [x] 6.2 `App.css`: remove fixed header height; set `.nav` to `align-items: center` with small vertical padding; set `.nav-icon` height as the size reference; ensure `.nav-title` font-size ≤ icon height. Verify header height equals icon height and clicking the logo from the Indicadores tab returns to the dashboard.

## 7. Validation

- [x] 7.1 Run `npx @fission-ai/openspec@latest validate enhance-indicators-and-logs --strict` and the web lint (`npm run lint` in `web/`) and backend `pytest`; verify all pass.
- [ ] 7.2 Manual smoke: create indicators in 3 categories, confirm grouped colored list, quick-log each, delete an entry from the dashboard, click the logo to return home.
