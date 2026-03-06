import {
  type Result,
  type DateRange,
  type SleepStage,
  type StepSample,
  type SleepSample,
  type WeightSample,
  type HeightSample,
  type CaloriesSample,
} from "./types";
import { safeDate, safeNumber, isHealthError } from "./utils";
import { runAndroidQuery, runAndroidFlatQuery } from "./query-runners";

// Health Connect SleepStageType integer → SleepStage
// https://developer.android.com/reference/kotlin/androidx/health/connect/client/records/SleepSessionRecord.Stage
const ANDROID_SLEEP_STAGE: Record<number, SleepStage> = {
  0: "unknown",
  1: "awake",
  2: "asleep", // sleeping (unspecified)
  3: "asleep", // out of bed — treated as asleep
  4: "deep",
  5: "rem",
  6: "core", // light
};

export const getStepsAndroid = (
  range: DateRange,
): Promise<Result<StepSample[]>> =>
  runAndroidQuery("Steps", range, (r) => {
    const startDate = safeDate(r?.startTime, "startTime");
    const endDate = safeDate(r?.endTime, "endTime");
    const count = safeNumber(r?.count, "count");
    if (isHealthError(startDate)) return startDate;
    if (isHealthError(endDate)) return endDate;
    if (isHealthError(count)) return count;
    return { startDate, endDate, count } satisfies StepSample;
  });

export const getSleepAndroid = (
  range: DateRange,
): Promise<Result<SleepSample[]>> =>
  runAndroidFlatQuery("SleepSession", range, (session) => {
    if (!session?.stages?.length) {
      const startDate = safeDate(session?.startTime, "startTime");
      const endDate = safeDate(session?.endTime, "endTime");
      if (isHealthError(startDate)) return startDate;
      if (isHealthError(endDate)) return endDate;
      return [{ startDate, endDate, stage: "asleep" satisfies SleepStage }];
    }

    const results: SleepSample[] = [];
    for (const stage of session.stages) {
      const startDate = safeDate(stage?.startTime, "stage.startTime");
      const endDate = safeDate(stage?.endTime, "stage.endTime");
      if (isHealthError(startDate)) return startDate;
      if (isHealthError(endDate)) return endDate;
      results.push({
        startDate,
        endDate,
        stage: ANDROID_SLEEP_STAGE[stage?.stage] ?? "unknown",
      });
    }
    return results;
  });

export const getWeightAndroid = (
  range: DateRange,
): Promise<Result<WeightSample[]>> =>
  runAndroidQuery("Weight", range, (r) => {
    const date = safeDate(r?.time, "time");
    const kg = safeNumber(r?.weight?.inKilograms, "weight.inKilograms");
    if (isHealthError(date)) return date;
    if (isHealthError(kg)) return kg;
    return { date, kg } satisfies WeightSample;
  });

export const getHeightAndroid = (
  range: DateRange,
): Promise<Result<HeightSample[]>> =>
  runAndroidQuery("Height", range, (r) => {
    const date = safeDate(r?.time, "time");
    const rawM = safeNumber(r?.height?.inMeters, "height.inMeters");
    if (isHealthError(date)) return date;
    if (isHealthError(rawM)) return rawM;
    return { date, cm: rawM * 100 } satisfies HeightSample;
  });

export const getCaloriesAndroid = (
  range: DateRange,
): Promise<Result<CaloriesSample[]>> =>
  runAndroidQuery("ActiveCaloriesBurned", range, (r) => {
    const startDate = safeDate(r?.startTime, "startTime");
    const endDate = safeDate(r?.endTime, "endTime");
    const kcal = safeNumber(r?.energy?.inKilocalories, "energy.inKilocalories");
    if (isHealthError(startDate)) return startDate;
    if (isHealthError(endDate)) return endDate;
    if (isHealthError(kcal)) return kcal;
    return { startDate, endDate, kcal } satisfies CaloriesSample;
  });
