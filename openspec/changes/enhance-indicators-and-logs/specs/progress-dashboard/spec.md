## ADDED Requirements

### Requirement: Day-detail entries expose a delete control
The system SHALL render, on each row of the selected day's entry list, a delete (trash) control alongside the indicator name and score. Activating the control SHALL delete that entry immediately (no confirmation) and SHALL re-fetch the day detail and the trailing daily history so the entry list, the day total, the today/yesterday cards, the bar chart, and the best-day highlights all reflect the removal.

#### Scenario: Delete control present on each entry
- **WHEN** the selected day has one or more log entries
- **THEN** each entry row shows a trash icon control

#### Scenario: Deleting updates the whole dashboard
- **WHEN** a user deletes an entry from the selected day
- **THEN** that day's entry list and total update, and the bar chart, today/yesterday cards, and best-day highlights re-render from refreshed data

#### Scenario: Empty day after deleting the last entry
- **WHEN** a user deletes the only remaining entry for the selected day
- **THEN** the list shows the empty-day state and the day total shows 0
