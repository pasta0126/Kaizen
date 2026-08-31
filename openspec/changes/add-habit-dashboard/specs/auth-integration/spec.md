## Purpose

Lets multiple users use the application independently by authenticating through the platform's shared identity provider, ensuring every user only ever sees their own data.

## ADDED Requirements

### Requirement: Authentication required for all indicator/log/dashboard data
The system SHALL require a valid access token, issued by the platform's shared identity provider, on every request that reads or writes indicators, log entries, or dashboard data.

#### Scenario: Request without a token is rejected
- **WHEN** a request to list indicators is made with no bearer token
- **THEN** the system rejects the request as unauthorized

#### Scenario: Request with an invalid or expired token is rejected
- **WHEN** a request is made with a bearer token that is expired or fails signature verification
- **THEN** the system rejects the request as unauthorized

### Requirement: Data is scoped to the authenticated user's identity
The system SHALL derive the acting user's identity from the verified token and use it to scope every indicator, log entry, and dashboard query, without trusting any user identifier supplied elsewhere in the request.

#### Scenario: Identity comes from the token, not the request body
- **WHEN** a request body includes a different user id than the one in the verified token
- **THEN** the system uses the identity from the verified token, not the one from the request body
