import {
  ok,
  err,
  type Result,
  type HealthError,
  type DateRange,
} from "./types";
import { catchHealthError, isHealthError } from "./utils";

// ─── Static module requires ───────────────────────────────────────────────────

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

  const timeRangeFilter = {
    operator: "between",
    startTime: range.startDate.toISOString(),
    endTime: range.endDate.toISOString(),
  };

  try {
    const all: any[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const response: { records: any[]; pageToken?: string } =
        await healthConnect.readRecords(recordType, {
          timeRangeFilter,
          pageSize: 1000,
          ...(pageToken ? { pageToken } : {}),
        });
      all.push(...(response.records ?? []));
      pageToken = response.pageToken ?? undefined;
    } while (pageToken);

    return onRecords(all);
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

export async function getEarliestDataDate(
  recordType: string,
): Promise<Date | null> {
  try {
    const response = await healthConnect.readRecords(recordType, {
      timeRangeFilter: {
        operator: "between",
        startTime: "2000-01-01T00:00:00.000Z",
        endTime: new Date().toISOString(),
      },
      pageSize: 1,
      ascendingOrder: true, 
    });

    const firstRecord = response.records[0];
    if (firstRecord) {
      return new Date(firstRecord.startTime || firstRecord.time);
    }
  } catch (e) {
    console.log(`Could not find start date for ${recordType}:`, e);
  }
  return null;
}

export async function runAndroidAggregateDays(
  recordType: "Steps" | "TotalCaloriesBurned",
  range: DateRange,
): Promise<Result<any[]>> {
  const initErr = await initHealthConnect();
  if (initErr) return err(initErr);

  const earliestDate = await getEarliestDataDate(recordType);

  const optimizedStart =
    earliestDate && earliestDate > range.startDate
      ? earliestDate
      : range.startDate;

  try {
    const result = await healthConnect.aggregateGroupByDuration({
      recordType,
      timeRangeFilter: {
        operator: "between",
        startTime: optimizedStart.toISOString(),
        endTime: range.endDate.toISOString(),
      },
      timeRangeSlicer: {
        duration: "HOURS",
        length: 24,
      },
    });

    return ok(result);
  } catch (e) {
    return catchHealthError(e);
  }
}
