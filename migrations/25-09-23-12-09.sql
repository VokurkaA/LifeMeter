CREATE TABLE IF NOT EXISTS raw_muscles
(
    id          SERIAL PRIMARY KEY,
    muscle      TEXT,
    location    TEXT,
    origin      TEXT,
    insertion   TEXT,
    artery      TEXT,
    nerve       TEXT,
    action      TEXT,
    antagonist  TEXT,
    o           INT,
    t           INT
);
