import { Platform, Linking, PermissionsAndroid } from "react-native";
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
  ];

  try {
    const granted: Array<{ accessType: string; recordType: string }> =
      await healthConnect.requestPermission(required);

    permissionsRequested = true;

    const grantedSet = new Set(
      (granted ?? []).map((p: any) => `${p.accessType}:${p.recordType}`),
    );
    const denied = required
      .filter((p) => !grantedSet.has(`${p.accessType}:${p.recordType}`))
      .map((p) => p.recordType);

    if (denied.length > 0) return err({ kind: "PERMISSIONS_DENIED", denied });

    const historyGranted = await PermissionsAndroid.request(
      "android.permission.health.READ_HEALTH_DATA_HISTORY" as any,
    );

    if (historyGranted !== PermissionsAndroid.RESULTS.GRANTED) {
      return err({
        kind: "PERMISSIONS_DENIED",
        denied: ["HealthDataHistory"],
      });
    }
  } catch (e) {
    return catchHealthError(e);
  }

  return ok(undefined);
}
