import {
  type Result,
  type DateRange,
  type SleepStage,
  type StepSample,
  type SleepSample,
  type WeightSample,
  type HeightSample,
  type CaloriesSample,
  ok,
} from "./types";
import { safeDate, safeNumber, isHealthError } from "./utils";
import {
  runAndroidQuery,
  runAndroidFlatQuery,
  runAndroidAggregateDays,
} from "./query-runners";

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

export const getStepsAndroid = async (
  range: DateRange,
): Promise<Result<StepSample[]>> => {
  const result = await runAndroidAggregateDays("Steps", range);
  if (!result.ok) return result;

  return ok(
    result.data.map((bucket: any) => ({
      startDate: new Date(bucket.startTime),
      endDate: new Date(bucket.endTime),
      count: bucket.result.COUNT_TOTAL ?? 0,
    })),
  );
};

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

export const getCaloriesAndroid = async (
  range: DateRange,
): Promise<Result<CaloriesSample[]>> => {
  const result = await runAndroidAggregateDays("TotalCaloriesBurned", range);
  if (!result.ok) return result;

  const samples: CaloriesSample[] = result.data
    .map((bucket: any) => {
      const rawEnergy =
        bucket.result.ENERGY_TOTAL || bucket.result.TOTAL_CALORIES_BURNED_TOTAL;

      let kcal = 0;
      if (typeof rawEnergy === "number") {
        kcal = rawEnergy;
      } else if (rawEnergy?.inKilocalories) {
        kcal = rawEnergy.inKilocalories;
      }

      return {
        startDate: new Date(bucket.startTime),
        endDate: new Date(bucket.endTime),
        kcal: kcal,
      };
    })
    .filter((s) => s.kcal > 0);

  return ok(samples);
};
