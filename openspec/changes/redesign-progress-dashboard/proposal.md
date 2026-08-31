## Why

The current dashboard's week/month/year views and the squares-based heatmap are hard to read at a glance and add navigation overhead. The user wants a single, always-relevant view: a bar chart of recent daily totals (today always visible), plus at-a-glance comparison stats (today vs. yesterday, best day by points, best day by entries).

## What Changes

- **BREAKING**: Remove the week/month/year dashboard views and the day/week/month/year granularity switcher and its prev/next navigation.
- Replace the squares-based heatmap with a horizontal bar chart: one bar per day, bar height/length proportional to that day's total score.
- The chart shows as many trailing days as fit the available page width (responsive), not a fixed count.
- The chart's horizontal scroll starts positioned at the end so today's bar is visible by default; the user can scroll left to see earlier days.
- Selecting a bar shows that day's log entries below the chart (same detail previously shown by the "day" view); the day view is now the only period detail shown.
- Add summary stats above/alongside the chart: today's total, yesterday's total, the delta and direction (up/down) vs. yesterday, the day with the highest total score, and the day with the most log entries — computed from the existing trailing-history data.
- Extend `GET /dashboard/heatmap` day entries to include each day's log entry count (`entry_count`) alongside its existing `total`, since "day with most entries" cannot be derived from total score alone.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `progress-dashboard`: replaces the day/week/month/year views and squares heatmap with a single responsive bar-chart view (today-anchored, day-detail-on-select) plus today-vs-yesterday and best-day summary stats; extends the heatmap/history data with per-day entry counts.

## Impact

- `web/src/components/Dashboard.jsx`, `web/src/components/Heatmap.jsx` (likely renamed/rewritten as a bar chart component) — remove granularity switcher and week/month/year rendering, add responsive bar chart + summary stats.
- `web/src/api.js` — drop now-unused week/month/year dashboard calls if no longer needed elsewhere.
- `server/kaizen_api/routes/dashboard.py`, `server/kaizen_api/schema.sql` (or query layer) — extend `/dashboard/heatmap` response with `entry_count` per day. The `/dashboard/week`, `/dashboard/month`, `/dashboard/year` endpoints are left in place (unused by the new UI, no other known consumers) to avoid unnecessary backend churn; only `/dashboard/heatmap` changes shape.
- CSS for `.heatmap*` classes replaced with bar-chart styling.
