import type {
  AppleHealthSyncBatchRequest,
  HealthSyncBatchRequest,
  HealthSyncState,
} from "@/schemas/user.sync.schema";
import { pool } from "@/config/db.config";
import type {
  HealthSyncPendingRunRow,
  HealthSyncProvider,
  HealthSyncSourceItemRow,
  HealthSyncSourceType,
  HealthSyncStateRow,
} from "@/types/sync.types";
import {
  appleSleepSnapshotFromSourceItem,
  clusterAppleSleepSamples,
  normalizeAppleHealthBloodPressureRecord,
  normalizeAppleHealthHeartRateRecord,
  normalizeAppleHealthHeightRecord,
  normalizeAppleHealthSleepRecord,
  normalizeAppleHealthWeightRecord,
  normalizeHealthConnectBloodPressureRecord,
  normalizeHealthConnectHeartRateRecord,
  normalizeHealthConnectHeightRecord,
  normalizeHealthConnectSleepRecord,
  normalizeHealthConnectWeightRecord,
  stableStringify,
  type NormalizedBloodPressureLog,
  type NormalizedHeartRateLog,
  type NormalizedHeightLog,
  type NormalizedSleepSession,
  type NormalizedSourceMeasurement,
  type NormalizedWeightLog,
  type SyncSourceDescriptor,
} from "@/services/health.sync.normalizer";
import type { PoolClient } from "pg";

type TargetTableName =
  | "user_sleep"
  | "user_weight_log"
  | "user_height_log"
  | "user_heart_rate_log"
  | "user_blood_pressure_log";

interface HealthSyncBatchResult {
  inserted: number;
  updated: number;
  matchedExisting: number;
  skipped: number;
  warnings: string[];
  committedSyncState: HealthSyncState | null;
}

interface HealthSyncStatus {
  provider: HealthSyncProvider;
  syncState: HealthSyncState | null;
  lastSuccessAt: string | null;
}

class HealthSyncConflictError extends Error {}

export class HealthSyncService {
  async getSyncState(
    userId: string,
    provider: HealthSyncProvider,
  ): Promise<HealthSyncStatus> {
    const query = `
      SELECT user_id, provider, sync_state, last_success_at, created_at, updated_at
      FROM user_health_sync_state
      WHERE user_id = $1
        AND provider = $2
    `;
    const result = await pool.query<HealthSyncStateRow>(query, [userId, provider]);
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

  async syncBatch(
    userId: string,
    input: HealthSyncBatchRequest,
  ): Promise<HealthSyncBatchResult> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await this.lockProvider(client, userId, input.provider);

      const currentStatus = await this.getSyncStateForClient(
        client,
        userId,
        input.provider,
      );

      if (
        stableStringify(currentStatus.syncState) !==
        stableStringify(input.currentSyncState)
      ) {
        throw new HealthSyncConflictError(
          "Health sync state is stale. Refresh sync state and retry.",
        );
      }

      await this.assertPendingRunCanProceed(client, userId, input);

      const stats = {
        inserted: 0,
        updated: 0,
        matchedExisting: 0,
        skipped: 0,
        warnings: new Set<string>(),
      };

      if (input.provider === "health-connect") {
        await this.processHealthConnectBatch(client, userId, input, stats);
      } else {
        await this.processAppleHealthBatch(client, userId, input, stats);
      }

      let committedSyncState = currentStatus.syncState;
      if (input.isFinalBatch) {
        committedSyncState = input.nextSyncState;
        await this.saveSyncState(client, userId, input.provider, input.nextSyncState);
        await this.clearPendingRun(client, userId, input.provider);
      } else {
        await this.savePendingRun(client, userId, input);
      }

      await client.query("COMMIT");

      return {
        inserted: stats.inserted,
        updated: stats.updated,
        matchedExisting: stats.matchedExisting,
        skipped: stats.skipped,
        warnings: [...stats.warnings],
        committedSyncState,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  isConflictError(error: unknown): error is HealthSyncConflictError {
    return error instanceof HealthSyncConflictError;
  }

  private async processHealthConnectBatch(
    client: PoolClient,
    userId: string,
    input: Extract<HealthSyncBatchRequest, { provider: "health-connect" }>,
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    for (const record of input.records) {
      switch (record.kind) {
        case "sleep":
          await this.syncSleepMeasurement(
            client,
            userId,
            normalizeHealthConnectSleepRecord(record),
            stats,
          );
          break;
        case "weight":
          await this.syncWeightMeasurement(
            client,
            userId,
            normalizeHealthConnectWeightRecord(record),
            stats,
          );
          break;
        case "height":
          await this.syncHeightMeasurement(
            client,
            userId,
            normalizeHealthConnectHeightRecord(record),
            stats,
          );
          break;
        case "heartRate":
          for (const sample of normalizeHealthConnectHeartRateRecord(record)) {
            await this.syncHeartRateMeasurement(client, userId, sample, stats);
          }
          break;
        case "bloodPressure":
          await this.syncBloodPressureMeasurement(
            client,
            userId,
            normalizeHealthConnectBloodPressureRecord(record),
            stats,
          );
          break;
      }
    }
  }

  private async processAppleHealthBatch(
    client: PoolClient,
    userId: string,
    input: Extract<HealthSyncBatchRequest, { provider: "apple-health" }>,
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    const sleepRecords = input.records.filter(
      (record): record is Extract<AppleHealthSyncBatchRequest["records"][number], { kind: "sleep" }> =>
        record.kind === "sleep",
    );

    for (const record of input.records) {
      switch (record.kind) {
        case "sleep":
          break;
        case "weight":
          await this.syncWeightMeasurement(
            client,
            userId,
            normalizeAppleHealthWeightRecord(record),
            stats,
          );
          break;
        case "height":
          await this.syncHeightMeasurement(
            client,
            userId,
            normalizeAppleHealthHeightRecord(record),
            stats,
          );
          break;
        case "heartRate":
          await this.syncHeartRateMeasurement(
            client,
            userId,
            normalizeAppleHealthHeartRateRecord(record),
            stats,
          );
          break;
        case "bloodPressure":
          await this.syncBloodPressureMeasurement(
            client,
            userId,
            normalizeAppleHealthBloodPressureRecord(record),
            stats,
          );
          break;
      }
    }

    if (sleepRecords.length > 0) {
      await this.syncAppleSleepMeasurements(client, userId, sleepRecords, stats);
    }
  }

  private async syncSleepMeasurement(
    client: PoolClient,
    userId: string,
    measurement: NormalizedSourceMeasurement<NormalizedSleepSession>,
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    const tableName = "user_sleep" satisfies TargetTableName;

    await this.syncOneToOneMeasurement({
      client,
      userId,
      source: measurement.source,
      tableName,
      stats,
      targetExists: (targetRowId) =>
        this.targetRowExists(client, userId, tableName, targetRowId),
      updateExisting: async (targetRowId) => {
        const query = `
          UPDATE user_sleep
          SET sleep_start = $3,
              sleep_end = $4
          WHERE user_id = $1
            AND id = $2
          RETURNING id
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          targetRowId,
          measurement.target.sleepStart,
          measurement.target.sleepEnd,
        ]);
        return result.rows[0]?.id ?? null;
      },
      matchExisting: async () => {
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
          measurement.target.sleepStart,
          measurement.target.sleepEnd,
        ]);
        return result.rows[0]?.id ?? null;
      },
      insertNew: async () => {
        const query = `
          INSERT INTO user_sleep (user_id, sleep_start, sleep_end, note)
          VALUES ($1, $2, $3, NULL)
          RETURNING id
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          measurement.target.sleepStart,
          measurement.target.sleepEnd,
        ]);
        return result.rows[0].id;
      },
    });
  }

  private async syncWeightMeasurement(
    client: PoolClient,
    userId: string,
    measurement: NormalizedSourceMeasurement<NormalizedWeightLog>,
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    const tableName = "user_weight_log" satisfies TargetTableName;

    await this.syncOneToOneMeasurement({
      client,
      userId,
      source: measurement.source,
      tableName,
      stats,
      targetExists: (targetRowId) =>
        this.targetRowExists(client, userId, tableName, targetRowId),
      updateExisting: async (targetRowId) => {
        const query = `
          UPDATE user_weight_log
          SET measured_at = $3,
              weight_grams = $4,
              body_fat_percentage = $5,
              lean_tissue_percentage = $6,
              water_percentage = $7,
              bone_mass_percentage = $8
          WHERE user_id = $1
            AND id = $2
          RETURNING id
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          targetRowId,
          measurement.target.measuredAt,
          measurement.target.weightGrams,
          measurement.target.bodyFatPercentage,
          measurement.target.leanTissuePercentage,
          measurement.target.waterPercentage,
          measurement.target.boneMassPercentage,
        ]);
        return result.rows[0]?.id ?? null;
      },
      matchExisting: async () => {
        const query = `
          SELECT id
          FROM user_weight_log
          WHERE user_id = $1
            AND measured_at = $2
            AND weight_grams = $3
          LIMIT 1
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          measurement.target.measuredAt,
          measurement.target.weightGrams,
        ]);
        return result.rows[0]?.id ?? null;
      },
      insertNew: async () => {
        const query = `
          INSERT INTO user_weight_log (
            user_id,
            measured_at,
            weight_grams,
            body_fat_percentage,
            lean_tissue_percentage,
            water_percentage,
            bone_mass_percentage
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          measurement.target.measuredAt,
          measurement.target.weightGrams,
          measurement.target.bodyFatPercentage,
          measurement.target.leanTissuePercentage,
          measurement.target.waterPercentage,
          measurement.target.boneMassPercentage,
        ]);
        return result.rows[0].id;
      },
    });
  }

  private async syncHeightMeasurement(
    client: PoolClient,
    userId: string,
    measurement: NormalizedSourceMeasurement<NormalizedHeightLog>,
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    const tableName = "user_height_log" satisfies TargetTableName;

    await this.syncOneToOneMeasurement({
      client,
      userId,
      source: measurement.source,
      tableName,
      stats,
      targetExists: (targetRowId) =>
        this.targetRowExists(client, userId, tableName, targetRowId),
      updateExisting: async (targetRowId) => {
        const query = `
          UPDATE user_height_log
          SET measured_at = $3,
              height_cm = $4
          WHERE user_id = $1
            AND id = $2
          RETURNING id
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          targetRowId,
          measurement.target.measuredAt,
          measurement.target.heightCm,
        ]);
        return result.rows[0]?.id ?? null;
      },
      matchExisting: async () => {
        const query = `
          SELECT id
          FROM user_height_log
          WHERE user_id = $1
            AND measured_at = $2
            AND height_cm = $3
          LIMIT 1
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          measurement.target.measuredAt,
          measurement.target.heightCm,
        ]);
        return result.rows[0]?.id ?? null;
      },
      insertNew: async () => {
        const query = `
          INSERT INTO user_height_log (user_id, measured_at, height_cm)
          VALUES ($1, $2, $3)
          RETURNING id
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          measurement.target.measuredAt,
          measurement.target.heightCm,
        ]);
        return result.rows[0].id;
      },
    });
  }

  private async syncHeartRateMeasurement(
    client: PoolClient,
    userId: string,
    measurement: NormalizedSourceMeasurement<NormalizedHeartRateLog>,
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    const tableName = "user_heart_rate_log" satisfies TargetTableName;

    await this.syncOneToOneMeasurement({
      client,
      userId,
      source: measurement.source,
      tableName,
      stats,
      targetExists: (targetRowId) =>
        this.targetRowExists(client, userId, tableName, targetRowId),
      updateExisting: async (targetRowId) => {
        const query = `
          UPDATE user_heart_rate_log
          SET measured_at = $3,
              bpm = $4
          WHERE user_id = $1
            AND id = $2
          RETURNING id
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          targetRowId,
          measurement.target.measuredAt,
          measurement.target.bpm,
        ]);
        return result.rows[0]?.id ?? null;
      },
      matchExisting: async () => {
        const query = `
          SELECT id
          FROM user_heart_rate_log
          WHERE user_id = $1
            AND measured_at = $2
            AND bpm = $3
          LIMIT 1
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          measurement.target.measuredAt,
          measurement.target.bpm,
        ]);
        return result.rows[0]?.id ?? null;
      },
      insertNew: async () => {
        const query = `
          INSERT INTO user_heart_rate_log (user_id, measured_at, bpm)
          VALUES ($1, $2, $3)
          RETURNING id
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          measurement.target.measuredAt,
          measurement.target.bpm,
        ]);
        return result.rows[0].id;
      },
    });
  }

  private async syncBloodPressureMeasurement(
    client: PoolClient,
    userId: string,
    measurement: NormalizedSourceMeasurement<NormalizedBloodPressureLog>,
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    const tableName = "user_blood_pressure_log" satisfies TargetTableName;

    await this.syncOneToOneMeasurement({
      client,
      userId,
      source: measurement.source,
      tableName,
      stats,
      targetExists: (targetRowId) =>
        this.targetRowExists(client, userId, tableName, targetRowId),
      updateExisting: async (targetRowId) => {
        const query = `
          UPDATE user_blood_pressure_log
          SET measured_at = $3,
              systolic_mmhg = $4,
              diastolic_mmhg = $5
          WHERE user_id = $1
            AND id = $2
          RETURNING id
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          targetRowId,
          measurement.target.measuredAt,
          measurement.target.systolicMmhg,
          measurement.target.diastolicMmhg,
        ]);
        return result.rows[0]?.id ?? null;
      },
      matchExisting: async () => {
        const query = `
          SELECT id
          FROM user_blood_pressure_log
          WHERE user_id = $1
            AND measured_at = $2
            AND systolic_mmhg = $3
            AND diastolic_mmhg = $4
          LIMIT 1
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          measurement.target.measuredAt,
          measurement.target.systolicMmhg,
          measurement.target.diastolicMmhg,
        ]);
        return result.rows[0]?.id ?? null;
      },
      insertNew: async () => {
        const query = `
          INSERT INTO user_blood_pressure_log (
            user_id,
            measured_at,
            systolic_mmhg,
            diastolic_mmhg
          )
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `;
        const result = await client.query<{ id: string }>(query, [
          userId,
          measurement.target.measuredAt,
          measurement.target.systolicMmhg,
          measurement.target.diastolicMmhg,
        ]);
        return result.rows[0].id;
      },
    });
  }

  private async syncAppleSleepMeasurements(
    client: PoolClient,
    userId: string,
    records: Array<Extract<AppleHealthSyncBatchRequest["records"][number], { kind: "sleep" }>>,
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    const normalized = records.map((record) => normalizeAppleHealthSleepRecord(record));

    for (const item of normalized) {
      await this.saveSourceItem(client, userId, item.source, "user_sleep", null);
    }

    const sortedRecords = [...records].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const earliestStart = new Date(sortedRecords[0]!.startDate);
    earliestStart.setMinutes(earliestStart.getMinutes() - 30);

    const latestEnd = new Date(sortedRecords[sortedRecords.length - 1]!.endDate);
    latestEnd.setMinutes(latestEnd.getMinutes() + 30);

    const sourceRows = await this.getAppleSleepSourceRowsInRange(
      client,
      userId,
      earliestStart.toISOString(),
      latestEnd.toISOString(),
    );

    const snapshots = sourceRows.map(appleSleepSnapshotFromSourceItem);
    const clusters = clusterAppleSleepSamples(snapshots);
    const existingSyncedRowIds = Array.from(
      new Set(
        snapshots
          .map((snapshot) => snapshot.existingTargetRowId)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const existingSyncedRows = await this.getSleepRowsByIds(
      client,
      userId,
      existingSyncedRowIds,
    );

    const reusableSyncedRows = new Map(
      existingSyncedRows.map((row) => [`${row.sleep_start}|${row.sleep_end}`, row.id]),
    );

    const reusedSyncedRowIds = new Set<string>();
    const clusterAssignments = new Map<string, string>();

    for (const cluster of clusters) {
      const exactKey = `${cluster.sleepStart}|${cluster.sleepEnd}`;
      const reusedSyncedRowId = reusableSyncedRows.get(exactKey);

      if (reusedSyncedRowId) {
        reusedSyncedRowIds.add(reusedSyncedRowId);
        clusterAssignments.set(exactKey, reusedSyncedRowId);
        continue;
      }

      const matchedManualRowId = await this.findMatchingSleepRow(
        client,
        userId,
        cluster.sleepStart,
        cluster.sleepEnd,
      );

      if (matchedManualRowId) {
        clusterAssignments.set(exactKey, matchedManualRowId);
        stats.matchedExisting += 1;
        continue;
      }

      const insertedSleepRowId = await this.insertSleepRow(
        client,
        userId,
        cluster.sleepStart,
        cluster.sleepEnd,
      );
      clusterAssignments.set(exactKey, insertedSleepRowId);
      stats.inserted += 1;
    }

    const removableSyncedRowIds = existingSyncedRowIds.filter(
      (rowId) => !reusedSyncedRowIds.has(rowId),
    );

    if (removableSyncedRowIds.length > 0) {
      await client.query(
        `
          DELETE FROM user_sleep
          WHERE user_id = $1
            AND id = ANY($2::uuid[])
        `,
        [userId, removableSyncedRowIds],
      );
      stats.updated += removableSyncedRowIds.length;
    }

    const sourceItemToTargetRowId = new Map<string, string>();

    for (const cluster of clusters) {
      const exactKey = `${cluster.sleepStart}|${cluster.sleepEnd}`;
      const targetRowId = clusterAssignments.get(exactKey);
      if (!targetRowId) continue;

      for (const sourceItemId of cluster.sourceItemIds) {
        sourceItemToTargetRowId.set(sourceItemId, targetRowId);
      }
    }

    for (const snapshot of snapshots) {
      const targetRowId = sourceItemToTargetRowId.get(snapshot.source.sourceItemId);
      if (!targetRowId) continue;
      await this.saveSourceItem(client, userId, snapshot.source, "user_sleep", targetRowId);
    }
  }

  private async syncOneToOneMeasurement<T>(args: {
    client: PoolClient;
    userId: string;
    source: SyncSourceDescriptor;
    tableName: TargetTableName;
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    };
    targetExists: (targetRowId: string) => Promise<boolean>;
    updateExisting: (targetRowId: string) => Promise<string | null>;
    matchExisting: () => Promise<string | null>;
    insertNew: () => Promise<string>;
  }) {
    const existingSourceItem = await this.getSourceItem(
      args.client,
      args.userId,
      args.source.provider,
      args.source.sourceType,
      args.source.sourceItemId,
    );

    if (args.source.usedSyntheticId) {
      args.stats.warnings.add(
        `Missing provider source identifier for ${args.source.provider}:${args.source.sourceType}; using synthetic idempotency key.`,
      );
    }

    if (existingSourceItem?.checksum === args.source.checksum) {
      const hasValidTarget =
        existingSourceItem.target_row_id &&
        (await args.targetExists(existingSourceItem.target_row_id));

      if (hasValidTarget) {
        args.stats.skipped += 1;
        return;
      }
    }

    if (existingSourceItem?.target_row_id) {
      const updatedTargetRowId = await args.updateExisting(existingSourceItem.target_row_id);
      if (updatedTargetRowId) {
        await this.saveSourceItem(
          args.client,
          args.userId,
          args.source,
          args.tableName,
          updatedTargetRowId,
        );
        args.stats.updated += 1;
        return;
      }
    }

    const matchedExistingRowId = await args.matchExisting();
    if (matchedExistingRowId) {
      await this.saveSourceItem(
        args.client,
        args.userId,
        args.source,
        args.tableName,
        matchedExistingRowId,
      );
      args.stats.matchedExisting += 1;
      return;
    }

    const insertedRowId = await args.insertNew();
    await this.saveSourceItem(
      args.client,
      args.userId,
      args.source,
      args.tableName,
      insertedRowId,
    );
    args.stats.inserted += 1;
  }

  private async lockProvider(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
  ) {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      [`${userId}:${provider}`],
    );
  }

  private async getSyncStateForClient(
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
    const result = await client.query<HealthSyncStateRow>(query, [userId, provider]);
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

  private async saveSyncState(
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

    await client.query(query, [userId, provider, JSON.stringify(nextSyncState)]);
  }

  private async assertPendingRunCanProceed(
    client: PoolClient,
    userId: string,
    input: HealthSyncBatchRequest,
  ) {
    if (input.batchIndex === 0) {
      return;
    }

    const pendingRun = await this.getPendingRun(client, userId, input.provider);

    if (!pendingRun) {
      throw new HealthSyncConflictError(
        "Health sync batch sequence is missing. Restart the sync run.",
      );
    }

    if (pendingRun.sync_run_id !== input.syncRunId) {
      throw new HealthSyncConflictError(
        "Health sync batch belongs to a different run. Restart the sync run.",
      );
    }

    if (pendingRun.expected_batch_index !== input.batchIndex) {
      throw new HealthSyncConflictError(
        "Health sync batch arrived out of order. Restart the sync run.",
      );
    }

    if (
      stableStringify(pendingRun.current_sync_state) !==
      stableStringify(input.currentSyncState)
    ) {
      throw new HealthSyncConflictError(
        "Health sync run base state changed. Restart the sync run.",
      );
    }

    if (
      stableStringify(pendingRun.next_sync_state) !==
      stableStringify(input.nextSyncState)
    ) {
      throw new HealthSyncConflictError(
        "Health sync run payload changed mid-run. Restart the sync run.",
      );
    }
  }

  private async getPendingRun(
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

  private async savePendingRun(
    client: PoolClient,
    userId: string,
    input: HealthSyncBatchRequest,
  ) {
    const query = `
      INSERT INTO user_health_sync_pending_run (
        user_id,
        provider,
        sync_run_id,
        expected_batch_index,
        current_sync_state,
        next_sync_state,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW())
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        sync_run_id = EXCLUDED.sync_run_id,
        expected_batch_index = EXCLUDED.expected_batch_index,
        current_sync_state = EXCLUDED.current_sync_state,
        next_sync_state = EXCLUDED.next_sync_state,
        updated_at = NOW()
    `;

    await client.query(query, [
      userId,
      input.provider,
      input.syncRunId,
      input.batchIndex + 1,
      JSON.stringify(input.currentSyncState),
      JSON.stringify(input.nextSyncState),
    ]);
  }

  private async clearPendingRun(
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

  private async getSourceItem(
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

  private async saveSourceItem(
    client: PoolClient,
    userId: string,
    source: SyncSourceDescriptor,
    targetTable: TargetTableName,
    targetRowId: string | null,
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
    ]);
  }

  private async targetRowExists(
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

  private async getAppleSleepSourceRowsInRange(
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

  private async getSleepRowsByIds(
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

  private async findMatchingSleepRow(
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

  private async insertSleepRow(
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
}

export const healthSyncService = new HealthSyncService();
export { HealthSyncConflictError };
