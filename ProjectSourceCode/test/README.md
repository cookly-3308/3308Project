
# Cookly Lab 10 Tests

## Setup

The tests use Docker Compose and a separate PostgreSQL test database.

Run these commands from ProjectSourceCode:

1. Copy `.env.test.example` to `.env.test` and configure the test credentials.
2. Start the test database:
   `docker compose -f docker-compose.test.yaml up -d db-test`
3. Install dependencies if needed:
   `docker compose -f docker-compose.test.yaml run --rm tests npm ci`
4. Run the tests:
   `docker compose -f docker-compose.test.yaml run --rm tests`
5. Stop the containers:
   `docker compose -f docker-compose.test.yaml down`

## Registration Contract

The POST /register route accepts a username, password, and optional email.

A valid registration creates a user with a hashed password and redirects to /login with HTTP 302.

A missing username or password returns HTTP 400. Duplicate usernames or emails also return HTTP 400.

## Tests

- Welcome route returns the expected response.
- Registration validation rejects a missing password.
- Successful registration creates exactly one user and verifies the password hash.
- Registration without a password returns HTTP 400 and creates no user.

## Cleanup

The integration tests remove their test users before and after each test. The cleanup uses a finally block so it also runs when a test fails.

Tests use the separate project_test database and can be run repeatedly without manually resetting the database.

The local .env.test file should not be committed.
