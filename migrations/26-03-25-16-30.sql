ALTER TABLE user_health_sync_source_item
    ADD COLUMN IF NOT EXISTS owns_target BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_health_sync_source_target_any_provider
    ON user_health_sync_source_item (user_id, target_table, target_row_id);
