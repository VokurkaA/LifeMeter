CREATE TABLE IF NOT EXISTS unit
(
    id                     SERIAL PRIMARY KEY,
    name                   TEXT UNIQUE NOT NULL,
    gram_conversion_factor NUMERIC(12, 6)
);

CREATE TABLE IF NOT EXISTS set_style
(
    id   UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT UNIQUE      NOT NULL
);

CREATE TABLE IF NOT EXISTS set_type
(
    id   UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT UNIQUE      NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_type
(
    id   UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT UNIQUE      NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_variant
(
    id   UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT UNIQUE      NOT NULL
);

CREATE TABLE IF NOT EXISTS muscle
(
    id        UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name      TEXT UNIQUE      NOT NULL,
    action    TEXT,
    parent_id UUID REFERENCES muscle (id),
    CHECK (parent_id != id)
);

CREATE TABLE IF NOT EXISTS workout_template
(
    id          UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id     TEXT             NOT NULL REFERENCES "user" (id),
    name        TEXT             NOT NULL,
    description TEXT,
    label       TEXT[],
    created_at  TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercise
(
    id                  UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    exercise_type_id    UUID             NOT NULL REFERENCES exercise_type (id),
    exercise_variant_id UUID             NOT NULL REFERENCES exercise_variant (id),
    UNIQUE (exercise_type_id, exercise_variant_id)
);

CREATE TABLE IF NOT EXISTS template_workout_set
(
    id                  UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
		workout_template_id UUID NOT NULL REFERENCES workout_template (id) ON DELETE CASCADE,
    exercise_id         UUID             NOT NULL REFERENCES exercise (id),
    seq_number          INT              NOT NULL,
    repetitions         INT CHECK (repetitions >= 0),
    rir                 INT CHECK (rir >= 0),
    rest_time           INTERVAL CHECK (rest_time >= '0 second'),
    notes               TEXT,
    style_id            UUID REFERENCES set_style (id),
    set_type_id         UUID REFERENCES set_type (id),
    UNIQUE (workout_template_id, seq_number)
);

CREATE TABLE IF NOT EXISTS workout
(
    id                  UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id             TEXT             NOT NULL REFERENCES "user" (id),
    workout_template_id UUID REFERENCES workout_template (id),
    start_date          TIMESTAMP        NOT NULL,
    end_date            TIMESTAMP,
    label               TEXT[],
    notes               TEXT
);

CREATE TABLE IF NOT EXISTS workout_set
(
    id             UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    workout_id     UUID             NOT NULL REFERENCES workout (id),
    exercise_id    UUID             NOT NULL REFERENCES exercise (id),
    seq_number     INT              NOT NULL,
    weight         NUMERIC(6, 2),
    weight_unit_id INT REFERENCES unit (id),
    repetitions    INT              NOT NULL CHECK (repetitions >= 0),
    rir            INT CHECK (rir >= 0),
    rest_time      INTERVAL CHECK (rest_time >= '0 second'),
    notes          TEXT,
    style_id       UUID REFERENCES set_style (id),
    set_type_id    UUID REFERENCES set_type (id),
    UNIQUE (workout_id, seq_number)
);


CREATE TABLE IF NOT EXISTS muscle_involvement
(
    id          UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    exercise_id UUID             NOT NULL REFERENCES exercise (id),
    muscle_id   UUID             NOT NULL REFERENCES muscle (id),
    involvement NUMERIC(3, 2)    NOT NULL,
    CHECK (involvement >= 0 AND involvement <= 1)
);

CREATE INDEX idx_workout_template_id ON workout (workout_template_id);
CREATE INDEX idx_workout_user_id ON workout (user_id);
CREATE INDEX idx_template_set_template_id ON template_workout_set (workout_template_id);
CREATE INDEX idx_workout_set_workout_id ON workout_set (workout_id);
