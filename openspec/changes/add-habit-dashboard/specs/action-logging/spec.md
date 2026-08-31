## Purpose

Lets a user record that an indicator occurred, and computes the point value that occurrence contributes according to the indicator's current scoring rule.

## ADDED Requirements

### Requirement: Log an occurrence of an indicator
The system SHALL let a user log an occurrence of one of their active indicators, defaulting to the current date and time, with an option to specify a different date (backdating).

#### Scenario: Log a per-occurrence indicator
- **WHEN** a user logs "Comer saludable" (rule per-occurrence, +1)
- **THEN** a log entry is created for today with score +1

#### Scenario: Log a first-then-repeat indicator twice in one day
- **WHEN** a user logs "Instagram" (first-then-repeat, first=0, repeat=-1) for the first time today, then logs it again later the same day
- **THEN** the first log entry that day is scored 0 and the second log entry that day is scored -1

#### Scenario: Log a variant indicator without selecting a variant
- **WHEN** a user logs "Té" (rule variant) without specifying which variant occurred
- **THEN** the system rejects the request and requires a variant to be specified

#### Scenario: Log a variant indicator with a selected variant
- **WHEN** a user logs "Té" and selects the "sin azúcar" variant (+1)
- **THEN** a log entry is created with score +1

### Requirement: Logged score is fixed at log time
The score recorded on a log entry SHALL be computed from the indicator's scoring rule as it exists at the moment of logging, and SHALL NOT change automatically if the indicator's rule is edited afterward.

#### Scenario: Editing the rule later does not rescore past logs
- **WHEN** an indicator's per-occurrence value is changed from +1 to +2 after logs already exist
- **THEN** existing log entries keep their originally computed score

### Requirement: Remove a log entry
The system SHALL let a user delete a log entry they created, removing its score contribution from the relevant day/week/month/year totals.

#### Scenario: Delete a mistaken log entry
- **WHEN** a user deletes a log entry logged by mistake
- **THEN** the entry no longer appears in their logs and no longer counts toward any aggregate score

### Requirement: Logs are scoped to their owner
The system SHALL only let a user view, create, or delete their own log entries, never another user's.

#### Scenario: User cannot delete another user's log entry
- **WHEN** user A attempts to delete a log entry created by user B
- **THEN** the system rejects the request
