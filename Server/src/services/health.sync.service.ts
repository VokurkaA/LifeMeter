import type {
  AppleHealthSyncBatchRequest,
  HealthSyncBatchRequest,
  HealthSyncState,
} from "@/schemas/user.sync.schema";
import { pool } from "@/config/db.config";
import type {
  HealthSyncProvider,
  HealthSyncSourceItemRow,
  HealthSyncSourceType,
  HealthSyncStateRow,
} from "@/types/sync.types";
import {
  appleSleepSnapshotFromSourceItem,
  clusterAppleSleepSamples,
  mapClientSourceTypeToSyncSourceType,
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
import {
  healthSyncStore,
  type HealthSyncStatus,
  type TargetTableName,
} from "@/services/health.sync.store";
import type { PoolClient } from "pg";

interface HealthSyncBatchResult {
  inserted: number;
  updated: number;
  matchedExisting: number;
  skipped: number;
  warnings: string[];
  committedSyncState: HealthSyncState | null;
}

type AppleHealthSleepDeletionRecord = {
  kind: "deletion";
  sourceItemId: string;
  sourceType: "sleep";
};

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
      await healthSyncStore.lockProvider(client, userId, input.provider);

      const currentStatus = await healthSyncStore.getSyncStateForClient(
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

      const pendingRun = await this.assertPendingRunCanProceed(
        client,
        userId,
        input,
      );
      const isResetRun =
        input.batchIndex === 0
          ? input.resetExistingData === true
          : pendingRun !== null && healthSyncStore.isResetPendingRun(pendingRun);

      const stats = {
        inserted: 0,
        updated: 0,
        matchedExisting: 0,
        skipped: 0,
        warnings: new Set<string>(),
      };

      if (input.batchIndex === 0 && isResetRun && !input.isFinalBatch) {
        await healthSyncStore.savePendingRun(client, userId, input, {
          isResetRun,
        });
      }

      if (input.batchIndex === 0 && isResetRun && input.isFinalBatch) {
        await this.resetProviderData(client, userId, input.provider, stats);
      }

      if (input.provider === "health-connect") {
        await this.processHealthConnectBatch(
          client,
          userId,
          input,
          stats,
          isResetRun,
        );
      } else {
        await this.processAppleHealthBatch(
          client,
          userId,
          input,
          stats,
          isResetRun,
        );
      }

      let committedSyncState = currentStatus.syncState;
      if (input.isFinalBatch) {
        if (isResetRun && pendingRun) {
          await this.pruneProviderDataUpdatedBefore(
            client,
            userId,
            input.provider,
            pendingRun.created_at,
            stats,
          );
        }
        committedSyncState = input.nextSyncState;
        await healthSyncStore.saveSyncState(
          client,
          userId,
          input.provider,
          input.nextSyncState,
        );
        await healthSyncStore.clearPendingRun(client, userId, input.provider);
      } else {
        await healthSyncStore.savePendingRun(client, userId, input, {
          isResetRun,
        });
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
    touchExistingOnChecksumMatch: boolean,
  ) {
    for (const record of input.records) {
      switch (record.kind) {
        case "sleep":
          await this.syncSleepMeasurement(
            client,
            userId,
            normalizeHealthConnectSleepRecord(record),
            stats,
            touchExistingOnChecksumMatch,
          );
          break;
        case "weight":
          await this.syncWeightMeasurement(
            client,
            userId,
            normalizeHealthConnectWeightRecord(record),
            stats,
            touchExistingOnChecksumMatch,
          );
          break;
        case "height":
          await this.syncHeightMeasurement(
            client,
            userId,
            normalizeHealthConnectHeightRecord(record),
            stats,
            touchExistingOnChecksumMatch,
          );
          break;
        case "heartRate":
          for (const sample of normalizeHealthConnectHeartRateRecord(record)) {
            await this.syncHeartRateMeasurement(
              client,
              userId,
              sample,
              stats,
              touchExistingOnChecksumMatch,
            );
          }
          break;
        case "bloodPressure":
          await this.syncBloodPressureMeasurement(
            client,
            userId,
            normalizeHealthConnectBloodPressureRecord(record),
            stats,
            touchExistingOnChecksumMatch,
          );
          break;
        case "deletion":
          await this.syncDeletion(
            client,
            userId,
            input.provider,
            record.sourceItemId,
            record.sourceType
              ? mapClientSourceTypeToSyncSourceType(record.sourceType)
              : undefined,
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
    touchExistingOnChecksumMatch: boolean,
  ) {
    const sleepRecords = input.records.filter(
      (record): record is Extract<AppleHealthSyncBatchRequest["records"][number], { kind: "sleep" }> =>
        record.kind === "sleep",
    );
    const sleepDeletions = input.records.filter(
      (record): record is AppleHealthSleepDeletionRecord =>
        record.kind === "deletion" && record.sourceType === "sleep",
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
            touchExistingOnChecksumMatch,
          );
          break;
        case "height":
          await this.syncHeightMeasurement(
            client,
            userId,
            normalizeAppleHealthHeightRecord(record),
            stats,
            touchExistingOnChecksumMatch,
          );
          break;
        case "heartRate":
          await this.syncHeartRateMeasurement(
            client,
            userId,
            normalizeAppleHealthHeartRateRecord(record),
            stats,
            touchExistingOnChecksumMatch,
          );
          break;
        case "bloodPressure":
          await this.syncBloodPressureMeasurement(
            client,
            userId,
            normalizeAppleHealthBloodPressureRecord(record),
            stats,
            touchExistingOnChecksumMatch,
          );
          break;
        case "deletion":
          if (record.sourceType === "sleep") {
            break;
          }

          await this.syncDeletion(
            client,
            userId,
            input.provider,
            record.sourceItemId,
            mapClientSourceTypeToSyncSourceType(record.sourceType),
            stats,
          );
          break;
      }
    }

    if (sleepRecords.length > 0 || sleepDeletions.length > 0) {
      await this.syncAppleSleepMeasurements(
        client,
        userId,
        sleepRecords,
        sleepDeletions,
        stats,
      );
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
    touchExistingOnChecksumMatch = false,
  ) {
    const tableName = "user_sleep" satisfies TargetTableName;

    await this.syncOneToOneMeasurement({
      client,
      userId,
      source: measurement.source,
      tableName,
      stats,
      touchExistingOnChecksumMatch,
      targetExists: (targetRowId) =>
        healthSyncStore.targetRowExists(client, userId, tableName, targetRowId),
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
    touchExistingOnChecksumMatch = false,
  ) {
    const tableName = "user_weight_log" satisfies TargetTableName;

    await this.syncOneToOneMeasurement({
      client,
      userId,
      source: measurement.source,
      tableName,
      stats,
      touchExistingOnChecksumMatch,
      targetExists: (targetRowId) =>
        healthSyncStore.targetRowExists(client, userId, tableName, targetRowId),
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
    touchExistingOnChecksumMatch = false,
  ) {
    const tableName = "user_height_log" satisfies TargetTableName;

    await this.syncOneToOneMeasurement({
      client,
      userId,
      source: measurement.source,
      tableName,
      stats,
      touchExistingOnChecksumMatch,
      targetExists: (targetRowId) =>
        healthSyncStore.targetRowExists(client, userId, tableName, targetRowId),
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
    touchExistingOnChecksumMatch = false,
  ) {
    const tableName = "user_heart_rate_log" satisfies TargetTableName;

    await this.syncOneToOneMeasurement({
      client,
      userId,
      source: measurement.source,
      tableName,
      stats,
      touchExistingOnChecksumMatch,
      targetExists: (targetRowId) =>
        healthSyncStore.targetRowExists(client, userId, tableName, targetRowId),
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
    touchExistingOnChecksumMatch = false,
  ) {
    const tableName = "user_blood_pressure_log" satisfies TargetTableName;

    await this.syncOneToOneMeasurement({
      client,
      userId,
      source: measurement.source,
      tableName,
      stats,
      touchExistingOnChecksumMatch,
      targetExists: (targetRowId) =>
        healthSyncStore.targetRowExists(client, userId, tableName, targetRowId),
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
    deletions: AppleHealthSleepDeletionRecord[],
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    const normalized = records.map((record) => normalizeAppleHealthSleepRecord(record));
    const existingSourceRows = await healthSyncStore.getSourceItemsBySourceItemIds(
      client,
      userId,
      "apple-health",
      "sleep",
      normalized.map((item) => item.source.sourceItemId),
    );
    const existingSourceRowsBySourceItemId = new Map(
      existingSourceRows.map((row) => [row.source_item_id, row]),
    );
    const affectedRanges: Array<{ start: string; end: string }> = [];

    for (const item of normalized) {
      const existingSourceRow =
        existingSourceRowsBySourceItemId.get(item.source.sourceItemId) ?? null;
      const previousStart = this.timestampToIsoString(
        existingSourceRow?.source_start_at ?? null,
      );
      const previousEnd = this.timestampToIsoString(
        existingSourceRow?.source_end_at ?? null,
      );

      if (previousStart && previousEnd) {
        affectedRanges.push({
          start: previousStart,
          end: previousEnd,
        });
      }

      const preservedTargetRowId =
        existingSourceRow?.target_table === "user_sleep"
          ? existingSourceRow.target_row_id
          : null;
      const preservedOwnsTarget =
        existingSourceRow?.target_table === "user_sleep"
          ? existingSourceRow.owns_target
          : false;

      await healthSyncStore.saveSourceItem(
        client,
        userId,
        item.source,
        "user_sleep",
        preservedTargetRowId,
        preservedOwnsTarget,
      );
      affectedRanges.push({
        start: item.source.sourceStartAt,
        end: item.source.sourceEndAt,
      });
    }

    const deletedSourceRows: HealthSyncSourceItemRow[] = [];
    for (const deletion of deletions) {
      const sourceRows = await healthSyncStore.getSourceItemsForDeletion(
        client,
        userId,
        "apple-health",
        deletion.sourceItemId,
        "sleep",
      );

      if (sourceRows.length === 0) {
        stats.skipped += 1;
        continue;
      }

      deletedSourceRows.push(...sourceRows);
      for (const sourceRow of sourceRows) {
        const start = this.timestampToIsoString(sourceRow.source_start_at);
        const end = this.timestampToIsoString(sourceRow.source_end_at);

        if (start && end) {
          affectedRanges.push({ start, end });
        }
      }
    }

    if (deletedSourceRows.length > 0) {
      await healthSyncStore.deleteSourceItemsByIds(
        client,
        deletedSourceRows.map((row) => row.id),
      );
    }

    if (affectedRanges.length === 0) {
      return;
    }

    const sourceRows = await this.getConnectedAppleSleepSourceRows(
      client,
      userId,
      affectedRanges,
    );
    const snapshots = sourceRows.map(appleSleepSnapshotFromSourceItem);
    const clusters = clusterAppleSleepSamples(snapshots);

    const ownedTargetRowIds = Array.from(
      new Set(
        [
          ...snapshots
            .filter((snapshot) => snapshot.ownsTarget)
            .map((snapshot) => snapshot.existingTargetRowId),
          ...deletedSourceRows
            .filter((row) => row.owns_target)
            .map((row) => row.target_row_id),
        ].filter((value): value is string => Boolean(value)),
      ),
    );

    const existingOwnedRows = await healthSyncStore.getSleepRowsByIds(
      client,
      userId,
      ownedTargetRowIds,
    );
    const ownedTargetRowIdSet = new Set(ownedTargetRowIds);
    const reusableOwnedRows = new Map(
      existingOwnedRows.map((row) => [`${row.sleep_start}|${row.sleep_end}`, row.id]),
    );

    const reusedOwnedRowIds = new Set<string>();
    const clusterAssignments = new Map<
      string,
      { targetRowId: string; ownsTarget: boolean }
    >();

    for (const cluster of clusters) {
      const exactKey = `${cluster.sleepStart}|${cluster.sleepEnd}`;
      const reusedOwnedRowId = reusableOwnedRows.get(exactKey);

      if (reusedOwnedRowId) {
        reusedOwnedRowIds.add(reusedOwnedRowId);
        clusterAssignments.set(exactKey, {
          targetRowId: reusedOwnedRowId,
          ownsTarget: true,
        });
        continue;
      }

      const matchedRowId = await healthSyncStore.findMatchingSleepRow(
        client,
        userId,
        cluster.sleepStart,
        cluster.sleepEnd,
      );

      if (matchedRowId) {
        const ownsTarget = ownedTargetRowIdSet.has(matchedRowId);

        if (ownsTarget) {
          reusedOwnedRowIds.add(matchedRowId);
        } else {
          stats.matchedExisting += 1;
        }

        clusterAssignments.set(exactKey, {
          targetRowId: matchedRowId,
          ownsTarget,
        });
        continue;
      }

      const insertedSleepRowId = await healthSyncStore.insertSleepRow(
        client,
        userId,
        cluster.sleepStart,
        cluster.sleepEnd,
      );
      clusterAssignments.set(exactKey, {
        targetRowId: insertedSleepRowId,
        ownsTarget: true,
      });
      stats.inserted += 1;
    }

    const removableOwnedRowIds: string[] = [];
    const retainedSharedOwnedRowIds: string[] = [];

    for (const rowId of ownedTargetRowIds) {
      if (reusedOwnedRowIds.has(rowId)) {
        continue;
      }

      const hasNonAppleReferences =
        await healthSyncStore.hasSourceItemForTargetExcludingProvider(
          client,
          userId,
          "user_sleep",
          rowId,
          "apple-health",
        );

      if (hasNonAppleReferences) {
        retainedSharedOwnedRowIds.push(rowId);
        continue;
      }

      removableOwnedRowIds.push(rowId);
    }

    if (removableOwnedRowIds.length > 0) {
      await client.query(
        `
          DELETE FROM user_sleep
          WHERE user_id = $1
            AND id = ANY($2::uuid[])
        `,
        [userId, removableOwnedRowIds],
      );
      stats.updated += removableOwnedRowIds.length;
    }

    const sourceItemAssignments = new Map<
      string,
      { targetRowId: string; ownsTarget: boolean }
    >();

    for (const cluster of clusters) {
      const exactKey = `${cluster.sleepStart}|${cluster.sleepEnd}`;
      const assignment = clusterAssignments.get(exactKey);
      if (!assignment) continue;

      for (const sourceItemId of cluster.sourceItemIds) {
        sourceItemAssignments.set(sourceItemId, assignment);
      }
    }

    for (const snapshot of snapshots) {
      const assignment = sourceItemAssignments.get(snapshot.source.sourceItemId);
      if (!assignment) continue;
      await healthSyncStore.saveSourceItem(
        client,
        userId,
        snapshot.source,
        "user_sleep",
        assignment.targetRowId,
        assignment.ownsTarget,
      );
    }

    for (const rowId of retainedSharedOwnedRowIds) {
      await healthSyncStore.promoteTargetOwnerIfMissing(
        client,
        userId,
        "user_sleep",
        rowId,
      );
    }
  }

  private async syncDeletion(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
    sourceItemId: string,
    sourceType: HealthSyncSourceType | undefined,
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    const sourceRows = await healthSyncStore.getSourceItemsForDeletion(
      client,
      userId,
      provider,
      sourceItemId,
      sourceType,
    );

    if (sourceRows.length === 0) {
      stats.skipped += 1;
      return;
    }

    const ownedTargets = Array.from(
      new Map(
        sourceRows
          .filter(
            (row): row is HealthSyncSourceItemRow & {
              target_table: TargetTableName;
              target_row_id: string;
            } =>
              row.owns_target &&
              this.isTargetTableName(row.target_table) &&
              Boolean(row.target_row_id),
          )
          .map((row) => [
            `${row.target_table}:${row.target_row_id}`,
            {
              tableName: row.target_table,
              targetRowId: row.target_row_id,
            },
          ]),
      ).values(),
    );

    await healthSyncStore.deleteSourceItemsByIds(
      client,
      sourceRows.map((row) => row.id),
    );

    for (const target of ownedTargets) {
      const stillReferenced = await healthSyncStore.hasAnySourceItemForTarget(
        client,
        userId,
        target.tableName,
        target.targetRowId,
      );

      if (stillReferenced) {
        await healthSyncStore.promoteTargetOwnerIfMissing(
          client,
          userId,
          target.tableName,
          target.targetRowId,
        );
        continue;
      }

      await healthSyncStore.deleteTargetRow(
        client,
        userId,
        target.tableName,
        target.targetRowId,
      );
      stats.updated += 1;
    }
  }

  private isTargetTableName(value: string | null): value is TargetTableName {
    return (
      value === "user_sleep" ||
      value === "user_weight_log" ||
      value === "user_height_log" ||
      value === "user_heart_rate_log" ||
      value === "user_blood_pressure_log"
    );
  }

  private timestampToIsoString(value: string | Date | null): string | null {
    if (!value) return null;
    return value instanceof Date ? value.toISOString() : value;
  }

  private async resetProviderData(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    const sourceRows = await healthSyncStore.getSourceItemsForProvider(
      client,
      userId,
      provider,
    );

    if (sourceRows.length === 0) {
      return;
    }

    await this.removeSourceItemsAndOwnedTargets(
      client,
      userId,
      sourceRows,
      stats,
    );
  }

  private async pruneProviderDataUpdatedBefore(
    client: PoolClient,
    userId: string,
    provider: HealthSyncProvider,
    updatedBefore: string | Date,
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    const sourceRows = await healthSyncStore.getSourceItemsForProviderUpdatedBefore(
      client,
      userId,
      provider,
      updatedBefore,
    );

    if (sourceRows.length === 0) {
      return;
    }

    await this.removeSourceItemsAndOwnedTargets(
      client,
      userId,
      sourceRows,
      stats,
    );
  }

  private async removeSourceItemsAndOwnedTargets(
    client: PoolClient,
    userId: string,
    sourceRows: HealthSyncSourceItemRow[],
    stats: {
      inserted: number;
      updated: number;
      matchedExisting: number;
      skipped: number;
      warnings: Set<string>;
    },
  ) {
    const ownedTargets = Array.from(
      new Map(
        sourceRows
          .filter(
            (row): row is HealthSyncSourceItemRow & {
              target_table: TargetTableName;
              target_row_id: string;
            } =>
              row.owns_target &&
              this.isTargetTableName(row.target_table) &&
              Boolean(row.target_row_id),
          )
          .map((row) => [
            `${row.target_table}:${row.target_row_id}`,
            {
              tableName: row.target_table,
              targetRowId: row.target_row_id,
            },
          ]),
      ).values(),
    );

    await healthSyncStore.deleteSourceItemsByIds(
      client,
      sourceRows.map((row) => row.id),
    );

    for (const target of ownedTargets) {
      const stillReferenced = await healthSyncStore.hasAnySourceItemForTarget(
        client,
        userId,
        target.tableName,
        target.targetRowId,
      );

      if (stillReferenced) {
        await healthSyncStore.promoteTargetOwnerIfMissing(
          client,
          userId,
          target.tableName,
          target.targetRowId,
        );
        continue;
      }

      await healthSyncStore.deleteTargetRow(
        client,
        userId,
        target.tableName,
        target.targetRowId,
      );
      stats.updated += 1;
    }
  }

  private async getConnectedAppleSleepSourceRows(
    client: PoolClient,
    userId: string,
    seedRanges: Array<{ start: string; end: string }>,
  ) {
    const rangeStart = new Date(
      Math.min(...seedRanges.map((range) => new Date(range.start).getTime())),
    );
    rangeStart.setMinutes(rangeStart.getMinutes() - 30);

    const rangeEnd = new Date(
      Math.max(...seedRanges.map((range) => new Date(range.end).getTime())),
    );
    rangeEnd.setMinutes(rangeEnd.getMinutes() + 30);

    while (true) {
      const sourceRows = await healthSyncStore.getAppleSleepSourceRowsInRange(
        client,
        userId,
        rangeStart.toISOString(),
        rangeEnd.toISOString(),
      );

      if (sourceRows.length === 0) {
        return [];
      }

      let nextStartTime = rangeStart.getTime();
      let nextEndTime = rangeEnd.getTime();

      for (const sourceRow of sourceRows) {
        const sourceStart = this.timestampToIsoString(sourceRow.source_start_at);
        const sourceEnd = this.timestampToIsoString(sourceRow.source_end_at);

        if (sourceStart) {
          nextStartTime = Math.min(
            nextStartTime,
            new Date(sourceStart).getTime() - 30 * 60 * 1000,
          );
        }

        if (sourceEnd) {
          nextEndTime = Math.max(
            nextEndTime,
            new Date(sourceEnd).getTime() + 30 * 60 * 1000,
          );
        }
      }

      if (
        nextStartTime === rangeStart.getTime() &&
        nextEndTime === rangeEnd.getTime()
      ) {
        return sourceRows;
      }

      rangeStart.setTime(nextStartTime);
      rangeEnd.setTime(nextEndTime);
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
    touchExistingOnChecksumMatch?: boolean;
    targetExists: (targetRowId: string) => Promise<boolean>;
    updateExisting: (targetRowId: string) => Promise<string | null>;
    matchExisting: () => Promise<string | null>;
    insertNew: () => Promise<string>;
  }) {
    const existingSourceItem = await healthSyncStore.getSourceItem(
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
        if (args.touchExistingOnChecksumMatch) {
          await healthSyncStore.saveSourceItem(
            args.client,
            args.userId,
            args.source,
            args.tableName,
            existingSourceItem.target_row_id,
            existingSourceItem.owns_target,
          );
        }
        args.stats.skipped += 1;
        return;
      }
    }

    if (existingSourceItem?.target_row_id) {
      if (existingSourceItem.owns_target) {
        const hasSharedTarget = await healthSyncStore.hasOtherSourceItemsForTarget(
          args.client,
          args.userId,
          args.tableName,
          existingSourceItem.target_row_id,
          existingSourceItem.id,
        );

        if (!hasSharedTarget) {
          const updatedTargetRowId = await args.updateExisting(
            existingSourceItem.target_row_id,
          );
          if (updatedTargetRowId) {
            await healthSyncStore.saveSourceItem(
              args.client,
              args.userId,
              args.source,
              args.tableName,
              updatedTargetRowId,
              true,
            );
            args.stats.updated += 1;
            return;
          }
        }
      }
    }

    const matchedExistingRowId = await args.matchExisting();
    if (matchedExistingRowId) {
      const preservesExistingOwnership =
        existingSourceItem?.owns_target === true &&
        existingSourceItem.target_row_id === matchedExistingRowId;

      await healthSyncStore.saveSourceItem(
        args.client,
        args.userId,
        args.source,
        args.tableName,
        matchedExistingRowId,
        preservesExistingOwnership,
      );

      if (
        existingSourceItem?.owns_target &&
        existingSourceItem.target_row_id &&
        existingSourceItem.target_row_id !== matchedExistingRowId
      ) {
        await healthSyncStore.promoteTargetOwnerIfMissing(
          args.client,
          args.userId,
          args.tableName,
          existingSourceItem.target_row_id,
        );
      }

      args.stats.matchedExisting += 1;
      return;
    }

    const insertedRowId = await args.insertNew();
    await healthSyncStore.saveSourceItem(
      args.client,
      args.userId,
      args.source,
      args.tableName,
      insertedRowId,
      true,
    );

    if (
      existingSourceItem?.owns_target &&
      existingSourceItem.target_row_id &&
      existingSourceItem.target_row_id !== insertedRowId
    ) {
      await healthSyncStore.promoteTargetOwnerIfMissing(
        args.client,
        args.userId,
        args.tableName,
        existingSourceItem.target_row_id,
      );
    }

    args.stats.inserted += 1;
  }

  private async assertPendingRunCanProceed(
    client: PoolClient,
    userId: string,
    input: HealthSyncBatchRequest,
  ) {
    if (input.batchIndex === 0) {
      return null;
    }

    const pendingRun = await healthSyncStore.getPendingRun(
      client,
      userId,
      input.provider,
    );

    if (!pendingRun) {
      throw new HealthSyncConflictError(
        "Health sync batch sequence is missing. Restart the sync run.",
      );
    }

    if (healthSyncStore.getPendingRunSyncRunId(pendingRun) !== input.syncRunId) {
      throw new HealthSyncConflictError(
        "Health sync batch belongs to a different run. Restart the sync run.",
      );
    }

    if (
      healthSyncStore.getPendingRunExpectedBatchIndex(pendingRun) !==
      input.batchIndex
    ) {
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

    return pendingRun;
  }
}

export const healthSyncService = new HealthSyncService();
export { HealthSyncConflictError };
