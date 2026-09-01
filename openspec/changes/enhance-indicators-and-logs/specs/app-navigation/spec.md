## Purpose

Defines the app's top-level header shell: how compact it is and how a user gets back to the home view from anywhere in the app.

## ADDED Requirements

### Requirement: Header height matches its icon
The system SHALL size the top header so its overall height is determined by the height of its brand icon (plus only the header's own padding), rather than by the title text or by a fixed larger height. The brand icon and the "Kaizen" title SHALL be vertically centered within that height.

#### Scenario: Header is as tall as the icon
- **WHEN** the app header renders
- **THEN** the header's content height equals the brand icon's height and the title does not force it taller

### Requirement: Brand icon and title link to home
The system SHALL make the brand icon and the "Kaizen" title a single activatable control that navigates to the home view (the dashboard). The control SHALL be keyboard focusable and activatable.

#### Scenario: Click the logo to go home
- **WHEN** a user on the indicators view activates the brand icon or the "Kaizen" title
- **THEN** the app switches to the dashboard (home) view

#### Scenario: Already home
- **WHEN** a user already on the dashboard activates the brand icon or title
- **THEN** the app stays on the dashboard view with no error
