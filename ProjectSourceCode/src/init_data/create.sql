DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS user_ingredients CASCADE;
DROP TABLE IF EXISTS ingredient_prices CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS user_photos CASCADE;
DROP TABLE IF EXISTS users CASCADE;
 
CREATE TABLE users (
    user_id        SERIAL PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    password_hash  CHAR(60)     NOT NULL,
    email          VARCHAR(255) UNIQUE CHECK (email = LOWER(TRIM(email))),
    email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE user_photos (
    photo_id     SERIAL PRIMARY KEY,
    user_id      INT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    image_path   VARCHAR(500) NOT NULL,
    mime_type    VARCHAR(50)  NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
    uploaded_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);
 
CREATE TABLE ingredients (
    ingredient_id SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE CHECK (name = LOWER(TRIM(name))),
    category      VARCHAR(50)
);
 
CREATE TABLE ingredient_prices (
    price_id      SERIAL PRIMARY KEY,
    ingredient_id INT           NOT NULL REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
    price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    quantity      NUMERIC(8,2),
    unit          VARCHAR(30),
    currency      CHAR(3)       NOT NULL DEFAULT 'USD',
    store         VARCHAR(100),
    source_url    VARCHAR(1000),
    fetched_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE user_ingredients (
    user_ingredient_id SERIAL PRIMARY KEY,
    user_id            INT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    photo_id           INT          REFERENCES user_photos(photo_id) ON DELETE SET NULL,
    ingredient_id      INT          NOT NULL REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
    quantity           NUMERIC(8,2) CHECK (quantity >= 0),
    unit               VARCHAR(30),
    confidence         NUMERIC(3,2) CHECK (confidence BETWEEN 0 AND 1),
    detected_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, ingredient_id)
);
 
CREATE TABLE recipes (
    recipe_id    SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    instructions TEXT         NOT NULL,
    prep_time    INT          CHECK (prep_time >= 0),
    cook_time    INT          CHECK (cook_time >= 0),
    servings     INT          CHECK (servings > 0),
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE recipe_ingredients (
    recipe_ingredient_id SERIAL PRIMARY KEY,
    recipe_id            INT          NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    ingredient_name      VARCHAR(100) NOT NULL CHECK (ingredient_name = LOWER(TRIM(ingredient_name))),
    quantity             NUMERIC(8,2) CHECK (quantity > 0),
    unit                 VARCHAR(30),
    UNIQUE (recipe_id, ingredient_name)
);
 
CREATE UNIQUE INDEX idx_recipes_name ON recipes (LOWER(name));
CREATE INDEX idx_user_photos_user ON user_photos(user_id);
CREATE INDEX idx_user_ingredients_user ON user_ingredients(user_id);
CREATE INDEX idx_ingredient_prices_ingredient ON ingredient_prices(ingredient_id, fetched_at DESC);
CREATE INDEX idx_recipe_ingredients_name ON recipe_ingredients(ingredient_name);DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS user_ingredients CASCADE;
DROP TABLE IF EXISTS ingredient_prices CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS user_photos CASCADE;
DROP TABLE IF EXISTS users CASCADE;
 
CREATE TABLE users (
    user_id        SERIAL PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    password_hash  CHAR(60)     NOT NULL,
    email          VARCHAR(255) UNIQUE CHECK (email = LOWER(TRIM(email))),
    email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE user_photos (
    photo_id     SERIAL PRIMARY KEY,
    user_id      INT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    image_path   VARCHAR(500) NOT NULL,
    mime_type    VARCHAR(50)  NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
    uploaded_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);
 
CREATE TABLE ingredients (
    ingredient_id SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE CHECK (name = LOWER(TRIM(name))),
    category      VARCHAR(50)
);
 
CREATE TABLE ingredient_prices (
    price_id      SERIAL PRIMARY KEY,
    ingredient_id INT           NOT NULL REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
    price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    quantity      NUMERIC(8,2),
    unit          VARCHAR(30),
    currency      CHAR(3)       NOT NULL DEFAULT 'USD',
    store         VARCHAR(100),
    source_url    VARCHAR(1000),
    fetched_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE user_ingredients (
    user_ingredient_id SERIAL PRIMARY KEY,
    user_id            INT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    photo_id           INT          REFERENCES user_photos(photo_id) ON DELETE SET NULL,
    ingredient_id      INT          NOT NULL REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
    quantity           NUMERIC(8,2) CHECK (quantity >= 0),
    unit               VARCHAR(30),
    confidence         NUMERIC(3,2) CHECK (confidence BETWEEN 0 AND 1),
    detected_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, ingredient_id)
);
 
CREATE TABLE recipes (
    recipe_id    SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    instructions TEXT         NOT NULL,
    prep_time    INT          CHECK (prep_time >= 0),
    cook_time    INT          CHECK (cook_time >= 0),
    servings     INT          CHECK (servings > 0),
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE recipe_ingredients (
    recipe_ingredient_id SERIAL PRIMARY KEY,
    recipe_id            INT          NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    ingredient_name      VARCHAR(100) NOT NULL CHECK (ingredient_name = LOWER(TRIM(ingredient_name))),
    quantity             NUMERIC(8,2) CHECK (quantity > 0),
    unit                 VARCHAR(30),
    UNIQUE (recipe_id, ingredient_name)
);
 
CREATE UNIQUE INDEX idx_recipes_name ON recipes (LOWER(name));
CREATE INDEX idx_user_photos_user ON user_photos(user_id);
CREATE INDEX idx_user_ingredients_user ON user_ingredients(user_id);
CREATE INDEX idx_ingredient_prices_ingredient ON ingredient_prices(ingredient_id, fetched_at DESC);
CREATE INDEX idx_recipe_ingredients_name ON recipe_ingredients(ingredient_name);
