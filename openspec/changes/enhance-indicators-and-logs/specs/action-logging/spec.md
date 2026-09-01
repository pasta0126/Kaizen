## ADDED Requirements

### Requirement: Delete a logged entry from the dashboard day detail
The system SHALL let a user delete one of their own log entries directly from the dashboard's selected-day entry list. Each entry row SHALL present a delete control (a trash icon). Activating it SHALL delete that log entry immediately, without a confirmation prompt. After a successful deletion the entry SHALL no longer appear and SHALL no longer contribute to any day/week/month/year total.

#### Scenario: Delete an entry from the day list
- **WHEN** a user activates the trash icon on a log entry in the selected day's list
- **THEN** the entry is deleted immediately with no confirmation dialog
- **AND** the entry disappears from the list and its score is removed from that day's total

#### Scenario: Deleting refreshes dashboard aggregates
- **WHEN** a user deletes an entry that contributed to today's total
- **THEN** the today/yesterday cards, the bar chart, and the best-day highlights update to reflect the removal

#### Scenario: Cannot delete another user's entry
- **WHEN** a delete request targets a log entry not owned by the requesting user
- **THEN** the system rejects the request and no entry is deleted
