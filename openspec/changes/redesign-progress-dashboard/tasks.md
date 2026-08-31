## 1. Backend: entry counts in daily history

- [x] 1.1 Update `_daily_totals` in `server/kaizen_api/routes/dashboard.py` to also return `COUNT(*)` per day (rename/extend to return `{date: {total, entry_count}}`), and verify `pytest` still passes with the updated shape
- [x] 1.2 Update `heatmap()` in `server/kaizen_api/routes/dashboard.py` to include `entry_count` per day in its `days` list, verify with `curl .../dashboard/heatmap` (or a test) that each day object has both `total` and `entry_count`
- [x] 1.3 Add/update a test in `server/tests/` covering a day with multiple log entries returning the correct `entry_count`, and verify it passes

## 2. Frontend: bar chart component

- [x] 2.1 Create `web/src/components/DailyBarChart.jsx` (or similar) replacing `Heatmap.jsx`: renders one bar per day from the fetched `days` array, bar length proportional to `total`, horizontally scrollable container
- [x] 2.2 Implement responsive visible-day sizing so the chart fills the available width without a fixed day count
- [x] 2.3 On mount and whenever the fetched `days` data changes, set the chart container's `scrollLeft` to `scrollWidth` so the most recent day's bar is visible by default; verify by loading the dashboard and confirming no manual scroll is needed to see it
- [x] 2.4 Wire bar click to select that day (replacing the heatmap column's `onSelectDay`), with the clicked/selected day visually highlighted
- [x] 2.5 Remove `web/src/components/Heatmap.jsx` and its `.heatmap*` CSS, replacing with bar-chart styling (light/positive/negative treatment per bar)
- [x] 2.6 Use Recharts for the bar chart (animated bars, tooltip) instead of hand-rolled CSS bars; add `recharts` to `web/package.json`
- [x] 2.7 Filter days with a total of 0 out of the chart so they render no bar
- [x] 2.8 Add a loading skeleton shown while `/dashboard/heatmap` is in flight, and an empty state when there is no nonzero-total data

## 3. Frontend: dashboard summary stats

- [x] 3.1 In `Dashboard.jsx`, derive today's total, yesterday's total, and their delta/direction from the fetched daily history; verify the correct sign/direction renders for an up day, a down day, and an equal day
- [x] 3.2 Derive the best-day-by-total and best-day-by-entry-count from the fetched daily history, using "most recent day wins" for ties; render each as date + value
- [x] 3.3 Handle the no-history-yet case (e.g. brand-new user) by showing sensible defaults (0s / "no data") instead of crashing on an empty `days` array
- [x] 3.4 Order stat cards as: yesterday, then today (today's card includes the vs.-yesterday delta/direction inline), then max-score day, then max-entries day

## 4. Frontend: remove week/month/year views

- [x] 4.1 Remove the granularity switcher, `week`/`month`/`year` branches of `PeriodView`, and the associated prev/next navigation logic from `Dashboard.jsx`, keeping only the day-detail rendering (entries + total) driven by the selected bar
- [x] 4.2 Remove now-unused `dashboardWeek`/`dashboardMonth`/`dashboardYear` calls from `web/src/api.js` if nothing else references them (grep `web/src` first to confirm), and verify the app still builds (`npm run build`)
- [ ] 4.3 Verify in the browser: dashboard loads with today selected and visible, today-vs-yesterday and best-day stats show correct values, clicking an earlier bar updates the detail list below, and scrolling the chart left reveals earlier days

## 5. Deploy

- [x] 5.1 Run `pytest` in `server/` and `npm run build` in `web/`, confirm both succeed
- [x] 5.2 Deploy per `server/README.md` (`docker compose up -d --build` in `server/` and `web/` on the host), then check `/health` and the live dashboard render the new chart correctly
