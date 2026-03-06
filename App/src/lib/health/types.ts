// ─── Result ──────────────────────────────────────────────────────────────────

export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: HealthError };
export type Result<T> = Ok<T> | Err;

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
export const err = (error: HealthError): Err => ({ ok: false, error });

// ─── Errors ───────────────────────────────────────────────────────────────────

export type HealthError =
  | { kind: "PLATFORM_NOT_SUPPORTED" }
  | { kind: "HEALTH_NOT_AVAILABLE" }
  | { kind: "HEALTH_CONNECT_NOT_INSTALLED" }
  | { kind: "HEALTH_CONNECT_OUTDATED" }
  | { kind: "HEALTH_CONNECT_INIT_FAILED"; reason: string }
  | { kind: "PERMISSIONS_NOT_REQUESTED" }
  | { kind: "PERMISSIONS_DENIED"; denied: string[] }
  | { kind: "PERMISSIONS_RETRACTED" }
  | { kind: "INVALID_DATE_RANGE"; reason: string }
  | { kind: "MODULE_NOT_AVAILABLE"; module: string }
  | { kind: "SDK_ERROR"; message: string; raw?: unknown }
  | { kind: "MALFORMED_DATA"; message: string };

export function describeHealthError(e: HealthError): string {
  switch (e.kind) {
    case "PLATFORM_NOT_SUPPORTED":
      return "Health data is not supported on this platform.";
    case "HEALTH_NOT_AVAILABLE":
      return "Health data is not available on this device.";
    case "HEALTH_CONNECT_NOT_INSTALLED":
      return "Health Connect is not installed. Please install it from the Play Store.";
    case "HEALTH_CONNECT_OUTDATED":
      return "Health Connect needs to be updated. Please update it from the Play Store.";
    case "HEALTH_CONNECT_INIT_FAILED":
      return `Health Connect failed to initialise: ${e.reason}`;
    case "PERMISSIONS_NOT_REQUESTED":
      return "Call requestHealthPermissions() before querying data.";
    case "PERMISSIONS_DENIED":
      return `Permissions denied: ${e.denied.join(", ")}`;
    case "PERMISSIONS_RETRACTED":
      return "Health permissions were retracted. Please re-grant them in Settings.";
    case "INVALID_DATE_RANGE":
      return `Invalid date range: ${e.reason}`;
    case "MODULE_NOT_AVAILABLE":
      return `Native module "${e.module}" is not available. Check your installation.`;
    case "SDK_ERROR":
      return `Health SDK error: ${e.message}`;
    case "MALFORMED_DATA":
      return `Unexpected data from health SDK: ${e.message}`;
  }
}

// ─── Data types ───────────────────────────────────────────────────────────────

export type DateRange = { startDate: Date; endDate: Date };
export type SleepStage =
  | "asleep"
  | "awake"
  | "rem"
  | "deep"
  | "core"
  | "unknown";

export type StepSample = { startDate: Date; endDate: Date; count: number };
export type SleepSample = { startDate: Date; endDate: Date; stage: SleepStage };
export type WeightSample = { date: Date; kg: number };
export type HeightSample = { date: Date; cm: number };
export type CaloriesSample = { startDate: Date; endDate: Date; kcal: number };
