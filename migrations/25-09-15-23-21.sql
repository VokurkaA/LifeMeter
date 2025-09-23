DROP TYPE IF EXISTS unit_name;
CREATE TYPE unit_name AS ENUM ('MG_ATE', 'KJ', 'MCG_RE', 'KCAL', 'SP_GR', 'PH', 'UG', 'MG_GAE', 'UMOL_TE', 'G', 'MG', 'IU');

CREATE TABLE IF NOT EXISTS nutrient
(
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(128) NOT NULL,
    unit         unit_name    NOT NULL,
    nutrient_nbr INT
);

CREATE TABLE IF NOT EXISTS branded_food
(
    id            SERIAL PRIMARY KEY,
    brand_owner   VARCHAR(128),
    brand_name    VARCHAR(128),
    subbrand_name VARCHAR(128),
    gtin_upc      VARCHAR(32) UNIQUE,
    ingredients   TEXT
);

CREATE TABLE IF NOT EXISTS food_category
(
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS food
(
    id               SERIAL PRIMARY KEY,
    branded_food_id  INT UNIQUE REFERENCES branded_food (id),
    food_category_id INT REFERENCES food_category (id),
    description      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nutrient_value
(
    id          SERIAL PRIMARY KEY,
    food_id     INT REFERENCES food (id),
    nutrient_id INT REFERENCES nutrient (id),
    amount      NUMERIC(11, 2)
);

CREATE TABLE IF NOT EXISTS portion
(
    id             SERIAL PRIMARY KEY,
    food_id        INT REFERENCES food (id),
    gram_weight    NUMERIC(9, 2) NOT NULL,
    portion_amount NUMERIC(4, 1),
    portion_unit   VARCHAR(16),
    description    TEXT,
    modifier       TEXT
);
