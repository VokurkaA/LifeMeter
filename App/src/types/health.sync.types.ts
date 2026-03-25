export type HealthSyncProvider = "health-connect" | "apple-health";

export type HealthConnectSyncState = {
  changesToken: string;
};

export type AppleHealthSyncState = {
  anchors: {
    sleep?: string | null;
    weight?: string | null;
    height?: string | null;
    heartRate?: string | null;
    bloodPressure?: string | null;
  };
};

export type HealthSyncState = HealthConnectSyncState | AppleHealthSyncState;

type HealthConnectMetadata = {
  id?: string;
  clientRecordId?: string;
  lastModifiedTime?: string;
};

export type HealthConnectUploadRecord =
  | {
      kind: "sleep";
      sourceId?: string | null;
      startTime: string;
      endTime: string;
      stages?:
        | Array<{
            startTime: string;
            endTime: string;
            stage: number;
          }>
        | undefined;
      metadata?: HealthConnectMetadata | null;
    }
  | {
      kind: "weight";
      sourceId?: string | null;
      time: string;
      weightGrams: number;
      metadata?: HealthConnectMetadata | null;
    }
  | {
      kind: "height";
      sourceId?: string | null;
      time: string;
      heightCm: number;
      metadata?: HealthConnectMetadata | null;
    }
  | {
      kind: "heartRate";
      sourceId?: string | null;
      startTime: string;
      endTime: string;
      samples: Array<{
        time: string;
        beatsPerMinute: number;
      }>;
      metadata?: HealthConnectMetadata | null;
    }
  | {
      kind: "bloodPressure";
      sourceId?: string | null;
      time: string;
      systolicMmhg: number;
      diastolicMmhg: number;
      metadata?: HealthConnectMetadata | null;
    };

export type AppleHealthUploadRecord =
  | {
      kind: "sleep";
      uuid: string;
      startDate: string;
      endDate: string;
      value: number;
    }
  | {
      kind: "weight";
      uuid: string;
      startDate: string;
      endDate: string;
      weightGrams: number;
    }
  | {
      kind: "height";
      uuid: string;
      startDate: string;
      endDate: string;
      heightCm: number;
    }
  | {
      kind: "heartRate";
      uuid: string;
      startDate: string;
      endDate: string;
      bpm: number;
    }
  | {
      kind: "bloodPressure";
      uuid: string;
      startDate: string;
      endDate: string;
      systolicMmhg: number;
      diastolicMmhg: number;
    };

export type HealthSyncBatchRequest =
  | {
      provider: "health-connect";
      syncRunId: string;
      batchIndex: number;
      isFinalBatch: boolean;
      currentSyncState: HealthConnectSyncState | null;
      nextSyncState: HealthConnectSyncState | null;
      records: HealthConnectUploadRecord[];
    }
  | {
      provider: "apple-health";
      syncRunId: string;
      batchIndex: number;
      isFinalBatch: boolean;
      currentSyncState: AppleHealthSyncState | null;
      nextSyncState: AppleHealthSyncState | null;
      records: AppleHealthUploadRecord[];
    };

export type HealthSyncStatusResponse = {
  provider: HealthSyncProvider;
  syncState: HealthSyncState | null;
  lastSuccessAt: string | null;
};

export type HealthSyncBatchResponse = {
  inserted: number;
  updated: number;
  matchedExisting: number;
  skipped: number;
  warnings: string[];
  committedSyncState: HealthSyncState | null;
};

export type HealthSyncProgress = {
  stage: "reading" | "uploading" | "done";
  message: string;
  uploadedBatches?: number;
  totalBatches?: number;
};

export type HealthSyncRunResult = {
  provider: HealthSyncProvider;
  syncedAt: string;
  totalUploadedRecords: number;
  responses: HealthSyncBatchResponse[];
  committedSyncState: HealthSyncState | null;
};
