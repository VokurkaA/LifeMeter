import { Platform, Linking } from "react-native";
import { ok, err, type Result } from "./types";
import { catchHealthError } from "./utils";

let healthkit: any = null;
let healthConnect: any = null;

try {
  healthkit = require("@kingstinct/react-native-healthkit");
} catch {}
try {
  healthConnect = require("react-native-health-connect");
} catch {}

export let permissionsRequested = false;

const IOS_SYNC_READ_TYPES = [
  "HKCategoryTypeIdentifierSleepAnalysis",
  "HKQuantityTypeIdentifierBodyMass",
  "HKQuantityTypeIdentifierHeight",
  "HKQuantityTypeIdentifierHeartRate",
  "HKCorrelationTypeIdentifierBloodPressure",
  "HKQuantityTypeIdentifierBloodPressureSystolic",
  "HKQuantityTypeIdentifierBloodPressureDiastolic",
] as const;

const ANDROID_SYNC_REQUIRED = [
  { accessType: "read", recordType: "SleepSession" },
  { accessType: "read", recordType: "Weight" },
  { accessType: "read", recordType: "Height" },
  { accessType: "read", recordType: "HeartRate" },
  { accessType: "read", recordType: "BloodPressure" },
] as const;

export async function isHealthAvailable(): Promise<boolean> {
  if (Platform.OS === "ios") {
    if (!healthkit) return false;
    try {
      return await healthkit.isHealthDataAvailable();
    } catch {
      return false;
    }
  }
  if (Platform.OS === "android") {
    if (!healthConnect) return false;
    try {
      return !!(await healthConnect.initialize());
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Opens the platform health dashboard:
 *   iOS     → Apple Health app  (x-apple-health://)
 *   Android → Health Connect settings screen
 *
 * iOS requires LSApplicationQueriesSchemes → x-apple-health in Info.plist.
 */
export async function openHealthDashboard(): Promise<Result<void>> {
  if (Platform.OS === "ios") {
    const url = "x-apple-health://";
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) return err({ kind: "HEALTH_NOT_AVAILABLE" });
      await Linking.openURL(url);
      return ok(undefined);
    } catch (e) {
      return err({
        kind: "SDK_ERROR",
        message: (e as Error)?.message ?? String(e),
        raw: e,
      });
    }
  }

  if (Platform.OS === "android") {
    try {
      await Linking.sendIntent(
        "androidx.health.ACTION_HEALTH_CONNECT_SETTINGS",
      );
      return ok(undefined);
    } catch {
      return err({ kind: "HEALTH_CONNECT_NOT_INSTALLED" });
    }
  }

  return err({ kind: "PLATFORM_NOT_SUPPORTED" });
}

async function initAndroid(): Promise<Result<void>> {
  if (!healthConnect) return err({ kind: "HEALTH_CONNECT_NOT_INSTALLED" });
  try {
    const initialized = await healthConnect.initialize();
    if (!initialized)
      return err({
        kind: "HEALTH_CONNECT_INIT_FAILED",
        reason: "initialize() returned false",
      });
    return ok(undefined);
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? "";
    if (msg.includes("not installed") || msg.includes("unavailable"))
      return err({ kind: "HEALTH_CONNECT_NOT_INSTALLED" });
    return err({ kind: "HEALTH_CONNECT_INIT_FAILED", reason: msg });
  }
}

export async function requestHealthPermissions(): Promise<Result<void>> {
  if (Platform.OS !== "ios" && Platform.OS !== "android")
    return err({ kind: "PLATFORM_NOT_SUPPORTED" });

  if (Platform.OS === "ios") {
    if (!healthkit)
      return err({
        kind: "MODULE_NOT_AVAILABLE",
        module: "@kingstinct/react-native-healthkit",
      });
    try {
      await healthkit.requestAuthorization({
        toRead: [
          "HKQuantityTypeIdentifierStepCount",
          "HKCategoryTypeIdentifierSleepAnalysis",
          "HKQuantityTypeIdentifierBodyMass",
          "HKQuantityTypeIdentifierHeight",
          "HKQuantityTypeIdentifierActiveEnergyBurned",
          "HKQuantityTypeIdentifierHeartRate",
          "HKCorrelationTypeIdentifierBloodPressure",
          "HKQuantityTypeIdentifierBloodPressureSystolic",
          "HKQuantityTypeIdentifierBloodPressureDiastolic",
        ],
      });
      permissionsRequested = true;
      return ok(undefined);
    } catch (e) {
      return catchHealthError(e);
    }
  }

  // Android
  const initResult = await initAndroid();
  if (!initResult.ok) return initResult;

  const required = [
    { accessType: "read", recordType: "Steps" },
    { accessType: "read", recordType: "SleepSession" },
    { accessType: "read", recordType: "Weight" },
    { accessType: "read", recordType: "Height" },
    { accessType: "read", recordType: "TotalCaloriesBurned" },
    { accessType: "read", recordType: "HeartRate" },
    { accessType: "read", recordType: "BloodPressure" },
    { accessType: "read", recordType: "ReadHealthDataHistory" },
  ];

  // react-native-health-connect requests ReadHealthDataHistory correctly,
  // but current versions do not include it in the granted-permissions result.
  // Treat it as requested but not locally verifiable, otherwise we false-fail
  // even after the user allows "Access past data" in Health Connect.
  const nonVerifiableRecordTypes = new Set(["ReadHealthDataHistory"]);

  try {
    const granted: Array<{ accessType: string; recordType: string }> =
      await healthConnect.requestPermission(required);

    permissionsRequested = true;

    const grantedSet = new Set(
      (granted ?? []).map((p: any) => `${p.accessType}:${p.recordType}`),
    );
    const denied = required
      .filter(
        (p) =>
          !nonVerifiableRecordTypes.has(p.recordType) &&
          !grantedSet.has(`${p.accessType}:${p.recordType}`),
      )
      .map((p) => p.recordType);

    if (denied.length > 0) return err({ kind: "PERMISSIONS_DENIED", denied });
  } catch (e) {
    return catchHealthError(e);
  }

  return ok(undefined);
}

export async function hasHealthSyncPermissions(): Promise<boolean> {
  if (Platform.OS === "ios") {
    if (!healthkit?.getRequestStatusForAuthorization) return false;

    try {
      const status = await healthkit.getRequestStatusForAuthorization({
        toRead: [...IOS_SYNC_READ_TYPES],
      });

      return (
        status === healthkit.AuthorizationRequestStatus?.unnecessary ||
        status === 2
      );
    } catch {
      return false;
    }
  }

  if (Platform.OS === "android") {
    const initResult = await initAndroid();
    if (!initResult.ok) return false;

    try {
      const granted: Array<{ accessType: string; recordType: string }> =
        await healthConnect.getGrantedPermissions();
      const grantedSet = new Set(
        (granted ?? []).map((p) => `${p.accessType}:${p.recordType}`),
      );

      // react-native-health-connect does not currently return
      // ReadHealthDataHistory in getGrantedPermissions(), so launch-time checks
      // only verify the record permissions required for incremental sync.
      return ANDROID_SYNC_REQUIRED.every((permission) =>
        grantedSet.has(`${permission.accessType}:${permission.recordType}`),
      );
    } catch {
      return false;
    }
  }

  return false;
}
