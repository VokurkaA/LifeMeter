import {
  ok,
  err,
  type Result,
  type HealthError,
  type DateRange,
  Err,
} from "./types";

// ─── Date range ───────────────────────────────────────────────────────────────

export function validateDateRange(range: DateRange): HealthError | null {
  const { startDate, endDate } = range;
  if (!(startDate instanceof Date) || isNaN(startDate.getTime()))
    return {
      kind: "INVALID_DATE_RANGE",
      reason: "startDate is not a valid Date",
    };
  if (!(endDate instanceof Date) || isNaN(endDate.getTime()))
    return {
      kind: "INVALID_DATE_RANGE",
      reason: "endDate is not a valid Date",
    };
  if (startDate >= endDate)
    return {
      kind: "INVALID_DATE_RANGE",
      reason: "startDate must be before endDate",
    };
  return null;
}

// ─── Field validators ─────────────────────────────────────────────────────────

export function safeDate(value: unknown, field: string): Date | HealthError {
  const d = new Date(value as string);
  if (isNaN(d.getTime()))
    return {
      kind: "MALFORMED_DATA",
      message: `Field "${field}" is not a valid date: ${value}`,
    };
  return d;
}

export function safeNumber(
  value: unknown,
  field: string,
): number | HealthError {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value))
    return {
      kind: "MALFORMED_DATA",
      message: `Field "${field}" is not a valid number: ${value}`,
    };
  return value;
}

export function isHealthError(value: unknown): value is HealthError {
  return typeof value === "object" && value !== null && "kind" in value;
}

// ─── Error catch helper ───────────────────────────────────────────────────────

export function catchHealthError(e: unknown): Err {
  const msg = (e as Error)?.message?.toLowerCase() ?? String(e);
  const isPermissionError =
    msg.includes("authorization") ||
    msg.includes("protected") ||
    msg.includes("permission") ||
    msg.includes("security") ||
    msg.includes("not granted") ||
    msg.includes("unauthorized");

  if (isPermissionError) return err({ kind: "PERMISSIONS_RETRACTED" });
  return err({
    kind: "SDK_ERROR",
    message: (e as Error)?.message ?? String(e),
    raw: e,
  });
}
