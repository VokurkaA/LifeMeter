CREATE TABLE IF NOT EXISTS length_unit
(
    id                      SERIAL PRIMARY KEY,
    name                    TEXT UNIQUE NOT NULL,
    meter_conversion_factor NUMERIC(12, 6)
);

CREATE TABLE IF NOT EXISTS activity_level
(
    id          SERIAL PRIMARY KEY,
    name        TEXT UNIQUE   NOT NULL,
    description TEXT,
    min_factor  NUMERIC(4, 3) NOT NULL,
    max_factor  NUMERIC(4, 3) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profile
(
    user_id                 TEXT PRIMARY KEY NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    date_of_birth           DATE,
    sex                     CHAR(1),
    current_activity_factor NUMERIC(4, 3)             DEFAULT 1.200,
    current_bmr_calories    INT,
    default_weight_unit_id  INT              REFERENCES weight_unit (id) ON DELETE SET NULL,
    default_length_unit_id  INT              REFERENCES length_unit (id) ON DELETE SET NULL,
    finished_onboarding     BOOLEAN          NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS user_goal
(
    user_id                  TEXT PRIMARY KEY NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    daily_steps_goal         INT,
    bedtime_goal             TIME,
    wakeup_goal              TIME,
    daily_protein_goal_grams INT,
    daily_fat_goal_grams     INT,
    daily_carbs_goal_grams   INT,
    target_weight_grams      NUMERIC(9, 2),
    target_weight_date       DATE
);

CREATE TABLE IF NOT EXISTS user_weight_log
(
    id                     UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id                TEXT             NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    measured_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    weight_grams           NUMERIC(9, 2)    NOT NULL,
    body_fat_percentage    NUMERIC(5, 2),
    lean_tissue_percentage NUMERIC(5, 2),
    water_percentage       NUMERIC(5, 2),
    bone_mass_percentage   NUMERIC(5, 2)
);

CREATE TABLE IF NOT EXISTS user_height_log
(
    id          UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id     TEXT             NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    measured_at TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    height_cm   NUMERIC(5, 2)    NOT NULL
);

CREATE TABLE IF NOT EXISTS user_blood_pressure_log
(
    id             UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id        TEXT             NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    measured_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    systolic_mmhg  INT              NOT NULL,
    diastolic_mmhg INT              NOT NULL
);

CREATE TABLE IF NOT EXISTS user_heart_rate_log
(
    id          UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id     TEXT             NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    measured_at TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    bpm         INT              NOT NULL
);


CREATE INDEX idx_weight_log_user_date ON user_weight_log (user_id, measured_at DESC);
CREATE INDEX idx_height_log_user_date ON user_height_log (user_id, measured_at DESC);
CREATE INDEX idx_bp_log_user_date ON user_blood_pressure_log (user_id, measured_at DESC);
CREATE INDEX idx_hr_log_user_date ON user_heart_rate_log (user_id, measured_at DESC);

INSERT INTO length_unit (name, meter_conversion_factor)
VALUES ('cm', 0.01),   -- Centimeters
       ('m', 1.00),    -- Meters
       ('in', 0.0254), -- Inches
       ('ft', 0.3048)  -- Feet
ON CONFLICT (name) DO NOTHING;

INSERT INTO activity_level (name, description, min_factor, max_factor)
VALUES ('Sedentary', 'Little or no exercise', 0.000, 1.199),
       ('Lightly Active', 'Light exercise/sports 1-3 days/week', 1.200, 1.374),
       ('Moderately Active', 'Moderate exercise/sports 3-5 days/week', 1.375, 1.549),
       ('Very Active', 'Hard exercise/sports 6-7 days/week', 1.550, 1.724),
       ('Extra Active', 'Very hard exercise/sports & physical job', 1.725, 2.500)
ON CONFLICT (name) DO NOTHING;
