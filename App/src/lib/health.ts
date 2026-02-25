import { Platform, Linking } from "react-native";
import HealthKit from "@kingstinct/react-native-healthkit";
import {
  initialize,
  requestPermission,
  getGrantedPermissions,
  readRecords,
  SdkAvailabilityStatus,
  openHealthConnectSettings,
} from "react-native-health-connect";
import {
  HealthConnectPermission,
  HealthHeightSample,
  HealthSleepSession,
  HealthWeightSample,
} from "@/types/health.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const HEALTH_CONNECT_PERMISSIONS: HealthConnectPermission[] = [
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "SleepSession" },
  { accessType: "read", recordType: "Weight" },
  { accessType: "read", recordType: "Height" },
  { accessType: "read", recordType: "ActiveCaloriesBurned" },
];

const HEALTHKIT_READ_PERMISSIONS = [
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierBodyMass",
  "HKQuantityTypeIdentifierBodyFatPercentage",
  "HKQuantityTypeIdentifierHeight",
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKCategoryTypeIdentifierSleepAnalysis",
] as const;

const HEALTHKIT_WRITE_PERMISSIONS = [
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierBodyMass",
  "HKQuantityTypeIdentifierHeight",
  "HKQuantityTypeIdentifierActiveEnergyBurned",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasPermission(
  grantedPermissions: HealthConnectPermission[],
  required: HealthConnectPermission,
) {
  return grantedPermissions.some(
    (p) =>
      p.accessType === required.accessType &&
      p.recordType === required.recordType,
  );
}

async function getHealthConnectSdkStatus() {
  try {
    const { getSdkStatus } = await import("react-native-health-connect");
    return await getSdkStatus();
  } catch {
    return SdkAvailabilityStatus.SDK_UNAVAILABLE;
  }
}

// ─── Initialization ───────────────────────────────────────────────────────────

export async function initializeHealth(): Promise<boolean> {
  return Platform.OS === "ios"
    ? initializeHealthKit()
    : initializeHealthConnect();
}

async function initializeHealthKit(): Promise<boolean> {
  try {
    if (!(await HealthKit.isHealthDataAvailable())) return false;

    await HealthKit.requestAuthorization({
      toRead: [...HEALTHKIT_READ_PERMISSIONS],
      toShare: [],
    });

    return true;
  } catch (error) {
    console.error("HealthKit initialization error:", error);
    return false;
  }
}

async function initializeHealthConnect(): Promise<boolean> {
  try {
    const status = await getHealthConnectSdkStatus();

    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
      console.log("Health Connect unavailable. Status:", status);
      return false;
    }

    if (!(await initialize())) {
      console.log("Health Connect initialization failed");
      return false;
    }

    try {
      const granted = (await requestPermission(
        HEALTH_CONNECT_PERMISSIONS as any,
      )) as HealthConnectPermission[];

      return hasPermission(granted, {
        accessType: "read",
        recordType: "Steps",
      });
    } catch (error: any) {
      console.error("Health Connect permission request failed:", error);
      return false;
    }
  } catch (error) {
    console.error("Health Connect error:", error);
    return false;
  }
}

// ─── Steps ────────────────────────────────────────────────────────────────────

export async function getTodaySteps(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const now = new Date();

  if (Platform.OS === "ios") {
    try {
      const samples = await HealthKit.queryQuantitySamples(
        "HKQuantityTypeIdentifierStepCount",
        { limit: 0, filter: { date: { startDate: start, endDate: now } } },
      );
      return samples.reduce(
        (total: number, s: any) => total + (s.quantity ?? 0),
        0,
      );
    } catch (error) {
      console.error("HealthKit steps error:", error);
      return 0;
    }
  } else {
    try {
      const granted =
        (await getGrantedPermissions()) as HealthConnectPermission[];
      if (!hasPermission(granted, { accessType: "read", recordType: "Steps" }))
        return 0;

      const { records } = await readRecords("Steps", {
        timeRangeFilter: {
          operator: "between",
          startTime: start.toISOString(),
          endTime: now.toISOString(),
        },
      });

      return records.reduce(
        (total: number, r: any) => total + (r.count ?? 0),
        0,
      );
    } catch (error) {
      console.error("Health Connect steps error:", error);
      return 0;
    }
  }
}

// ─── Sleep ────────────────────────────────────────────────────────────────────

export async function getRecentSleepSessions(
  days = 7,
): Promise<HealthSleepSession[]> {
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  const now = new Date();

  if (Platform.OS === "ios") {
    try {
      const samples = await HealthKit.queryQuantitySamples(
        "HKCategoryTypeIdentifierSleepAnalysis" as any,
        { limit: 0, filter: { date: { startDate: start, endDate: now } } },
      );

      return samples
        .filter((s: any) => s.value === 1) // 1 = asleep
        .map((s: any) => ({
          startAt: new Date(s.startDate),
          endAt: new Date(s.endDate),
        }));
    } catch (error) {
      console.error("HealthKit sleep error:", error);
      return [];
    }
  } else {
    try {
      const granted =
        (await getGrantedPermissions()) as HealthConnectPermission[];
      if (
        !hasPermission(granted, {
          accessType: "read",
          recordType: "SleepSession",
        })
      )
        return [];

      const { records } = await readRecords("SleepSession", {
        timeRangeFilter: {
          operator: "between",
          startTime: start.toISOString(),
          endTime: now.toISOString(),
        },
      });

      return records.map((r: any) => ({
        startAt: new Date(r.startTime),
        endAt: new Date(r.endTime),
      }));
    } catch (error) {
      console.error("Health Connect sleep error:", error);
      return [];
    }
  }
}

// ─── Weight ───────────────────────────────────────────────────────────────────

export async function getLatestWeight(): Promise<HealthWeightSample | null> {
  if (Platform.OS === "ios") {
    try {
      const samples = await HealthKit.queryQuantitySamples(
        "HKQuantityTypeIdentifierBodyMass",
        { limit: 1 },
      );

      if (!samples.length) return null;
      const sample = samples[0];

      // Try to get body fat recorded around the same time (±1 day)
      const sampleDate = new Date(sample.startDate);
      const dayBefore = new Date(sampleDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const dayAfter = new Date(sampleDate);
      dayAfter.setDate(dayAfter.getDate() + 1);

      let bodyFatPercentage: number | undefined;
      try {
        const fatSamples = await HealthKit.queryQuantitySamples(
          "HKQuantityTypeIdentifierBodyFatPercentage" as any,
          {
            limit: 1,
            filter: { date: { startDate: dayBefore, endDate: dayAfter } },
          },
        );
        if (fatSamples.length) {
          bodyFatPercentage = (fatSamples[0] as any).quantity * 100;
        }
      } catch {
        // body fat is optional, ignore errors
      }

      return {
        weightGrams: sample.quantity * 1000, // HealthKit returns kg
        bodyFatPercentage,
        recordedAt: new Date(sample.startDate),
      };
    } catch (error) {
      console.error("HealthKit weight error:", error);
      return null;
    }
  } else {
    try {
      const granted =
        (await getGrantedPermissions()) as HealthConnectPermission[];
      if (!hasPermission(granted, { accessType: "read", recordType: "Weight" }))
        return null;

      const now = new Date();
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const { records } = await readRecords("Weight", {
        timeRangeFilter: {
          operator: "between",
          startTime: monthAgo.toISOString(),
          endTime: now.toISOString(),
        },
      });

      if (!records.length) return null;
      const latest = records[records.length - 1] as any;

      return {
        weightGrams: latest.weight.inKilograms * 1000,
        recordedAt: new Date(latest.time),
      };
    } catch (error) {
      console.error("Health Connect weight error:", error);
      return null;
    }
  }
}

// ─── Height ───────────────────────────────────────────────────────────────────

export async function getLatestHeight(): Promise<HealthHeightSample | null> {
  if (Platform.OS === "ios") {
    try {
      const samples = await HealthKit.queryQuantitySamples(
        "HKQuantityTypeIdentifierHeight",
        { limit: 1 },
      );

      if (!samples.length) return null;
      const sample = samples[0];

      return {
        heightCm: sample.quantity * 100, // HealthKit returns meters
        recordedAt: new Date(sample.startDate),
      };
    } catch (error) {
      console.error("HealthKit height error:", error);
      return null;
    }
  } else {
    try {
      const granted =
        (await getGrantedPermissions()) as HealthConnectPermission[];
      if (!hasPermission(granted, { accessType: "read", recordType: "Height" }))
        return null;

      const now = new Date();
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);

      const { records } = await readRecords("Height", {
        timeRangeFilter: {
          operator: "between",
          startTime: yearAgo.toISOString(),
          endTime: now.toISOString(),
        },
      });

      if (!records.length) return null;
      const latest = records[records.length - 1] as any;

      return {
        heightCm: latest.height.inMeters * 100,
        recordedAt: new Date(latest.time),
      };
    } catch (error) {
      console.error("Health Connect height error:", error);
      return null;
    }
  }
}

// ─── Active Calories ──────────────────────────────────────────────────────────

export async function getTodayActiveCalories(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const now = new Date();

  if (Platform.OS === "ios") {
    try {
      const samples = await HealthKit.queryQuantitySamples(
        "HKQuantityTypeIdentifierActiveEnergyBurned",
        { limit: 0, filter: { date: { startDate: start, endDate: now } } },
      );
      return samples.reduce(
        (total: number, s: any) => total + (s.quantity ?? 0),
        0,
      );
    } catch (error) {
      console.error("HealthKit active calories error:", error);
      return 0;
    }
  } else {
    try {
      const granted =
        (await getGrantedPermissions()) as HealthConnectPermission[];
      if (
        !hasPermission(granted, {
          accessType: "read",
          recordType: "ActiveCaloriesBurned",
        })
      )
        return 0;

      const { records } = await readRecords("ActiveCaloriesBurned", {
        timeRangeFilter: {
          operator: "between",
          startTime: start.toISOString(),
          endTime: now.toISOString(),
        },
      });

      return records.reduce(
        (total: number, r: any) => total + (r.energy?.inKilocalories ?? 0),
        0,
      );
    } catch (error) {
      console.error("Health Connect active calories error:", error);
      return 0;
    }
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function openHealthSettings() {
  if (Platform.OS === "ios") {
    await Linking.openURL("x-apple-health://");
  } else {
    openHealthConnectSettings();
  }
}
