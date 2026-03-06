import {
  ok,
  err,
  type Result,
  type HealthError,
  type DateRange,
} from "./types";
import { catchHealthError, isHealthError } from "./utils";

// ─── Static module requires ───────────────────────────────────────────────────
// Metro requires string literals at require() call sites — no dynamic requires.
// We attempt both here; whichever isn't installed will be null at runtime.

let healthkit: any = null;
let healthConnect: any = null;

try {
  healthkit = require("@kingstinct/react-native-healthkit");
} catch {}
try {
  healthConnect = require("react-native-health-connect");
} catch {}

// ─── iOS query runner ─────────────────────────────────────────────────────────

export async function runIOSQuery<T>(
  fetch: (hk: any) => Promise<any[]>,
  mapper: (raw: any) => T | HealthError,
): Promise<Result<T[]>> {
  if (!healthkit)
    return err({
      kind: "MODULE_NOT_AVAILABLE",
      module: "@kingstinct/react-native-healthkit",
    });

  try {
    const samples = await fetch(healthkit);
    const results: T[] = [];
    for (const s of samples ?? []) {
      const mapped = mapper(s);
      if (isHealthError(mapped)) return err(mapped);
      results.push(mapped);
    }
    return ok(results);
  } catch (e) {
    return catchHealthError(e);
  }
}

// ─── Android query runner ─────────────────────────────────────────────────────

const HC_SDK_UNAVAILABLE = 1;
const HC_SDK_UNAVAILABLE_UPDATE = 2;

async function initHealthConnect(): Promise<HealthError | null> {
  if (!healthConnect) return { kind: "HEALTH_CONNECT_NOT_INSTALLED" };

  if (typeof healthConnect.getSdkStatus === "function") {
    try {
      const status = await healthConnect.getSdkStatus();
      if (status === HC_SDK_UNAVAILABLE)
        return { kind: "HEALTH_CONNECT_NOT_INSTALLED" };
      if (status === HC_SDK_UNAVAILABLE_UPDATE)
        return { kind: "HEALTH_CONNECT_OUTDATED" };
    } catch (e) {
      return { kind: "HEALTH_CONNECT_INIT_FAILED", reason: String(e) };
    }
  }

  try {
    const initialized = await healthConnect.initialize();
    if (!initialized)
      return {
        kind: "HEALTH_CONNECT_INIT_FAILED",
        reason: "initialize() returned false",
      };
    return null;
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? "";
    if (msg.includes("not installed") || msg.includes("unavailable"))
      return { kind: "HEALTH_CONNECT_NOT_INSTALLED" };
    return { kind: "HEALTH_CONNECT_INIT_FAILED", reason: msg };
  }
}

async function runAndroidReadRecords<T>(
  recordType: string,
  range: DateRange,
  onRecords: (records: any[]) => Result<T[]>,
): Promise<Result<T[]>> {
  const initErr = await initHealthConnect();
  if (initErr) return err(initErr);

  try {
    const { records } = await healthConnect.readRecords(recordType, {
      timeRangeFilter: {
        operator: "between",
        startTime: range.startDate.toISOString(),
        endTime: range.endDate.toISOString(),
      },
    });
    return onRecords(records ?? []);
  } catch (e) {
    return catchHealthError(e);
  }
}

export function runAndroidQuery<T>(
  recordType: string,
  range: DateRange,
  mapper: (raw: any) => T | HealthError,
): Promise<Result<T[]>> {
  return runAndroidReadRecords(recordType, range, (records) => {
    const results: T[] = [];
    for (const r of records) {
      const mapped = mapper(r);
      if (isHealthError(mapped)) return err(mapped);
      results.push(mapped);
    }
    return ok(results);
  });
}

export function runAndroidFlatQuery<T>(
  recordType: string,
  range: DateRange,
  mapper: (raw: any) => T[] | HealthError,
): Promise<Result<T[]>> {
  return runAndroidReadRecords(recordType, range, (records) => {
    const results: T[] = [];
    for (const r of records) {
      const mapped = mapper(r);
      if (isHealthError(mapped)) return err(mapped);
      results.push(...mapped);
    }
    return ok(results);
  });
}
