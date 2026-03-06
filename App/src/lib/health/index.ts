import { Platform } from "react-native";
import {
  ok,
  err,
  type Result,
  type DateRange,
  type StepSample,
  type SleepSample,
  type WeightSample,
  type HeightSample,
  type CaloriesSample,
} from "./types";
import { validateDateRange } from "./utils";
import { permissionsRequested } from "./permissions";
import {
  getStepsIOS,
  getSleepIOS,
  getWeightIOS,
  getHeightIOS,
  getCaloriesIOS,
} from "./ios";
import {
  getStepsAndroid,
  getSleepAndroid,
  getWeightAndroid,
  getHeightAndroid,
  getCaloriesAndroid,
} from "./android";

// Re-export everything callers need — they only ever import from this file
export * from "./types";
export {
  requestHealthPermissions,
  isHealthAvailable,
  openHealthDashboard,
} from "./permissions";
import { isHealthAvailable } from "./permissions";

// ─── Guards ───────────────────────────────────────────────────────────────────

async function preflight(range: DateRange): Promise<Result<void>> {
  if (Platform.OS !== "ios" && Platform.OS !== "android")
    return err({ kind: "PLATFORM_NOT_SUPPORTED" });

  const rangeErr = validateDateRange(range);
  if (rangeErr) return err(rangeErr);

  if (!permissionsRequested) return err({ kind: "PERMISSIONS_NOT_REQUESTED" });

  if (Platform.OS === "ios") {
    const available = await isHealthAvailable();
    if (!available) return err({ kind: "HEALTH_NOT_AVAILABLE" });
  }

  return ok(undefined);
}

const ios = Platform.OS === "ios";

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getSteps(
  range: DateRange,
): Promise<Result<StepSample[]>> {
  const guard = await preflight(range);
  if (!guard.ok) return guard;

  const result = await (ios ? getStepsIOS(range) : getStepsAndroid(range));
  if (!result.ok) return result;

  const grouped = new Map<string, StepSample>();

  for (const s of result.data) {
    const d = s.startDate;
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const existing = grouped.get(day);
    if (existing) {
      existing.count += s.count;
      if (s.startDate < existing.startDate) existing.startDate = s.startDate;
      if (s.endDate > existing.endDate) existing.endDate = s.endDate;
    } else {
      grouped.set(day, {
        startDate: s.startDate,
        endDate: s.endDate,
        count: s.count,
      });
    }
  }

  const dailySteps = Array.from(grouped.values()).sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );

  return ok(dailySteps);
}

export async function getSleep(
  range: DateRange,
): Promise<Result<SleepSample[]>> {
  const guard = await preflight(range);
  if (!guard.ok) return guard;
  return ios ? getSleepIOS(range) : getSleepAndroid(range);
}

export async function getWeight(
  range: DateRange,
): Promise<Result<WeightSample[]>> {
  const guard = await preflight(range);
  if (!guard.ok) return guard;
  return ios ? getWeightIOS(range) : getWeightAndroid(range);
}

export async function getHeight(
  range: DateRange,
): Promise<Result<HeightSample[]>> {
  const guard = await preflight(range);
  if (!guard.ok) return guard;
  return ios ? getHeightIOS(range) : getHeightAndroid(range);
}

export async function getCalories(
  range: DateRange,
): Promise<Result<CaloriesSample[]>> {
  const guard = await preflight(range);
  if (!guard.ok) return guard;
  return ios ? getCaloriesIOS(range) : getCaloriesAndroid(range);
}

// ─── Aggregators ──────────────────────────────────────────────────────────────

function dayRange(date: Date): DateRange {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
}

export async function getTotalStepsForDay(date: Date): Promise<Result<number>> {
  const result = await getSteps(dayRange(date));
  if (!result.ok) return result;
  return ok(result.data.reduce((sum, s) => sum + s.count, 0));
}

export async function getTotalCaloriesForDay(
  date: Date,
): Promise<Result<number>> {
  const result = await getCalories(dayRange(date));
  if (!result.ok) return result;
  return ok(result.data.reduce((sum, s) => sum + s.kcal, 0));
}

/** Window: 6 PM on `date` → noon the following day */
export async function getTotalSleepMinutesForNight(
  date: Date,
): Promise<Result<number>> {
  const startDate = new Date(date);
  startDate.setHours(18, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  endDate.setHours(12, 0, 0, 0);
  const result = await getSleep({ startDate, endDate });
  if (!result.ok) return result;
  const minutes = result.data
    .filter((s) => s.stage !== "awake")
    .reduce(
      (sum, s) => sum + (s.endDate.getTime() - s.startDate.getTime()) / 60_000,
      0,
    );
  return ok(minutes);
}

export async function getMostRecentWeight(): Promise<
  Result<WeightSample | null>
> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  const result = await getWeight({ startDate, endDate });
  if (!result.ok) return result;
  return ok(
    result.data.sort((a, b) => b.date.getTime() - a.date.getTime())[0] ?? null,
  );
}

export async function getMostRecentHeight(): Promise<
  Result<HeightSample | null>
> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const result = await getHeight({ startDate, endDate });
  if (!result.ok) return result;
  return ok(
    result.data.sort((a, b) => b.date.getTime() - a.date.getTime())[0] ?? null,
  );
}
