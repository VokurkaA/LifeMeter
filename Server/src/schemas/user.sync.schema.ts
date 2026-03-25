import { z } from "@hono/zod-openapi";

export const syncProviderSchema = z
  .enum(["health-connect", "apple-health"])
  .openapi({ example: "health-connect" });

export const healthConnectSyncStateSchema = z
  .object({
    changesToken: z.string().min(1).openapi({ example: "hc_token" }),
  })
  .openapi("HealthConnectSyncState");

export const appleHealthAnchorsSchema = z
  .object({
    sleep: z.string().nullable().optional().openapi({ example: "sleep_anchor" }),
    weight: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "weight_anchor" }),
    height: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "height_anchor" }),
    heartRate: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "heart_rate_anchor" }),
    bloodPressure: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "blood_pressure_anchor" }),
  })
  .openapi("AppleHealthAnchors");

export const appleHealthSyncStateSchema = z
  .object({
    anchors: appleHealthAnchorsSchema,
  })
  .openapi("AppleHealthSyncState");

export const syncStateSchema = z
  .union([healthConnectSyncStateSchema, appleHealthSyncStateSchema])
  .openapi("HealthSyncState");

const isoDateTimeSchema = z.string().datetime();

const healthConnectMetadataSchema = z
  .object({
    id: z.string().optional(),
    clientRecordId: z.string().optional(),
    lastModifiedTime: isoDateTimeSchema.optional(),
  })
  .catchall(z.unknown());

const healthConnectSleepRecordSchema = z.object({
  kind: z.literal("sleep"),
  sourceId: z.string().nullable().optional(),
  startTime: isoDateTimeSchema,
  endTime: isoDateTimeSchema,
  stages: z
    .array(
      z.object({
        startTime: isoDateTimeSchema,
        endTime: isoDateTimeSchema,
        stage: z.number().int(),
      }),
    )
    .optional(),
  metadata: healthConnectMetadataSchema.nullable().optional(),
});

const healthConnectWeightRecordSchema = z.object({
  kind: z.literal("weight"),
  sourceId: z.string().nullable().optional(),
  time: isoDateTimeSchema,
  weightGrams: z.number().positive(),
  metadata: healthConnectMetadataSchema.nullable().optional(),
});

const healthConnectHeightRecordSchema = z.object({
  kind: z.literal("height"),
  sourceId: z.string().nullable().optional(),
  time: isoDateTimeSchema,
  heightCm: z.number().positive(),
  metadata: healthConnectMetadataSchema.nullable().optional(),
});

const healthConnectHeartRateRecordSchema = z.object({
  kind: z.literal("heartRate"),
  sourceId: z.string().nullable().optional(),
  startTime: isoDateTimeSchema,
  endTime: isoDateTimeSchema,
  samples: z
    .array(
      z.object({
        time: isoDateTimeSchema,
        beatsPerMinute: z.number().positive(),
      }),
    )
    .min(1),
  metadata: healthConnectMetadataSchema.nullable().optional(),
});

const healthConnectBloodPressureRecordSchema = z.object({
  kind: z.literal("bloodPressure"),
  sourceId: z.string().nullable().optional(),
  time: isoDateTimeSchema,
  systolicMmhg: z.number().positive(),
  diastolicMmhg: z.number().positive(),
  metadata: healthConnectMetadataSchema.nullable().optional(),
});

export const healthConnectRecordSchema = z.discriminatedUnion("kind", [
  healthConnectSleepRecordSchema,
  healthConnectWeightRecordSchema,
  healthConnectHeightRecordSchema,
  healthConnectHeartRateRecordSchema,
  healthConnectBloodPressureRecordSchema,
]);

const appleHealthSleepRecordSchema = z.object({
  kind: z.literal("sleep"),
  uuid: z.string().min(1),
  startDate: isoDateTimeSchema,
  endDate: isoDateTimeSchema,
  value: z.number().int(),
});

const appleHealthWeightRecordSchema = z.object({
  kind: z.literal("weight"),
  uuid: z.string().min(1),
  startDate: isoDateTimeSchema,
  endDate: isoDateTimeSchema,
  weightGrams: z.number().positive(),
});

const appleHealthHeightRecordSchema = z.object({
  kind: z.literal("height"),
  uuid: z.string().min(1),
  startDate: isoDateTimeSchema,
  endDate: isoDateTimeSchema,
  heightCm: z.number().positive(),
});

const appleHealthHeartRateRecordSchema = z.object({
  kind: z.literal("heartRate"),
  uuid: z.string().min(1),
  startDate: isoDateTimeSchema,
  endDate: isoDateTimeSchema,
  bpm: z.number().positive(),
});

const appleHealthBloodPressureRecordSchema = z.object({
  kind: z.literal("bloodPressure"),
  uuid: z.string().min(1),
  startDate: isoDateTimeSchema,
  endDate: isoDateTimeSchema,
  systolicMmhg: z.number().positive(),
  diastolicMmhg: z.number().positive(),
});

export const appleHealthRecordSchema = z.discriminatedUnion("kind", [
  appleHealthSleepRecordSchema,
  appleHealthWeightRecordSchema,
  appleHealthHeightRecordSchema,
  appleHealthHeartRateRecordSchema,
  appleHealthBloodPressureRecordSchema,
]);

const syncBatchBaseSchema = z.object({
  syncRunId: z.string().min(1).openapi({ example: "run_2026-03-25T12:00:00Z" }),
  batchIndex: z.number().int().min(0).openapi({ example: 0 }),
  isFinalBatch: z.boolean().openapi({ example: true }),
});

export const healthConnectSyncBatchRequestSchema = syncBatchBaseSchema.extend({
  provider: z.literal("health-connect"),
  currentSyncState: healthConnectSyncStateSchema.nullable(),
  nextSyncState: healthConnectSyncStateSchema.nullable(),
  records: z.array(healthConnectRecordSchema).max(250),
});

export const appleHealthSyncBatchRequestSchema = syncBatchBaseSchema.extend({
  provider: z.literal("apple-health"),
  currentSyncState: appleHealthSyncStateSchema.nullable(),
  nextSyncState: appleHealthSyncStateSchema.nullable(),
  records: z.array(appleHealthRecordSchema).max(250),
});

export const healthSyncBatchRequestSchema = z.discriminatedUnion("provider", [
  healthConnectSyncBatchRequestSchema,
  appleHealthSyncBatchRequestSchema,
]);

export const healthSyncStatusQuerySchema = z.object({
  provider: syncProviderSchema,
});

export const healthSyncStatusResponseSchema = z
  .object({
    provider: syncProviderSchema,
    syncState: syncStateSchema.nullable(),
    lastSuccessAt: isoDateTimeSchema.nullable(),
  })
  .openapi("HealthSyncStatusResponse");

export const healthSyncBatchResponseSchema = z
  .object({
    inserted: z.number().int().nonnegative(),
    updated: z.number().int().nonnegative(),
    matchedExisting: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    warnings: z.array(z.string()),
    committedSyncState: syncStateSchema.nullable(),
  })
  .openapi("HealthSyncBatchResponse");

export type HealthSyncState = z.infer<typeof syncStateSchema>;
export type HealthConnectSyncState = z.infer<typeof healthConnectSyncStateSchema>;
export type AppleHealthSyncState = z.infer<typeof appleHealthSyncStateSchema>;
export type HealthConnectUploadRecord = z.infer<typeof healthConnectRecordSchema>;
export type AppleHealthUploadRecord = z.infer<typeof appleHealthRecordSchema>;
export type HealthConnectSyncBatchRequest = z.infer<
  typeof healthConnectSyncBatchRequestSchema
>;
export type AppleHealthSyncBatchRequest = z.infer<
  typeof appleHealthSyncBatchRequestSchema
>;
export type HealthSyncBatchRequest = z.infer<typeof healthSyncBatchRequestSchema>;
