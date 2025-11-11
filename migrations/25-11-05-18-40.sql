CREATE TABLE IF NOT EXISTS user_meal
(
    id       uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id  TEXT        NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    eaten_at timestamptz NOT NULL DEFAULT now(),
    name     text
);

CREATE TABLE IF NOT EXISTS user_food
(
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_meal_id uuid          NOT NULL REFERENCES user_meal (id) ON DELETE CASCADE,
    food_id      integer       NOT NULL REFERENCES food (id),
    total_grams  numeric(9, 2) NOT NULL,
    quantity     numeric(6, 2)    DEFAULT 1,
    portion_id   integer REFERENCES portion (id),
    description  text
);

CREATE INDEX IF NOT EXISTS idx_user_meal_user_id
    ON user_meal (user_id);

CREATE INDEX IF NOT EXISTS idx_user_food_user_meal_id
    ON user_food (user_meal_id);