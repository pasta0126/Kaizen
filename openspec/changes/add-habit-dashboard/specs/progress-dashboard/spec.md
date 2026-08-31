## Purpose

Gives the user a fast, visual read of their "1% growth" progress, aggregating logged indicator scores into a GitHub-contributions-style heatmap and day/week/month/year views.

## ADDED Requirements

### Requirement: Daily score aggregation
The system SHALL compute a day's total score as the sum of the scores of all log entries for that user dated that day, across all indicators.

#### Scenario: Multiple indicators logged the same day
- **WHEN** a user logs "Comer saludable" (+1) and "Instagram" first occurrence (0) on the same day
- **THEN** that day's total score is +1

### Requirement: Activity heatmap
The system SHALL display a calendar heatmap (one cell per day, similar to a GitHub contributions graph) covering at least the trailing 12 months, where each day's cell visually encodes that day's total score (e.g. by color intensity, with a distinct treatment for positive, neutral/zero, and negative totals).

#### Scenario: Heatmap reflects a day's score
- **WHEN** a day's total score is strongly positive
- **THEN** that day's heatmap cell is visually distinguishable from a day with a zero or negative score

#### Scenario: Selecting a heatmap day shows its detail
- **WHEN** a user selects a specific day on the heatmap
- **THEN** the system shows that day's individual log entries and their scores

### Requirement: Day, week, month, and year views
The system SHALL provide a dashboard view for each of: a single day, the current week, the current month, and the current year, each showing the aggregated score for that period and letting the user navigate to the previous/next period.

#### Scenario: Weekly view shows per-day breakdown
- **WHEN** a user opens the week view
- **THEN** the system shows each day of that week with its individual total score and the week's combined total

#### Scenario: Navigate to a previous period
- **WHEN** a user navigates to the previous month from the month view
- **THEN** the system shows that prior month's aggregated data

### Requirement: Dashboard reflects new logs immediately
The system SHALL reflect a newly logged (or deleted) occurrence in the relevant day/week/month/year totals and the heatmap without requiring the user to manually refresh unrelated data.

#### Scenario: Score updates right after logging
- **WHEN** a user logs an indicator occurrence while viewing today's day view
- **THEN** the displayed daily total updates to include that occurrence's score

### Requirement: Dashboard data is scoped to the owner
The system SHALL only aggregate and display a user's own log entries in their dashboard, never another user's.

#### Scenario: User cannot see another user's aggregated totals
- **WHEN** user A requests any dashboard view (day, week, month, year, or heatmap)
- **THEN** the returned totals are computed only from user A's own log entries, never user B's
