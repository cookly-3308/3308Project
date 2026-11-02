DROP TABLE IF EXISTS users CASCADE;
 
CREATE TABLE users (
    user_id        SERIAL PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    password_hash  CHAR(60)     NOT NULL,
    email          VARCHAR(255) UNIQUE CHECK (email = LOWER(TRIM(email))),
    email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);