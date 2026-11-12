
# Cookly Lab 10 Tests

Automated tests use Mocha, Chai, and Chai HTTP, and run against a separate,
disposable PostgreSQL database (`project_test`). They never touch the
development database.

| File | Type | What it checks |
|---|---|---|
| `test/validation.spec.js` | Unit | `validateRegistration` rejects a missing password (no HTTP server, no database) |
| `test/server.spec.js` | API integration | `GET /welcome`, plus positive and negative `POST /register` tests against the real schema |

## Setup

Run every command from `ProjectSourceCode/`.

1. Create the local test config (not committed):
   `cp .env.test.example .env.test`
   Then set a test user, a password, and `SESSION_SECRET`. `POSTGRES_DB` must
   end in `_test`; `src/db.js` throws an error otherwise.
2. Install dependencies inside the test container:
   `docker compose -p lab10-tests -f docker-compose.test.yaml run --rm --no-deps tests npm ci`
3. Run the tests:
   `docker compose -p lab10-tests -f docker-compose.test.yaml up --abort-on-container-exit --exit-code-from tests`
4. Shut down the test containers (volumes are kept):
   `docker compose -p lab10-tests -f docker-compose.test.yaml down`

Re-run step 3 after editing code (the source folder is bind-mounted). Re-run
step 2 if dependencies change.

**Reset the test database only** (for example after changing `create.sql`, since
init scripts run only when the volume is first created):
`docker compose -p lab10-tests -f docker-compose.test.yaml down --volumes`

Never run a volume-deleting command against the development stack.

**Troubleshooting:**
`docker compose -p lab10-tests -f docker-compose.test.yaml logs db-test tests`

## Registration contract

**Endpoint:** `POST /register`

**Request format:** form-encoded body (`application/x-www-form-urlencoded`),
as sent by the registration page.

| Field | Required | Rule |
|---|---|---|
| `username` | Yes | Nonempty string |
| `password` | Yes | Nonempty string |
| `email` | No | Stored lowercased and trimmed |

**Responses:**

| Case | Status | Body / headers |
|---|---|---|
| Success | `302` | `Location: /login` |
| Missing username or password | `400` | Register page (HTML) containing `Username and password are required` |
| Duplicate username or email | `400` | Register page (HTML) containing `Username or email is already taken` |
| Unexpected database error | `500` | Register page (HTML) containing `Registration failed` |

**Database effect (table `users`):**

| Column | Value after a successful registration |
|---|---|
| `user_id` | Generated (`SERIAL`) |
| `username` | Submitted username, trimmed |
| `password_hash` | bcrypt hash of the password (never plain text) |
| `email` | Submitted email, lowercased and trimmed, or `NULL` |
| `email_verified` | `FALSE` |
| `created_at` | Current timestamp |

A rejected registration inserts no row.

## Tests

- **Welcome:** `GET /welcome` returns `200` and
  `{status: 'success', message: 'Welcome!'}`.
- **Unit:** `validateRegistration({username: 'student'})` returns `false`. The
  same function is called by the `POST /register` route before hashing or
  inserting.
- **Positive registration:** returns `302` to `/login`; exactly one matching
  row; stored username and email match; the stored password differs from the
  plain text, and `bcrypt.compare` returns `true`.
- **Negative registration:** the same username without a password returns
  `400` with the documented error message, and zero matching rows exist.

## Cleanup and repeatability

- Each run generates a unique username and email with `crypto.randomUUID()`.
- `beforeEach` and `afterEach` delete only that test user, so cleanup also
  happens when a test fails, and no other rows are touched.
- A root `after` hook calls `pgp.end()` to close the connection pool, so Mocha
  exits without `--exit`.
- The test database is created from `src/init_data/create.sql` only.
  Development seed data (`insert.sql`) is not loaded.
- The suite can be run repeatedly without any manual database changes.

`.env.test` is listed in `.gitignore` and must not be committed.
