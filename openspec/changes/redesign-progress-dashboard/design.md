## Context

Current dashboard (`web/src/components/Dashboard.jsx` + `Heatmap.jsx`) has a granularity switcher (day/week/month/year) backed by four endpoints (`/dashboard/day|week|month|year`) plus a separate `/dashboard/heatmap` endpoint (20 trailing days rendered as 5-square columns). See `proposal.md` for why this is being replaced. `specs/progress-dashboard/spec.md` (this change) defines the required behavior.

## Goals / Non-Goals

**Goals:**
- Single component render path: bar chart (trailing days, responsive count, anchored to today) + selected-day detail + summary stats.
- Reuse `/dashboard/heatmap` and `/dashboard/day` as the only backend calls the new dashboard needs.

**Non-Goals:**
- No backend removal of `/dashboard/week`, `/dashboard/month`, `/dashboard/year` (proposal explicitly leaves them in place; no other known consumer, low cost to leave, avoids unrelated churn).
- No virtualization/pagination of history beyond what `/dashboard/heatmap`'s existing `date_from`/`date_to` window already provides (still capped at trailing 12 months by default).
- No backend-side filtering of zero-total days — the client filters `days` down to entries with a nonzero total before rendering/sizing the chart.

## Decisions

**Recharts for the bar chart, not hand-rolled CSS/SVG bars.** Gives animated bar transitions, a tooltip, and a `ResponsiveContainer` for free, matching the ask for a "librería de gráficas bonita con animaciones". Alternative considered: keep the hand-rolled CSS bars from the first pass — rejected because it had no animation/tooltip and reinvented what a chart library already does well; the added bundle size (~110kB gzipped) is accepted for a habit-tracking dashboard with a single chart.

**Zero-total days are filtered out client-side before charting; scroll still anchors to the end.** `days.filter(d => d.total !== 0)` runs before computing chart width and before mount, so "most recent day with a bar" lands at the scrolled-to-end position — there is no different anchoring logic for the filtered vs. unfiltered case, just a smaller `data` array feeding the same "scrollLeft = scrollWidth" approach.

**Fixed per-bar width (`MIN_BAR_SLOT`) inside a horizontally scrollable container, not a `ResizeObserver`-driven fill.** With Recharts, chart width is `data.length * MIN_BAR_SLOT` inside a scrollable wrapper; `ResponsiveContainer` fills that width. This keeps "as many days as fit the width" true by construction (the container's visible width naturally shows only as many bars as fit) without needing to measure and recompute a visible-day count on every resize. Alternative considered: measuring container width via `ResizeObserver` to stretch/shrink bars to exactly fill it (the first-pass approach) — rejected as unnecessary complexity now that Recharts owns rendering; native overflow scrolling already satisfies the responsive-width requirement.

**Loading state is a CSS shimmer skeleton shown while `/dashboard/heatmap` is in flight**, swapped for the chart once data arrives; a separate "no data yet" empty state covers the case where the fetch succeeds but every day is zero/empty.

**Chart and stats are scoped to a trailing 20-day window (today + 19 prior days), fetched via `/dashboard/heatmap?date_from=...&date_to=today`.** Matches the 20-day span the original heatmap showed (`VISIBLE_DAYS`). Best-day-by-score/entries and the chart's data are computed from this same fetched window, so they stay consistent with what's visible (scrolling further back is not possible; there is no page/expand action to see older history yet).

**`entry_count` added to `/dashboard/heatmap` response, not a new endpoint.** `_daily_totals` in `server/kaizen_api/routes/dashboard.py` becomes a query returning both `SUM(score)` and `COUNT(*)` per day; `/dashboard/heatmap` days become `{date, total, entry_count}`. Alternative considered: a separate `/dashboard/stats` endpoint precomputing today/yesterday/best-day server-side — rejected for now since the client already has the full trailing-history array and can derive all four stats (today, yesterday, best-by-score, best-by-entries) client-side in O(n) without another round trip; revisit only if the history window grows large enough to matter.

**Best-day tie-break: most recent day wins**, applied client-side when scanning the history array (iterate chronologically, use `>=` so a later equal value replaces the earlier one).

**Selected day defaults to today and detail reuses the existing `/dashboard/day` call** (`api.dashboardDay(date)`), unchanged — only the day-selection UI changes (bar click instead of heatmap-column click), not the detail-fetch mechanism.

## Risks / Trade-offs

- [Best-day highlights only reflect the visible 20-day window, not full history] → Acceptable per this iteration's explicit "last 20 days" scope; revisit (wider window, or a dedicated stats endpoint) if the user later wants longer-range highlights.
- [`ResizeObserver` + `scrollLeft` timing on first paint could show an unstyled/zero-width flash] → Compute initial visible-day count from `container.clientWidth` in a layout effect before first paint of bars; fall back to a reasonable default (e.g. 14 days) if width is 0 (e.g. hidden tab).
- [Removing week/month/year views is a BREAKING UI change for any existing user muscle memory] → Explicitly called out as BREAKING in the proposal; acceptable per user's explicit request.
