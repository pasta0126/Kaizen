## REMOVED Requirements

### Requirement: Activity heatmap
**Reason**: The squares-based calendar heatmap is replaced by a bar chart of recent daily totals; see "Recent-days bar chart" below.
**Migration**: No user data is affected. Users viewing the dashboard see the new bar chart in place of the heatmap; the same per-day totals are still available (now via the bar chart) and selecting a day still shows its detail.

#### Scenario: Heatmap reflects a day's score
- **WHEN** a day's total score is strongly positive
- **THEN** that day's heatmap cell is visually distinguishable from a day with a zero or negative score

#### Scenario: Selecting a heatmap day shows its detail
- **WHEN** a user selects a specific day on the heatmap
- **THEN** the system shows that day's individual log entries and their scores

### Requirement: Day, week, month, and year views
**Reason**: Week/month/year period views and the granularity switcher are removed in favor of a single, always-current bar chart plus day detail; period navigation (prev/next) no longer applies.
**Migration**: No user data is affected. Day-level detail remains available by selecting a day in the bar chart.

#### Scenario: Weekly view shows per-day breakdown
- **WHEN** a user opens the week view
- **THEN** the system shows each day of that week with its individual total score and the week's combined total

#### Scenario: Navigate to a previous period
- **WHEN** a user navigates to the previous month from the month view
- **THEN** the system shows that prior month's aggregated data

## ADDED Requirements

### Requirement: Recent-days bar chart
The system SHALL display a bar chart covering the trailing 20 days (today plus the 19 days before it), one bar per day, including only days within that window that have at least one logged entry (a past day with a total of 0, or no logged entries, SHALL NOT render a bar), except the current day, which SHALL always render a bar even if its total is 0. Each bar's height SHALL be proportional to that day's total score. The chart SHALL show as many days as fit the available page width, and its initial scroll position SHALL be at the end of the chart so today's bar is visible without scrolling. The user SHALL be able to scroll the chart to see earlier days within the 20-day window. The chart SHALL show a loading state while its data is being fetched.

#### Scenario: Chart opens anchored to today
- **WHEN** a user opens the dashboard
- **THEN** the bar chart is scrolled so today's bar is visible without any manual scrolling, whether or not today has a nonzero total

#### Scenario: Past days with no score do not render a bar
- **WHEN** a day earlier than today in the chart's underlying history has a total score of 0 (no logged entries, or entries summing to 0)
- **THEN** that day does not render a bar in the chart

#### Scenario: Today always renders a bar
- **WHEN** the user has not logged anything yet today
- **THEN** today's bar still renders (at zero height) so it remains visible and selectable

#### Scenario: Chart width adapts to viewport
- **WHEN** the dashboard is viewed on a narrower window
- **THEN** the chart shows fewer days so each remains a legible bar, without requiring horizontal scrolling to see the most recent ones

#### Scenario: Scrolling reveals earlier days
- **WHEN** a user scrolls the bar chart to the left
- **THEN** earlier days' bars become visible

#### Scenario: Chart shows a loading state while fetching
- **WHEN** the dashboard's daily history has been requested but not yet returned
- **THEN** the chart area shows a loading indicator instead of an empty or stale chart

#### Scenario: Bar color and axis label format
- **WHEN** the chart renders its bars
- **THEN** every bar uses the same shade of green regardless of that day's score, and each bar's date label is formatted day-month (`dd-MM`)

#### Scenario: Hover tooltip date format
- **WHEN** a user hovers over a bar
- **THEN** the tooltip shows that day's date formatted day-month-year (`dd-MM-yyyy`)

### Requirement: Selecting a chart day shows its detail
The system SHALL show the selected day's individual log entries and their scores below the bar chart, ordered most-recently-logged first (newest entry at the top, oldest at the bottom). The current day SHALL be selected by default.

#### Scenario: Default selection is today
- **WHEN** a user opens the dashboard
- **THEN** today's log entries and scores are shown below the chart

#### Scenario: Selecting a bar shows that day's detail
- **WHEN** a user selects a different day's bar in the chart
- **THEN** the system shows that day's individual log entries and their scores instead

### Requirement: Today vs. yesterday comparison
The system SHALL display a card for yesterday's total score and, immediately after it, a card for today's total score that also includes the difference between today and yesterday and whether today is trending up or down relative to yesterday. The yesterday card SHALL be shown before the today card.

#### Scenario: Today is higher than yesterday
- **WHEN** today's total score is greater than yesterday's total score
- **THEN** the today card shows an increase indicator, including the numeric difference

#### Scenario: Today is lower than yesterday
- **WHEN** today's total score is less than yesterday's total score
- **THEN** the today card shows a decrease indicator, including the numeric difference

#### Scenario: No entries yet today
- **WHEN** a user has not logged anything today
- **THEN** today's total is shown as 0 and the today card still shows the comparison against yesterday's total

### Requirement: Best-day highlights
The system SHALL identify, from the days covered by the bar chart's underlying history, the day with the highest total score and the day with the highest number of log entries, and display both (date and value) to the user.

#### Scenario: Highlighting the highest-scoring day
- **WHEN** the dashboard loads
- **THEN** the system shows the date and total score of the day with the highest total score in the available history

#### Scenario: Highlighting the day with the most entries
- **WHEN** the dashboard loads
- **THEN** the system shows the date and entry count of the day with the highest number of log entries in the available history

#### Scenario: Ties are resolved consistently
- **WHEN** two or more days are tied for the highest total score (or entry count)
- **THEN** the system deterministically picks one (e.g. the most recent of the tied days) rather than showing an inconsistent or random result

### Requirement: Daily history includes entry counts
The system SHALL make each day's log entry count, not just its total score, available alongside the trailing daily history used to render the bar chart and compute best-day highlights.

#### Scenario: History includes both total and entry count per day
- **WHEN** the dashboard requests the trailing daily history
- **THEN** each day in the response includes both its total score and its number of log entries
