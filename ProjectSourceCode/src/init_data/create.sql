DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_ingredients CASCADE;
DROP TABLE IF EXISTS ingredient_prices CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
 
CREATE TABLE users (
    user_id        SERIAL PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    password_hash  CHAR(60)     NOT NULL,
    email          VARCHAR(255) UNIQUE CHECK (email = LOWER(TRIM(email))),
    email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ingredients (
    ingredient_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    category VARCHAR(50)
);

CREATE TABLE ingredient_prices (
    price_id SERIAL PRIMARY KEY,
    ingredient_id INT REFERENCES ingredients(ingredient_id),
    price NUMERIC(10,2),
    quantity NUMERIC(8,2),
    unit VARCHAR(30),
    currency CHAR(3),
    store VARCHAR(100),
    source_url VARCHAR(1000),
    fetched_at TIMESTAMP
);

CREATE TABLE user_ingredients (
    user_ingredient_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    photo_id INT,
    ingredient_id INT REFERENCES ingredients(ingredient_id),
    quantity NUMERIC(8,2),
    unit VARCHAR(30),
    confidence NUMERIC(3,2),
    detected_at TIMESTAMP
);
