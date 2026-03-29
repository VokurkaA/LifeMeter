CREATE TABLE IF NOT EXISTS user_health_sync_state
(
    user_id         TEXT        NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    provider        TEXT        NOT NULL,
    sync_state      JSONB,
    last_success_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, provider),
    CONSTRAINT user_health_sync_state_provider_check
        CHECK (provider IN ('health-connect', 'apple-health'))
);

CREATE TABLE IF NOT EXISTS user_health_sync_pending_run
(
    user_id              TEXT        NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    provider             TEXT        NOT NULL,
    sync_run_id          TEXT        NOT NULL,
    expected_batch_index INTEGER     NOT NULL,
    current_sync_state   JSONB,
    next_sync_state      JSONB,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, provider),
    CONSTRAINT user_health_sync_pending_run_provider_check
        CHECK (provider IN ('health-connect', 'apple-health')),
    CONSTRAINT user_health_sync_pending_run_expected_batch_index_check
        CHECK (expected_batch_index >= 0)
);

CREATE TABLE IF NOT EXISTS user_health_sync_source_item
(
    id                      UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id                 TEXT             NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    provider                TEXT             NOT NULL,
    source_type             TEXT             NOT NULL,
    source_item_id          TEXT             NOT NULL,
    target_table            TEXT,
    target_row_id           UUID,
    raw_payload             JSONB            NOT NULL,
    checksum                TEXT             NOT NULL,
    source_start_at         TIMESTAMPTZ,
    source_end_at           TIMESTAMPTZ,
    source_last_modified_at TIMESTAMPTZ,
    created_at              TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT user_health_sync_source_item_provider_check
        CHECK (provider IN ('health-connect', 'apple-health')),
    CONSTRAINT user_health_sync_source_item_unique
        UNIQUE (user_id, provider, source_type, source_item_id)
);

CREATE INDEX IF NOT EXISTS idx_health_sync_source_user_provider_type_start
    ON user_health_sync_source_item (user_id, provider, source_type, source_start_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_sync_source_target
    ON user_health_sync_source_item (user_id, provider, target_table, target_row_id);
