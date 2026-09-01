## ADDED Requirements

### Requirement: Indicator belongs to exactly one fixed category
The system SHALL offer a fixed, predefined set of indicator categories: `Salud`, `Productividad`, `Relaciones`, `Finanzas`, `Crecimiento personal`, and `Ocio y descanso`. Users SHALL NOT be able to create, rename, or delete categories. Every indicator SHALL belong to exactly one category. An indicator with no category assigned SHALL be treated and displayed as `Sin categoría`.

#### Scenario: Create an indicator with a category
- **WHEN** a user creates an indicator "Correr" and selects the category `Salud`
- **THEN** the indicator is saved with category `Salud`

#### Scenario: Create an indicator without choosing a category
- **WHEN** a user creates an indicator and leaves the category unset
- **THEN** the indicator is saved with no category and is shown under `Sin categoría`

#### Scenario: Reject an unknown category
- **WHEN** a request tries to set an indicator's category to a value outside the fixed set
- **THEN** the system rejects the request with a validation error and does not save the change

#### Scenario: Change an indicator's category
- **WHEN** a user edits an indicator and changes its category from `Salud` to `Productividad`
- **THEN** the indicator's category is updated to `Productividad` and its past logged occurrences keep their scores

### Requirement: Each category has a distinct color applied to logging controls
The system SHALL assign each category (including `Sin categoría`) a distinct, stable color. Wherever an indicator exposes a control to log an occurrence, that control SHALL be rendered in the color of the indicator's category rather than a single uniform color.

#### Scenario: Logging control reflects category color
- **WHEN** a user views indicators from two different categories and each has a log button
- **THEN** each indicator's log button is shown in its own category's color

#### Scenario: Uncategorized indicator uses the default color
- **WHEN** an indicator has no category
- **THEN** its log button uses the `Sin categoría` color

### Requirement: Indicator list is grouped by category
The system SHALL present the indicator management list grouped under category headings. Each category that has at least one matching indicator SHALL appear as a heading with its indicators beneath it. Uncategorized indicators SHALL appear under a `Sin categoría` group.

#### Scenario: Indicators shown under their category headings
- **WHEN** a user opens the indicator list with indicators across several categories
- **THEN** each indicator appears beneath the heading of its category

#### Scenario: Empty categories are not shown
- **WHEN** no indicator belongs to `Finanzas`
- **THEN** no `Finanzas` heading is shown in the list

#### Scenario: Filtering keeps grouping
- **WHEN** a user filters the indicator list by a search term
- **THEN** only matching indicators are shown, still grouped under their category headings, and headings with no match are hidden

### Requirement: Indicator category is exposed through the API
The system SHALL accept an optional `category` when creating or updating an indicator and SHALL include `category` in every indicator representation it returns.

#### Scenario: Category round-trips through the API
- **WHEN** a client creates an indicator with `category` set to a valid value and later fetches it
- **THEN** the returned indicator includes that same `category`

#### Scenario: Omitted category returns null
- **WHEN** a client creates an indicator without `category`
- **THEN** the returned indicator has `category` of null
