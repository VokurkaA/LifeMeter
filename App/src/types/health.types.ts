export type HealthConnectPermission = {
  accessType: "read" | "write";
  recordType: string;
};

export type HealthSleepSession = {
  startAt: Date;
  endAt: Date;
};

export type HealthWeightSample = {
  weightGrams: number;
  bodyFatPercentage?: number; // iOS only
  recordedAt: Date;
};

export type HealthHeightSample = {
  heightCm: number;
  recordedAt: Date;
};