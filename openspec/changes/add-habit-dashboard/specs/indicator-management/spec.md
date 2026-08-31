## Purpose

Lets a user define the personal indicators (habits, decisions, actions) they want to track, each with its own scoring rule, so later logged occurrences can be scored consistently.

## ADDED Requirements

### Requirement: Create indicator with a scoring rule
The system SHALL let an authenticated user create an indicator with a name and one scoring rule of the following types:
- **per-occurrence**: every logged occurrence adds the same fixed point value.
- **first-then-repeat**: the first occurrence logged in a day adds one configured point value; every subsequent occurrence that same day adds a different configured point value.
- **variant**: the user must pick one of the indicator's configured variants when logging; each variant has its own point value.

#### Scenario: Create a flat per-occurrence indicator
- **WHEN** a user creates an indicator "Comer saludable" with rule per-occurrence and value +1
- **THEN** the indicator is saved and every future occurrence of it will be scored +1

#### Scenario: Create a first-then-repeat indicator
- **WHEN** a user creates an indicator "Instagram" with rule first-then-repeat, first value 0 and repeat value -1
- **THEN** the indicator is saved with both configured values

#### Scenario: Create a variant indicator
- **WHEN** a user creates an indicator "Té" with rule variant and variants "con azúcar" = 0, "sin azúcar" = +1
- **THEN** the indicator is saved with both variants and their point values

#### Scenario: Reject indicator without a valid rule configuration
- **WHEN** a user submits an indicator with rule type variant but zero variants, or with a missing point value for a required rule field
- **THEN** the system rejects the request with a validation error and does not create the indicator

### Requirement: Edit an existing indicator
The system SHALL let a user rename an indicator, change its scoring rule configuration, and add, edit, or remove variants (for variant-rule indicators). Changes SHALL apply only to occurrences logged after the change; previously logged occurrences keep the score they earned at logging time.

#### Scenario: Update scoring rule value
- **WHEN** a user changes "Comer saludable" from +1 to +2 per occurrence
- **THEN** occurrences logged before the change keep their original score, and occurrences logged after the change are scored +2

### Requirement: Archive an indicator
The system SHALL let a user archive an indicator so it no longer appears in the active list available for logging, while keeping its historical occurrences and their scores intact and visible in the dashboard.

#### Scenario: Archive stops new logging but keeps history
- **WHEN** a user archives "Instagram"
- **THEN** "Instagram" no longer appears in the list of indicators available to log
- **AND** previously logged occurrences of "Instagram" still contribute to past daily/weekly/monthly/yearly scores

### Requirement: Indicators are scoped to their owner
The system SHALL only show a user their own indicators, never another user's.

#### Scenario: User cannot see another user's indicators
- **WHEN** user A lists their indicators
- **THEN** only indicators created by user A are returned, none created by other users
