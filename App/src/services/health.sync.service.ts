import { Platform } from "react-native";
import { request } from "@/lib/net";
import {
  describeHealthError,
  requestHealthPermissions,
} from "@/lib/health/index";
import type {
  AppleHealthSyncState,
  AppleHealthUploadRecord,
  HealthConnectSyncState,
  HealthConnectUploadRecord,
  HealthSyncBatchRequest,
  HealthSyncBatchResponse,
  HealthSyncProgress,
  HealthSyncProvider,
  HealthSyncRunResult,
  HealthSyncState,
  HealthSyncStatusResponse,
} from "@/types/health.sync.types";

let healthkit: any = null;
let healthConnect: any = null;

try {
  healthkit = require("@kingstinct/react-native-healthkit");
} catch {}

try {
  healthConnect = require("react-native-health-connect");
} catch {}

const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL || "https://lifemeter.fit") + "/api/user/sync";

const FULL_HISTORY_START = "2000-01-01T00:00:00.000Z";
const HEALTH_CONNECT_RECORD_TYPES = [
  "SleepSession",
  "Weight",
  "Height",
  "HeartRate",
  "BloodPressure",
] as const;

type HealthConnectRecordType = (typeof HEALTH_CONNECT_RECORD_TYPES)[number];

type SyncOptions = {
  onProgress?: (progress: HealthSyncProgress) => void;
};

type PreparedSyncPayload<TRecord, TState extends HealthSyncState> = {
  records: TRecord[];
  nextSyncState: TState | null;
};

const emitProgress = (
  onProgress: SyncOptions["onProgress"],
  progress: HealthSyncProgress,
) => {
  onProgress?.(progress);
};

const chunkArray = <T>(items: T[], size: number): T[][] => {
  if (items.length === 0) return [[]];

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const toIsoString = (value: Date | string): string => {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const normalizeHealthConnectMetadata = (metadata: any) => {
  if (!metadata) return null;

  return {
    id: typeof metadata.id === "string" ? metadata.id : undefined,
    clientRecordId:
      typeof metadata.clientRecordId === "string"
        ? metadata.clientRecordId
        : undefined,
    lastModifiedTime:
      metadata.lastModifiedTime !== undefined && metadata.lastModifiedTime !== null
        ? toIsoString(metadata.lastModifiedTime)
        : undefined,
  };
};

const convertMassToGrams = (value: any): number => {
  if (typeof value?.inGrams === "number") return value.inGrams;

  if (typeof value?.value !== "number" || typeof value?.unit !== "string") {
    throw new Error("Unsupported Health Connect mass value.");
  }

  switch (value.unit) {
    case "grams":
      return value.value;
    case "kilograms":
      return value.value * 1000;
    case "milligrams":
      return value.value / 1000;
    case "micrograms":
      return value.value / 1_000_000;
    case "ounces":
      return value.value * 28.349523125;
    case "pounds":
      return value.value * 453.59237;
    default:
      throw new Error(`Unsupported Health Connect mass unit: ${value.unit}`);
  }
};

const convertLengthToCm = (value: any): number => {
  if (typeof value?.inMeters === "number") return value.inMeters * 100;

  if (typeof value?.value !== "number" || typeof value?.unit !== "string") {
    throw new Error("Unsupported Health Connect length value.");
  }

  switch (value.unit) {
    case "meters":
      return value.value * 100;
    case "kilometers":
      return value.value * 100_000;
    case "miles":
      return value.value * 160_934.4;
    case "inches":
      return value.value * 2.54;
    case "feet":
      return value.value * 30.48;
    default:
      throw new Error(`Unsupported Health Connect length unit: ${value.unit}`);
  }
};

const convertPressureToMmhg = (value: any): number => {
  if (typeof value?.inMillimetersOfMercury === "number") {
    return value.inMillimetersOfMercury;
  }

  if (
    typeof value?.value !== "number" ||
    value?.unit !== "millimetersOfMercury"
  ) {
    throw new Error("Unsupported Health Connect pressure value.");
  }

  return value.value;
};

const convertApplePressureToMmhg = (quantity: number, unit?: string) => {
  if (!unit || unit.toLowerCase() === "mmhg") return quantity;
  throw new Error(`Unsupported Apple Health blood pressure unit: ${unit}`);
};

const getProvider = (): HealthSyncProvider => {
  if (Platform.OS === "android") return "health-connect";
  if (Platform.OS === "ios") return "apple-health";
  throw new Error("Health sync is only supported on iOS and Android.");
};

const fetchSyncState = async (provider: HealthSyncProvider) => {
  return request<HealthSyncStatusResponse>(
    `${API_BASE_URL}?provider=${encodeURIComponent(provider)}`,
    {
      method: "GET",
      skipOfflineQueue: true,
    },
  );
};

const uploadBatch = async (body: HealthSyncBatchRequest) => {
  return request<HealthSyncBatchResponse>(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    skipOfflineQueue: true,
  });
};

const ensureHealthAccess = async () => {
  const permissionResult = await requestHealthPermissions();
  if (!permissionResult.ok) {
    throw new Error(describeHealthError(permissionResult.error));
  }
};

const ensureHealthConnectReady = async () => {
  if (!healthConnect) {
    throw new Error("Health Connect native module is not available.");
  }

  const initialized = await healthConnect.initialize();
  if (!initialized) {
    throw new Error("Failed to initialize Health Connect.");
  }
};

const readAllHealthConnectRecords = async <TRecord>(
  recordType: HealthConnectRecordType,
): Promise<TRecord[]> => {
  await ensureHealthConnectReady();

  const allRecords: TRecord[] = [];
  let pageToken: string | undefined;

  do {
    const response = await healthConnect.readRecords(recordType, {
      timeRangeFilter: {
        operator: "between",
        startTime: FULL_HISTORY_START,
        endTime: new Date().toISOString(),
      },
      pageSize: 1000,
      ...(pageToken ? { pageToken } : {}),
    });

    allRecords.push(...(response.records ?? []));
    pageToken = response.pageToken ?? undefined;
  } while (pageToken);

  return allRecords;
};

const mapHealthConnectRecord = (record: any): HealthConnectUploadRecord[] => {
  const metadata = normalizeHealthConnectMetadata(record.metadata);
  const sourceId =
    typeof record.metadata?.id === "string"
      ? record.metadata.id
      : typeof record.metadata?.clientRecordId === "string"
        ? record.metadata.clientRecordId
        : null;

  switch (record.recordType) {
    case "SleepSession":
      return [
        {
          kind: "sleep",
          sourceId,
          startTime: toIsoString(record.startTime),
          endTime: toIsoString(record.endTime),
          stages: Array.isArray(record.stages)
            ? record.stages.map((stage: any) => ({
                startTime: toIsoString(stage.startTime),
                endTime: toIsoString(stage.endTime),
                stage: stage.stage,
              }))
            : undefined,
          metadata,
        },
      ];

    case "Weight":
      return [
        {
          kind: "weight",
          sourceId,
          time: toIsoString(record.time),
          weightGrams: convertMassToGrams(record.weight),
          metadata,
        },
      ];

    case "Height":
      return [
        {
          kind: "height",
          sourceId,
          time: toIsoString(record.time),
          heightCm: convertLengthToCm(record.height),
          metadata,
        },
      ];

    case "HeartRate":
      return [
        {
          kind: "heartRate",
          sourceId,
          startTime: toIsoString(record.startTime),
          endTime: toIsoString(record.endTime),
          samples: (record.samples ?? []).map((sample: any) => ({
            time: toIsoString(sample.time),
            beatsPerMinute: sample.beatsPerMinute,
          })),
          metadata,
        },
      ];

    case "BloodPressure":
      return [
        {
          kind: "bloodPressure",
          sourceId,
          time: toIsoString(record.time),
          systolicMmhg: convertPressureToMmhg(record.systolic),
          diastolicMmhg: convertPressureToMmhg(record.diastolic),
          metadata,
        },
      ];

    default:
      return [];
  }
};

const bootstrapHealthConnect = async (
  onProgress?: SyncOptions["onProgress"],
): Promise<PreparedSyncPayload<HealthConnectUploadRecord, HealthConnectSyncState>> => {
  emitProgress(onProgress, {
    stage: "reading",
    message: "Reading all Health Connect records...",
  });

  const [sleepRecords, weightRecords, heightRecords, heartRateRecords, bloodPressureRecords] =
    await Promise.all([
      readAllHealthConnectRecords<any>("SleepSession"),
      readAllHealthConnectRecords<any>("Weight"),
      readAllHealthConnectRecords<any>("Height"),
      readAllHealthConnectRecords<any>("HeartRate"),
      readAllHealthConnectRecords<any>("BloodPressure"),
    ]);

  const records = [
    ...sleepRecords.flatMap((record) =>
      mapHealthConnectRecord({ ...record, recordType: "SleepSession" }),
    ),
    ...weightRecords.flatMap((record) =>
      mapHealthConnectRecord({ ...record, recordType: "Weight" }),
    ),
    ...heightRecords.flatMap((record) =>
      mapHealthConnectRecord({ ...record, recordType: "Height" }),
    ),
    ...heartRateRecords.flatMap((record) =>
      mapHealthConnectRecord({ ...record, recordType: "HeartRate" }),
    ),
    ...bloodPressureRecords.flatMap((record) =>
      mapHealthConnectRecord({ ...record, recordType: "BloodPressure" }),
    ),
  ];

  const changes = await healthConnect.getChanges({
    recordTypes: [...HEALTH_CONNECT_RECORD_TYPES],
  });

  return {
    records,
    nextSyncState: {
      changesToken: changes.nextChangesToken,
    },
  };
};

const prepareHealthConnectSync = async (
  currentSyncState: HealthSyncState | null,
  onProgress?: SyncOptions["onProgress"],
): Promise<PreparedSyncPayload<HealthConnectUploadRecord, HealthConnectSyncState>> => {
  await ensureHealthConnectReady();

  if (!currentSyncState || !("changesToken" in currentSyncState)) {
    return bootstrapHealthConnect(onProgress);
  }

  emitProgress(onProgress, {
    stage: "reading",
    message: "Reading changed Health Connect records...",
  });

  let changesToken = currentSyncState.changesToken;
  const records: HealthConnectUploadRecord[] = [];

  while (true) {
    const changes = await healthConnect.getChanges({ changesToken });

    if (changes.changesTokenExpired) {
      emitProgress(onProgress, {
        stage: "reading",
        message: "Health Connect history token expired. Rebuilding full sync snapshot...",
      });
      return bootstrapHealthConnect(onProgress);
    }

    records.push(
      ...((changes.upsertionChanges ?? []) as Array<{ record: any }>)
        .flatMap((change) => mapHealthConnectRecord(change.record)),
    );

    changesToken = changes.nextChangesToken;
    if (!changes.hasMore) break;
  }

  return {
    records,
    nextSyncState: {
      changesToken,
    },
  };
};

const mapAppleSleepSamples = (samples: any[]): AppleHealthUploadRecord[] => {
  return samples.map((sample) => ({
    kind: "sleep",
    uuid: sample.uuid,
    startDate: toIsoString(sample.startDate),
    endDate: toIsoString(sample.endDate),
    value: sample.value,
  }));
};

const mapAppleWeightSamples = (samples: any[]): AppleHealthUploadRecord[] => {
  return samples.map((sample) => ({
    kind: "weight",
    uuid: sample.uuid,
    startDate: toIsoString(sample.startDate),
    endDate: toIsoString(sample.endDate),
    weightGrams: sample.quantity,
  }));
};

const mapAppleHeightSamples = (samples: any[]): AppleHealthUploadRecord[] => {
  return samples.map((sample) => ({
    kind: "height",
    uuid: sample.uuid,
    startDate: toIsoString(sample.startDate),
    endDate: toIsoString(sample.endDate),
    heightCm: sample.quantity,
  }));
};

const mapAppleHeartRateSamples = (samples: any[]): AppleHealthUploadRecord[] => {
  return samples.map((sample) => ({
    kind: "heartRate",
    uuid: sample.uuid,
    startDate: toIsoString(sample.startDate),
    endDate: toIsoString(sample.endDate),
    bpm: sample.quantity,
  }));
};

const mapAppleBloodPressureSamples = (
  correlations: any[],
): AppleHealthUploadRecord[] => {
  return correlations.map((correlation) => {
    const systolic = (correlation.objects ?? []).find(
      (item: any) =>
        item.quantityType === "HKQuantityTypeIdentifierBloodPressureSystolic" ||
        item.sampleType?.identifier ===
          "HKQuantityTypeIdentifierBloodPressureSystolic",
    );
    const diastolic = (correlation.objects ?? []).find(
      (item: any) =>
        item.quantityType === "HKQuantityTypeIdentifierBloodPressureDiastolic" ||
        item.sampleType?.identifier ===
          "HKQuantityTypeIdentifierBloodPressureDiastolic",
    );

    if (!systolic || !diastolic) {
      throw new Error("Apple Health blood pressure correlation is incomplete.");
    }

    return {
      kind: "bloodPressure",
      uuid: correlation.uuid,
      startDate: toIsoString(correlation.startDate),
      endDate: toIsoString(correlation.endDate),
      systolicMmhg: convertApplePressureToMmhg(
        systolic.quantity,
        systolic.unit,
      ),
      diastolicMmhg: convertApplePressureToMmhg(
        diastolic.quantity,
        diastolic.unit,
      ),
    } satisfies AppleHealthUploadRecord;
  });
};

const prepareAppleHealthSync = async (
  currentSyncState: HealthSyncState | null,
  onProgress?: SyncOptions["onProgress"],
): Promise<PreparedSyncPayload<AppleHealthUploadRecord, AppleHealthSyncState>> => {
  if (!healthkit) {
    throw new Error("Apple Health native module is not available.");
  }

  emitProgress(onProgress, {
    stage: "reading",
    message: "Reading changed Apple Health records...",
  });

  const anchors =
    currentSyncState && "anchors" in currentSyncState
      ? currentSyncState.anchors
      : {};

  const [sleepResult, weightResult, heightResult, heartRateResult, bloodPressureResult] =
    await Promise.all([
      healthkit.queryCategorySamplesWithAnchor(
        "HKCategoryTypeIdentifierSleepAnalysis",
        {
          limit: 0,
          anchor: anchors.sleep ?? undefined,
        },
      ),
      healthkit.queryQuantitySamplesWithAnchor("HKQuantityTypeIdentifierBodyMass", {
        limit: 0,
        anchor: anchors.weight ?? undefined,
        unit: "g",
      }),
      healthkit.queryQuantitySamplesWithAnchor("HKQuantityTypeIdentifierHeight", {
        limit: 0,
        anchor: anchors.height ?? undefined,
        unit: "cm",
      }),
      healthkit.queryQuantitySamplesWithAnchor("HKQuantityTypeIdentifierHeartRate", {
        limit: 0,
        anchor: anchors.heartRate ?? undefined,
        unit: "count/min",
      }),
      healthkit.queryCorrelationSamplesWithAnchor(
        "HKCorrelationTypeIdentifierBloodPressure",
        {
          limit: 0,
          anchor: anchors.bloodPressure ?? undefined,
        },
      ),
    ]);

  const records = [
    ...mapAppleSleepSamples(sleepResult.samples ?? []),
    ...mapAppleWeightSamples(weightResult.samples ?? []),
    ...mapAppleHeightSamples(heightResult.samples ?? []),
    ...mapAppleHeartRateSamples(heartRateResult.samples ?? []),
    ...mapAppleBloodPressureSamples(bloodPressureResult.correlations ?? []),
  ];

  return {
    records,
    nextSyncState: {
      anchors: {
        sleep: sleepResult.newAnchor ?? anchors.sleep ?? null,
        weight: weightResult.newAnchor ?? anchors.weight ?? null,
        height: heightResult.newAnchor ?? anchors.height ?? null,
        heartRate: heartRateResult.newAnchor ?? anchors.heartRate ?? null,
        bloodPressure:
          bloodPressureResult.newAnchor ?? anchors.bloodPressure ?? null,
      },
    },
  };
};

const sync = async (options: SyncOptions = {}): Promise<HealthSyncRunResult> => {
  const provider = getProvider();
  await ensureHealthAccess();

  const status = await fetchSyncState(provider);
  const currentSyncState = status.syncState;
  const syncRunId = `${provider}:${Date.now()}`;
  const responses: HealthSyncBatchResponse[] = [];

  let totalUploadedRecords = 0;

  if (provider === "health-connect") {
    const preparedPayload = await prepareHealthConnectSync(
      currentSyncState,
      options.onProgress,
    );
    const batches = chunkArray(preparedPayload.records, 250);

    totalUploadedRecords = preparedPayload.records.length;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      emitProgress(options.onProgress, {
        stage: "uploading",
        message: `Uploading batch ${batchIndex + 1} of ${batches.length}...`,
        uploadedBatches: batchIndex,
        totalBatches: batches.length,
      });

      const batch = batches[batchIndex] ?? [];
      const body: HealthSyncBatchRequest = {
        provider,
        syncRunId,
        batchIndex,
        isFinalBatch: batchIndex === batches.length - 1,
        currentSyncState:
          currentSyncState && "changesToken" in currentSyncState
            ? currentSyncState
            : null,
        nextSyncState: preparedPayload.nextSyncState,
        records: batch,
      };

      responses.push(await uploadBatch(body));
    }
  } else {
    const preparedPayload = await prepareAppleHealthSync(
      currentSyncState,
      options.onProgress,
    );
    const batches = chunkArray(preparedPayload.records, 250);

    totalUploadedRecords = preparedPayload.records.length;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      emitProgress(options.onProgress, {
        stage: "uploading",
        message: `Uploading batch ${batchIndex + 1} of ${batches.length}...`,
        uploadedBatches: batchIndex,
        totalBatches: batches.length,
      });

      const batch = batches[batchIndex] ?? [];
      const body: HealthSyncBatchRequest = {
        provider,
        syncRunId,
        batchIndex,
        isFinalBatch: batchIndex === batches.length - 1,
        currentSyncState:
          currentSyncState && "anchors" in currentSyncState
            ? currentSyncState
            : null,
        nextSyncState: preparedPayload.nextSyncState,
        records: batch,
      };

      responses.push(await uploadBatch(body));
    }
  }

  emitProgress(options.onProgress, {
    stage: "done",
    message: "Health sync completed.",
    uploadedBatches: responses.length,
    totalBatches: responses.length,
  });

  return {
    provider,
    syncedAt: new Date().toISOString(),
    totalUploadedRecords,
    responses,
    committedSyncState:
      responses[responses.length - 1]?.committedSyncState ?? currentSyncState,
  };
};

export const healthSyncService = {
  sync,
};
