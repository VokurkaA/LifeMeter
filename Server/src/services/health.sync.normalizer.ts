import { createHash } from "node:crypto";
import type {
  AppleHealthUploadRecord,
  HealthConnectUploadRecord,
} from "@/schemas/user.sync.schema";
import type {
  HealthSyncProvider,
  HealthSyncSourceItemRow,
  HealthSyncSourceType,
} from "@/types/sync.types";

export interface SyncSourceDescriptor {
  provider: HealthSyncProvider;
  sourceType: HealthSyncSourceType;
  sourceItemId: string;
  rawPayload: unknown;
  checksum: string;
  sourceStartAt: string;
  sourceEndAt: string;
  sourceLastModifiedAt: string | null;
  usedSyntheticId: boolean;
}

export interface NormalizedSleepSession {
  sleepStart: string;
  sleepEnd: string;
}

export interface NormalizedWeightLog {
  measuredAt: string;
  weightGrams: number;
  bodyFatPercentage: number | null;
  leanTissuePercentage: number | null;
  waterPercentage: number | null;
  boneMassPercentage: number | null;
}

export interface NormalizedHeightLog {
  measuredAt: string;
  heightCm: number;
}

export interface NormalizedHeartRateLog {
  measuredAt: string;
  bpm: number;
}

export interface NormalizedBloodPressureLog {
  measuredAt: string;
  systolicMmhg: number;
  diastolicMmhg: number;
}

export interface NormalizedSourceMeasurement<T> {
  source: SyncSourceDescriptor;
  target: T;
}

export interface AppleSleepSourceSnapshot {
  source: SyncSourceDescriptor;
  record: Extract<AppleHealthUploadRecord, { kind: "sleep" }>;
  existingTargetRowId: string | null;
  ownsTarget: boolean;
}

export interface AppleSleepCluster {
  sleepStart: string;
  sleepEnd: string;
  sourceItemIds: string[];
}

const SLEEP_CLUSTER_GAP_MS = 30 * 60 * 1000;

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

export function checksumPayload(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function makeSyntheticSourceId(prefix: string, value: unknown): string {
  return `synthetic:${prefix}:${checksumPayload(value)}`;
}

function roundTo(value: number, digits: number): number {
  return Number(value.toFixed(digits));
}

function createSourceDescriptor(args: {
  provider: HealthSyncProvider;
  sourceType: HealthSyncSourceType;
  sourceItemId: string;
  rawPayload: unknown;
  sourceStartAt: string;
  sourceEndAt: string;
  sourceLastModifiedAt?: string | null;
  usedSyntheticId: boolean;
}): SyncSourceDescriptor {
  return {
    provider: args.provider,
    sourceType: args.sourceType,
    sourceItemId: args.sourceItemId,
    rawPayload: args.rawPayload,
    checksum: checksumPayload(args.rawPayload),
    sourceStartAt: args.sourceStartAt,
    sourceEndAt: args.sourceEndAt,
    sourceLastModifiedAt: args.sourceLastModifiedAt ?? null,
    usedSyntheticId: args.usedSyntheticId,
  };
}

function createHealthConnectSourceId(
  sourceType: HealthSyncSourceType,
  preferredId: string | null | undefined,
  fallbackValue: unknown,
) {
  if (preferredId) {
    return { sourceItemId: preferredId, usedSyntheticId: false };
  }

  return {
    sourceItemId: makeSyntheticSourceId(`health-connect:${sourceType}`, fallbackValue),
    usedSyntheticId: true,
  };
}

export function normalizeHealthConnectSleepRecord(
  record: Extract<HealthConnectUploadRecord, { kind: "sleep" }>,
): NormalizedSourceMeasurement<NormalizedSleepSession> {
  const { sourceItemId, usedSyntheticId } = createHealthConnectSourceId(
    "sleep",
    record.sourceId ?? record.metadata?.id ?? record.metadata?.clientRecordId,
    {
      startTime: record.startTime,
      endTime: record.endTime,
    },
  );

  return {
    source: createSourceDescriptor({
      provider: "health-connect",
      sourceType: "sleep",
      sourceItemId,
      rawPayload: record,
      sourceStartAt: record.startTime,
      sourceEndAt: record.endTime,
      sourceLastModifiedAt: record.metadata?.lastModifiedTime ?? null,
      usedSyntheticId,
    }),
    target: {
      sleepStart: record.startTime,
      sleepEnd: record.endTime,
    },
  };
}

export function normalizeHealthConnectWeightRecord(
  record: Extract<HealthConnectUploadRecord, { kind: "weight" }>,
): NormalizedSourceMeasurement<NormalizedWeightLog> {
  const { sourceItemId, usedSyntheticId } = createHealthConnectSourceId(
    "weight",
    record.sourceId ?? record.metadata?.id ?? record.metadata?.clientRecordId,
    {
      time: record.time,
      weightGrams: roundTo(record.weightGrams, 2),
    },
  );

  return {
    source: createSourceDescriptor({
      provider: "health-connect",
      sourceType: "weight",
      sourceItemId,
      rawPayload: record,
      sourceStartAt: record.time,
      sourceEndAt: record.time,
      sourceLastModifiedAt: record.metadata?.lastModifiedTime ?? null,
      usedSyntheticId,
    }),
    target: {
      measuredAt: record.time,
      weightGrams: roundTo(record.weightGrams, 2),
      bodyFatPercentage: null,
      leanTissuePercentage: null,
      waterPercentage: null,
      boneMassPercentage: null,
    },
  };
}

export function normalizeHealthConnectHeightRecord(
  record: Extract<HealthConnectUploadRecord, { kind: "height" }>,
): NormalizedSourceMeasurement<NormalizedHeightLog> {
  const { sourceItemId, usedSyntheticId } = createHealthConnectSourceId(
    "height",
    record.sourceId ?? record.metadata?.id ?? record.metadata?.clientRecordId,
    {
      time: record.time,
      heightCm: roundTo(record.heightCm, 2),
    },
  );

  return {
    source: createSourceDescriptor({
      provider: "health-connect",
      sourceType: "height",
      sourceItemId,
      rawPayload: record,
      sourceStartAt: record.time,
      sourceEndAt: record.time,
      sourceLastModifiedAt: record.metadata?.lastModifiedTime ?? null,
      usedSyntheticId,
    }),
    target: {
      measuredAt: record.time,
      heightCm: roundTo(record.heightCm, 2),
    },
  };
}

export function normalizeHealthConnectHeartRateRecord(
  record: Extract<HealthConnectUploadRecord, { kind: "heartRate" }>,
): Array<NormalizedSourceMeasurement<NormalizedHeartRateLog>> {
  const { sourceItemId: baseSourceItemId, usedSyntheticId } = createHealthConnectSourceId(
    "heart_rate",
    record.sourceId ?? record.metadata?.id ?? record.metadata?.clientRecordId,
    {
      startTime: record.startTime,
      endTime: record.endTime,
      samples: record.samples.map((sample) => sample.time),
    },
  );

  return record.samples.map((sample, index) => {
    const rawPayload = {
      ...record,
      sample,
      sampleIndex: index,
    };

    return {
      source: createSourceDescriptor({
        provider: "health-connect",
        sourceType: "heart_rate",
        sourceItemId: `${baseSourceItemId}:${sample.time}:${index}`,
        rawPayload,
        sourceStartAt: sample.time,
        sourceEndAt: sample.time,
        sourceLastModifiedAt: record.metadata?.lastModifiedTime ?? null,
        usedSyntheticId,
      }),
      target: {
        measuredAt: sample.time,
        bpm: Math.round(sample.beatsPerMinute),
      },
    };
  });
}

export function normalizeHealthConnectBloodPressureRecord(
  record: Extract<HealthConnectUploadRecord, { kind: "bloodPressure" }>,
): NormalizedSourceMeasurement<NormalizedBloodPressureLog> {
  const { sourceItemId, usedSyntheticId } = createHealthConnectSourceId(
    "blood_pressure",
    record.sourceId ?? record.metadata?.id ?? record.metadata?.clientRecordId,
    {
      time: record.time,
      systolicMmhg: Math.round(record.systolicMmhg),
      diastolicMmhg: Math.round(record.diastolicMmhg),
    },
  );

  return {
    source: createSourceDescriptor({
      provider: "health-connect",
      sourceType: "blood_pressure",
      sourceItemId,
      rawPayload: record,
      sourceStartAt: record.time,
      sourceEndAt: record.time,
      sourceLastModifiedAt: record.metadata?.lastModifiedTime ?? null,
      usedSyntheticId,
    }),
    target: {
      measuredAt: record.time,
      systolicMmhg: Math.round(record.systolicMmhg),
      diastolicMmhg: Math.round(record.diastolicMmhg),
    },
  };
}

export function normalizeAppleHealthSleepRecord(
  record: Extract<AppleHealthUploadRecord, { kind: "sleep" }>,
): NormalizedSourceMeasurement<Extract<AppleHealthUploadRecord, { kind: "sleep" }>> {
  return {
    source: createSourceDescriptor({
      provider: "apple-health",
      sourceType: "sleep",
      sourceItemId: record.uuid,
      rawPayload: record,
      sourceStartAt: record.startDate,
      sourceEndAt: record.endDate,
      usedSyntheticId: false,
    }),
    target: record,
  };
}

export function normalizeAppleHealthWeightRecord(
  record: Extract<AppleHealthUploadRecord, { kind: "weight" }>,
): NormalizedSourceMeasurement<NormalizedWeightLog> {
  return {
    source: createSourceDescriptor({
      provider: "apple-health",
      sourceType: "weight",
      sourceItemId: record.uuid,
      rawPayload: record,
      sourceStartAt: record.startDate,
      sourceEndAt: record.endDate,
      usedSyntheticId: false,
    }),
    target: {
      measuredAt: record.startDate,
      weightGrams: roundTo(record.weightGrams, 2),
      bodyFatPercentage: null,
      leanTissuePercentage: null,
      waterPercentage: null,
      boneMassPercentage: null,
    },
  };
}

export function normalizeAppleHealthHeightRecord(
  record: Extract<AppleHealthUploadRecord, { kind: "height" }>,
): NormalizedSourceMeasurement<NormalizedHeightLog> {
  return {
    source: createSourceDescriptor({
      provider: "apple-health",
      sourceType: "height",
      sourceItemId: record.uuid,
      rawPayload: record,
      sourceStartAt: record.startDate,
      sourceEndAt: record.endDate,
      usedSyntheticId: false,
    }),
    target: {
      measuredAt: record.startDate,
      heightCm: roundTo(record.heightCm, 2),
    },
  };
}

export function normalizeAppleHealthHeartRateRecord(
  record: Extract<AppleHealthUploadRecord, { kind: "heartRate" }>,
): NormalizedSourceMeasurement<NormalizedHeartRateLog> {
  return {
    source: createSourceDescriptor({
      provider: "apple-health",
      sourceType: "heart_rate",
      sourceItemId: record.uuid,
      rawPayload: record,
      sourceStartAt: record.startDate,
      sourceEndAt: record.endDate,
      usedSyntheticId: false,
    }),
    target: {
      measuredAt: record.startDate,
      bpm: Math.round(record.bpm),
    },
  };
}

export function normalizeAppleHealthBloodPressureRecord(
  record: Extract<AppleHealthUploadRecord, { kind: "bloodPressure" }>,
): NormalizedSourceMeasurement<NormalizedBloodPressureLog> {
  return {
    source: createSourceDescriptor({
      provider: "apple-health",
      sourceType: "blood_pressure",
      sourceItemId: record.uuid,
      rawPayload: record,
      sourceStartAt: record.startDate,
      sourceEndAt: record.endDate,
      usedSyntheticId: false,
    }),
    target: {
      measuredAt: record.startDate,
      systolicMmhg: Math.round(record.systolicMmhg),
      diastolicMmhg: Math.round(record.diastolicMmhg),
    },
  };
}

export function appleSleepSnapshotFromSourceItem(
  row: HealthSyncSourceItemRow,
): AppleSleepSourceSnapshot {
  const record = row.raw_payload as Extract<AppleHealthUploadRecord, { kind: "sleep" }>;

  return {
    source: {
      provider: "apple-health",
      sourceType: "sleep",
      sourceItemId: row.source_item_id,
      rawPayload: row.raw_payload,
      checksum: row.checksum,
      sourceStartAt: record.startDate,
      sourceEndAt: record.endDate,
      sourceLastModifiedAt:
        typeof row.source_last_modified_at === "string"
          ? row.source_last_modified_at
          : row.source_last_modified_at?.toISOString() ?? null,
      usedSyntheticId: false,
    },
    record,
    existingTargetRowId: row.target_row_id,
    ownsTarget: row.owns_target,
  };
}

export function mapClientSourceTypeToSyncSourceType(
  sourceType: "sleep" | "weight" | "height" | "heartRate" | "bloodPressure",
): HealthSyncSourceType {
  switch (sourceType) {
    case "sleep":
      return "sleep";
    case "weight":
      return "weight";
    case "height":
      return "height";
    case "heartRate":
      return "heart_rate";
    case "bloodPressure":
      return "blood_pressure";
  }
}

export function clusterAppleSleepSamples(
  snapshots: AppleSleepSourceSnapshot[],
): AppleSleepCluster[] {
  const sorted = [...snapshots].sort((a, b) => {
    const byStart =
      new Date(a.record.startDate).getTime() - new Date(b.record.startDate).getTime();

    if (byStart !== 0) return byStart;

    return (
      new Date(a.record.endDate).getTime() - new Date(b.record.endDate).getTime()
    );
  });

  const clusters: AppleSleepCluster[] = [];

  for (const snapshot of sorted) {
    const sampleStart = new Date(snapshot.record.startDate).getTime();
    const sampleEnd = new Date(snapshot.record.endDate).getTime();

    const current = clusters[clusters.length - 1];
    if (!current) {
      clusters.push({
        sleepStart: snapshot.record.startDate,
        sleepEnd: snapshot.record.endDate,
        sourceItemIds: [snapshot.source.sourceItemId],
      });
      continue;
    }

    const currentEnd = new Date(current.sleepEnd).getTime();
    if (sampleStart <= currentEnd + SLEEP_CLUSTER_GAP_MS) {
      if (sampleStart < new Date(current.sleepStart).getTime()) {
        current.sleepStart = snapshot.record.startDate;
      }
      if (sampleEnd > currentEnd) {
        current.sleepEnd = snapshot.record.endDate;
      }
      current.sourceItemIds.push(snapshot.source.sourceItemId);
      continue;
    }

    clusters.push({
      sleepStart: snapshot.record.startDate,
      sleepEnd: snapshot.record.endDate,
      sourceItemIds: [snapshot.source.sourceItemId],
    });
  }

  return clusters;
}
