import type {
  HealthSyncBatchRequest,
  HealthSyncState,
} from "@/schemas/user.sync.schema";
import type {
  HealthSyncPendingRunRow,
  HealthSyncProvider,
  HealthSyncSourceItemRow,
  HealthSyncSourceType,
  HealthSyncStateRow,
} from "@/types/sync.types";
import type { SyncSourceDescriptor } from "@/services/health.sync.normalizer";
import type { PoolClient } from "pg";

export type TargetTableName =
  | "user_sleep"
  | "user_weight_log"
  | "user_height_log"
  | "user_heart_rate_log"
  | "user_blood_pressure_log";

export interface HealthSyncStatus {
  provider: HealthSyncProvider;
  syncState: HealthSyncState | null;
  lastSuccessAt: string | null;
}

type PendingRunSyncRunIdPayload = {
  syncRunId: string;
  isResetRun: boolean;
};

const PENDING_RUN_SYNC_RUN_ID_PREFIX = "__lifemeter_pending_run__:";

function isPendingRunSyncRunIdPayload(
  value: unknown,
): value is PendingRunSyncRunIdPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PendingRunSyncRunIdPayload>;

  return (
    typeof candidate.syncRunId === "string" &&
    typeof candidate.isResetRun === "boolean"
  );
}

export class HealthSyncStore {
  async lockProvider(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
  ) {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      [`${userId}:${provider}`],
    );
  }

  async getSyncStateForClient(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
  ): Promise<HealthSyncStatus> {
    const query = `
      SELECT user_id, provider, sync_state, last_success_at, created_at, updated_at
      FROM user_health_sync_state
      WHERE user_id = $1
        AND provider = $2
    `;
    const result = await client.query<HealthSyncStateRow>(query, [
      userId,
      provider,
    ]);
    const row = result.rows[0];

    return {
      provider,
      syncState: (row?.sync_state as HealthSyncState | null | undefined) ?? null,
      lastSuccessAt:
        row?.last_success_at instanceof Date
          ? row.last_success_at.toISOString()
          : row?.last_success_at ?? null,
    };
  }

  async saveSyncState(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
    nextSyncState: HealthSyncState | null,
  ) {
    const query = `
      INSERT INTO user_health_sync_state (
        user_id,
        provider,
        sync_state,
        last_success_at,
        updated_at
      )
      VALUES ($1, $2, $3::jsonb, NOW(), NOW())
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        sync_state = EXCLUDED.sync_state,
        last_success_at = EXCLUDED.last_success_at,
        updated_at = NOW()
    `;

    await client.query(query, [
      userId,
      provider,
      JSON.stringify(nextSyncState),
    ]);
  }

  async getPendingRun(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
  ) {
    const query = `
      SELECT *
      FROM user_health_sync_pending_run
      WHERE user_id = $1
        AND provider = $2
    `;
    const result = await client.query<HealthSyncPendingRunRow>(query, [
      userId,
      provider,
    ]);
    return result.rows[0] ?? null;
  }

  async savePendingRun(
    client: PoolClient,
    userId: string,
    input: HealthSyncBatchRequest,
    options: { isResetRun: boolean },
  ) {
    const query = `
      INSERT INTO user_health_sync_pending_run (
        user_id,
        provider,
        sync_run_id,
        expected_batch_index,
        current_sync_state,
        next_sync_state,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW(), NOW())
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        sync_run_id = EXCLUDED.sync_run_id,
        expected_batch_index = EXCLUDED.expected_batch_index,
        current_sync_state = EXCLUDED.current_sync_state,
        next_sync_state = EXCLUDED.next_sync_state,
        created_at = CASE
          WHEN EXCLUDED.expected_batch_index = 1 THEN NOW()
          ELSE user_health_sync_pending_run.created_at
        END,
        updated_at = NOW()
    `;

    await client.query(query, [
      userId,
      input.provider,
      this.encodePendingRunSyncRunId(input.syncRunId, options.isResetRun),
      input.batchIndex + 1,
      JSON.stringify(input.currentSyncState),
      JSON.stringify(input.nextSyncState),
    ]);
  }

  async clearPendingRun(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
  ) {
    const query = `
      DELETE FROM user_health_sync_pending_run
      WHERE user_id = $1
        AND provider = $2
    `;

    await client.query(query, [userId, provider]);
  }

  isResetPendingRun(row: HealthSyncPendingRunRow) {
    return this.decodePendingRunSyncRunId(row.sync_run_id).isResetRun;
  }

  getPendingRunExpectedBatchIndex(row: HealthSyncPendingRunRow) {
    return row.expected_batch_index;
  }

  getPendingRunSyncRunId(row: HealthSyncPendingRunRow) {
    return this.decodePendingRunSyncRunId(row.sync_run_id).syncRunId;
  }

  async getSourceItemsForDeletion(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
    sourceItemId: string,
    sourceType?: HealthSyncSourceType,
  ) {
    if (provider === "health-connect") {
      const params: unknown[] = [
        userId,
        provider,
        sourceItemId,
        `${sourceItemId}:%`,
      ];
      const typeClause = sourceType ? ` AND source_type = $5` : "";

      const query = `
        SELECT *
        FROM user_health_sync_source_item
        WHERE user_id = $1
          AND provider = $2
          AND (
            source_item_id = $3
            OR (source_type = 'heart_rate' AND source_item_id LIKE $4)
          )
          ${typeClause}
      `;

      if (sourceType) {
        params.push(sourceType);
      }

      const result = await client.query<HealthSyncSourceItemRow>(query, params);
      return result.rows;
    }

    const params: unknown[] = [userId, provider, sourceItemId];
    const typeClause = sourceType ? ` AND source_type = $4` : "";

    const query = `
      SELECT *
      FROM user_health_sync_source_item
      WHERE user_id = $1
        AND provider = $2
        AND source_item_id = $3
        ${typeClause}
    `;

    if (sourceType) {
      params.push(sourceType);
    }

    const result = await client.query<HealthSyncSourceItemRow>(query, params);
    return result.rows;
  }

  async getSourceItemsForProvider(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
  ) {
    const result = await client.query<HealthSyncSourceItemRow>(
      `
        SELECT *
        FROM user_health_sync_source_item
        WHERE user_id = $1
          AND provider = $2
      `,
      [userId, provider],
    );
    return result.rows;
  }

  async getSourceItemsForProviderUpdatedBefore(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
    updatedBefore: string | Date,
  ) {
    const result = await client.query<HealthSyncSourceItemRow>(
      `
        SELECT *
        FROM user_health_sync_source_item
        WHERE user_id = $1
          AND provider = $2
          AND updated_at < $3
      `,
      [userId, provider, updatedBefore],
    );
    return result.rows;
  }

  async deleteSourceItemsByIds(client: PoolClient, ids: string[]) {
    if (ids.length === 0) return;

    await client.query(
      `
        DELETE FROM user_health_sync_source_item
        WHERE id = ANY($1::uuid[])
      `,
      [ids],
    );
  }

  async hasAnySourceItemForTarget(
    client: PoolClient,
    userId: string,
    tableName: TargetTableName,
    targetRowId: string,
  ) {
    const result = await client.query(
      `
        SELECT 1
        FROM user_health_sync_source_item
        WHERE user_id = $1
          AND target_table = $2
          AND target_row_id = $3
        LIMIT 1
      `,
      [userId, tableName, targetRowId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async hasOtherSourceItemsForTarget(
    client: PoolClient,
    userId: string,
    tableName: TargetTableName,
    targetRowId: string,
    excludedSourceItemRowId: string,
  ) {
    const result = await client.query(
      `
        SELECT 1
        FROM user_health_sync_source_item
        WHERE user_id = $1
          AND target_table = $2
          AND target_row_id = $3
          AND id <> $4
        LIMIT 1
      `,
      [userId, tableName, targetRowId, excludedSourceItemRowId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async hasSourceItemForTargetExcludingProvider(
    client: PoolClient,
    userId: string,
    tableName: TargetTableName,
    targetRowId: string,
    provider: HealthSyncProvider,
  ) {
    const result = await client.query(
      `
        SELECT 1
        FROM user_health_sync_source_item
        WHERE user_id = $1
          AND target_table = $2
          AND target_row_id = $3
          AND provider <> $4
        LIMIT 1
      `,
      [userId, tableName, targetRowId, provider],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async promoteTargetOwnerIfMissing(
    client: PoolClient,
    userId: string,
    tableName: TargetTableName,
    targetRowId: string,
  ) {
    const existingOwner = await client.query(
      `
        SELECT 1
        FROM user_health_sync_source_item
        WHERE user_id = $1
          AND target_table = $2
          AND target_row_id = $3
          AND owns_target = TRUE
        LIMIT 1
      `,
      [userId, tableName, targetRowId],
    );

    if ((existingOwner.rowCount ?? 0) > 0) {
      return;
    }

    await client.query(
      `
        WITH candidate AS (
          SELECT id
          FROM user_health_sync_source_item
          WHERE user_id = $1
            AND target_table = $2
            AND target_row_id = $3
          ORDER BY created_at ASC, id ASC
          LIMIT 1
        )
        UPDATE user_health_sync_source_item
        SET owns_target = TRUE,
            updated_at = NOW()
        WHERE id = (SELECT id FROM candidate)
      `,
      [userId, tableName, targetRowId],
    );
  }

  async deleteTargetRow(
    client: PoolClient,
    userId: string,
    tableName: TargetTableName,
    targetRowId: string,
  ) {
    await client.query(
      `
        DELETE FROM ${tableName}
        WHERE user_id = $1
          AND id = $2
      `,
      [userId, targetRowId],
    );
  }

  async getSourceItem(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
    sourceType: HealthSyncSourceType,
    sourceItemId: string,
  ) {
    const query = `
      SELECT *
      FROM user_health_sync_source_item
      WHERE user_id = $1
        AND provider = $2
        AND source_type = $3
        AND source_item_id = $4
    `;
    const result = await client.query<HealthSyncSourceItemRow>(query, [
      userId,
      provider,
      sourceType,
      sourceItemId,
    ]);
    return result.rows[0] ?? null;
  }

  async getSourceItemsBySourceItemIds(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
    sourceType: HealthSyncSourceType,
    sourceItemIds: string[],
  ) {
    if (sourceItemIds.length === 0) {
      return [];
    }

    const query = `
      SELECT *
      FROM user_health_sync_source_item
      WHERE user_id = $1
        AND provider = $2
        AND source_type = $3
        AND source_item_id = ANY($4::text[])
    `;
    const result = await client.query<HealthSyncSourceItemRow>(query, [
      userId,
      provider,
      sourceType,
      sourceItemIds,
    ]);
    return result.rows;
  }

  async saveSourceItem(
    client: PoolClient,
    userId: string,
    source: SyncSourceDescriptor,
    targetTable: TargetTableName,
    targetRowId: string | null,
    ownsTarget: boolean,
  ) {
    const query = `
      INSERT INTO user_health_sync_source_item (
        user_id,
        provider,
        source_type,
        source_item_id,
        target_table,
        target_row_id,
        raw_payload,
        checksum,
        source_start_at,
        source_end_at,
        source_last_modified_at,
        owns_target,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7::jsonb,
        $8,
        $9,
        $10,
        $11,
        $12,
        NOW()
      )
      ON CONFLICT (user_id, provider, source_type, source_item_id)
      DO UPDATE SET
        target_table = EXCLUDED.target_table,
        target_row_id = EXCLUDED.target_row_id,
        raw_payload = EXCLUDED.raw_payload,
        checksum = EXCLUDED.checksum,
        source_start_at = EXCLUDED.source_start_at,
        source_end_at = EXCLUDED.source_end_at,
        source_last_modified_at = EXCLUDED.source_last_modified_at,
        owns_target = EXCLUDED.owns_target,
        updated_at = NOW()
    `;

    await client.query(query, [
      userId,
      source.provider,
      source.sourceType,
      source.sourceItemId,
      targetTable,
      targetRowId,
      JSON.stringify(source.rawPayload),
      source.checksum,
      source.sourceStartAt,
      source.sourceEndAt,
      source.sourceLastModifiedAt,
      ownsTarget,
    ]);
  }

  async targetRowExists(
    client: PoolClient,
    userId: string,
    tableName: TargetTableName,
    targetRowId: string,
  ) {
    const query = `
      SELECT 1
      FROM ${tableName}
      WHERE user_id = $1
        AND id = $2
    `;
    const result = await client.query(query, [userId, targetRowId]);
    return (result.rowCount ?? 0) > 0;
  }

  async getAppleSleepSourceRowsInRange(
    client: PoolClient,
    userId: string,
    rangeStart: string,
    rangeEnd: string,
  ) {
    const query = `
      SELECT *
      FROM user_health_sync_source_item
      WHERE user_id = $1
        AND provider = 'apple-health'
        AND source_type = 'sleep'
        AND source_end_at >= $2
        AND source_start_at <= $3
      ORDER BY source_start_at ASC
    `;
    const result = await client.query<HealthSyncSourceItemRow>(query, [
      userId,
      rangeStart,
      rangeEnd,
    ]);
    return result.rows;
  }

  async getSleepRowsByIds(
    client: PoolClient,
    userId: string,
    ids: string[],
  ) {
    if (ids.length === 0) return [];

    const query = `
      SELECT id, sleep_start::text AS sleep_start, sleep_end::text AS sleep_end
      FROM user_sleep
      WHERE user_id = $1
        AND id = ANY($2::uuid[])
    `;
    const result = await client.query<{
      id: string;
      sleep_start: string;
      sleep_end: string;
    }>(query, [userId, ids]);
    return result.rows;
  }

  async findMatchingSleepRow(
    client: PoolClient,
    userId: string,
    sleepStart: string,
    sleepEnd: string,
  ) {
    const query = `
      SELECT id
      FROM user_sleep
      WHERE user_id = $1
        AND sleep_start = $2
        AND sleep_end = $3
      LIMIT 1
    `;
    const result = await client.query<{ id: string }>(query, [
      userId,
      sleepStart,
      sleepEnd,
    ]);
    return result.rows[0]?.id ?? null;
  }

  async insertSleepRow(
    client: PoolClient,
    userId: string,
    sleepStart: string,
    sleepEnd: string,
  ) {
    const query = `
      INSERT INTO user_sleep (user_id, sleep_start, sleep_end, note)
      VALUES ($1, $2, $3, NULL)
      RETURNING id
    `;
    const result = await client.query<{ id: string }>(query, [
      userId,
      sleepStart,
      sleepEnd,
    ]);
    return result.rows[0].id;
  }

  private encodePendingRunSyncRunId(
    syncRunId: string,
    isResetRun: boolean,
  ) {
    return `${PENDING_RUN_SYNC_RUN_ID_PREFIX}${JSON.stringify({
      syncRunId,
      isResetRun,
    } satisfies PendingRunSyncRunIdPayload)}`;
  }

  private decodePendingRunSyncRunId(
    storedSyncRunId: string,
  ): PendingRunSyncRunIdPayload {
    if (!storedSyncRunId.startsWith(PENDING_RUN_SYNC_RUN_ID_PREFIX)) {
      return {
        syncRunId: storedSyncRunId,
        isResetRun: false,
      };
    }

    try {
      const parsed = JSON.parse(
        storedSyncRunId.slice(PENDING_RUN_SYNC_RUN_ID_PREFIX.length),
      ) as unknown;

      if (isPendingRunSyncRunIdPayload(parsed)) {
        return parsed;
      }
    } catch {
      // Fall through to the raw id fallback for malformed legacy rows.
    }

    return {
      syncRunId: storedSyncRunId,
      isResetRun: false,
    };
  }
}

export const healthSyncStore = new HealthSyncStore();
