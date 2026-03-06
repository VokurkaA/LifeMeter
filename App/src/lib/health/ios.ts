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
import { runIOSQuery } from "./query-runners";

// HKCategoryValueSleepAnalysis integer → SleepStage
// https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis
const IOS_SLEEP_STAGE: Record<number, SleepStage> = {
  0: "asleep", // inBed (legacy, pre-iOS 16)
  1: "awake",
  2: "asleep", // asleepUnspecified
  3: "core", // asleepCore
  4: "deep", // asleepDeep
  5: "rem", // asleepREM
};

export const getStepsIOS = (range: DateRange): Promise<Result<StepSample[]>> =>
  runIOSQuery(
    (hk) =>
      hk.queryQuantitySamples("HKQuantityTypeIdentifierStepCount", {
        from: range.startDate,
        to: range.endDate,
        unit: "count",
      }),
    (s) => {
      const startDate = safeDate(s?.startDate, "startDate");
      const endDate = safeDate(s?.endDate, "endDate");
      const count = safeNumber(s?.quantity, "quantity");
      if (isHealthError(startDate)) return startDate;
      if (isHealthError(endDate)) return endDate;
      if (isHealthError(count)) return count;
      return { startDate, endDate, count } satisfies StepSample;
    },
  );

export const getSleepIOS = (range: DateRange): Promise<Result<SleepSample[]>> =>
  runIOSQuery(
    (hk) =>
      hk.queryCategorySamples("HKCategoryTypeIdentifierSleepAnalysis", {
        from: range.startDate,
        to: range.endDate,
      }),
    (s) => {
      const startDate = safeDate(s?.startDate, "startDate");
      const endDate = safeDate(s?.endDate, "endDate");
      if (isHealthError(startDate)) return startDate;
      if (isHealthError(endDate)) return endDate;
      return {
        startDate,
        endDate,
        stage: IOS_SLEEP_STAGE[s?.value] ?? "unknown",
      } satisfies SleepSample;
    },
  );

export const getWeightIOS = (
  range: DateRange,
): Promise<Result<WeightSample[]>> =>
  runIOSQuery(
    (hk) =>
      hk.queryQuantitySamples("HKQuantityTypeIdentifierBodyMass", {
        from: range.startDate,
        to: range.endDate,
        unit: "kg",
      }),
    (s) => {
      const date = safeDate(s?.startDate, "startDate");
      const kg = safeNumber(s?.quantity, "quantity");
      if (isHealthError(date)) return date;
      if (isHealthError(kg)) return kg;
      return { date, kg } satisfies WeightSample;
    },
  );

export const getHeightIOS = (
  range: DateRange,
): Promise<Result<HeightSample[]>> =>
  runIOSQuery(
    (hk) =>
      hk.queryQuantitySamples("HKQuantityTypeIdentifierHeight", {
        from: range.startDate,
        to: range.endDate,
        unit: "cm",
      }),
    (s) => {
      const date = safeDate(s?.startDate, "startDate");
      const cm = safeNumber(s?.quantity, "quantity");
      if (isHealthError(date)) return date;
      if (isHealthError(cm)) return cm;
      return { date, cm } satisfies HeightSample;
    },
  );

export const getCaloriesIOS = (
  range: DateRange,
): Promise<Result<CaloriesSample[]>> =>
  runIOSQuery(
    (hk) =>
      hk.queryQuantitySamples("HKQuantityTypeIdentifierActiveEnergyBurned", {
        from: range.startDate,
        to: range.endDate,
        unit: "kcal",
      }),
    (s) => {
      const startDate = safeDate(s?.startDate, "startDate");
      const endDate = safeDate(s?.endDate, "endDate");
      const kcal = safeNumber(s?.quantity, "quantity");
      if (isHealthError(startDate)) return startDate;
      if (isHealthError(endDate)) return endDate;
      if (isHealthError(kcal)) return kcal;
      return { startDate, endDate, kcal } satisfies CaloriesSample;
    },
  );
