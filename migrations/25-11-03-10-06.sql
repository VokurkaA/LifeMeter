CREATE TABLE IF NOT EXISTS user_sleep
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    sleep_start TIMESTAMP        DEFAULT NOW(),
    sleep_end   TIMESTAMP,
    note        TEXT
);

