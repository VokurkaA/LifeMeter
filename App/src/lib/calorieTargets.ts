import mifflinStJeor from "@/lib/bmr";

const LB_PER_KG = 2.2046226218;
const LB_PER_ST = 14;
const CM_PER_FT = 30.48;

export type EditableSex = "male" | "female";
export type ProfileSex = "M" | "F";
export type LengthUnitName = "cm" | "ft";
export type WeightUnitName = "kg" | "lbs" | "st";
export type PreferredUnit = "metric" | "imperial" | "mixed";

export interface DailyCalorieTargetInput {
  sex?: EditableSex;
  birthDate?: Date;
  weight?: number;
  weightUnit?: WeightUnitName;
  height?: number;
  heightUnit?: LengthUnitName;
  activityFactor?: number;
  goalWeight?: number;
  goalWeightUnit?: WeightUnitName;
  targetDate?: Date;
  referenceDate?: Date;
}

export interface DailyCalorieTargetResult {
  bmr: number | null;
  tdee: number | null;
  dailyCalorieTarget: number | null;
}

export interface MacroPercentageInput {
  activityLevelId?: number;
  dailyCalorieTarget?: number | null;
  dailyProteinGoalGrams?: number | null;
  dailyFatGoalGrams?: number | null;
  dailyCarbsGoalGrams?: number | null;
}

export interface MacroPercentages {
  proteinPercentage: number;
  fatPercentage: number;
  carbsPercentage: number;
}

export function parseDateOnly(value?: string | Date | null): Date | undefined {
  if (!value) return undefined;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function toDateOnlyString(date?: Date | null): string | undefined {
  if (!date) return undefined;
  return date.toISOString().split("T")[0];
}

export function toTimeString(date?: Date | null): string | undefined {
  if (!date) return undefined;
  return date.toTimeString().slice(0, 5);
}

export function getPreferredUnit(
  lengthUnit?: LengthUnitName | null,
  weightUnit?: WeightUnitName | null,
): PreferredUnit | undefined {
  if (!lengthUnit || !weightUnit) return undefined;
  if (lengthUnit === "cm" && weightUnit === "kg") return "metric";
  if (lengthUnit === "ft" && weightUnit === "lbs") return "imperial";
  return "mixed";
}

export function normalizeSexFromProfile(sex?: ProfileSex | null): EditableSex | undefined {
  if (sex === "M") return "male";
  if (sex === "F") return "female";
  return undefined;
}

export function normalizeSexToProfile(sex?: EditableSex | null): ProfileSex | null {
  if (sex === "male") return "M";
  if (sex === "female") return "F";
  return null;
}

export function convertWeightToKg(
  weight?: number | null,
  unit?: WeightUnitName | null,
): number | undefined {
  if (!Number.isFinite(weight) || weight == null || !unit) return undefined;
  if (unit === "kg") return weight;
  if (unit === "lbs") return weight / LB_PER_KG;
  return (weight * LB_PER_ST) / LB_PER_KG;
}

export function convertKgToWeight(
  weightKg?: number | null,
  unit?: WeightUnitName | null,
): number | undefined {
  if (!Number.isFinite(weightKg) || weightKg == null || !unit) return undefined;
  if (unit === "kg") return weightKg;
  if (unit === "lbs") return weightKg * LB_PER_KG;
  return (weightKg * LB_PER_KG) / LB_PER_ST;
}

export function convertWeightToGrams(
  weight?: number | null,
  unit?: WeightUnitName | null,
): number | undefined {
  const weightKg = convertWeightToKg(weight, unit);
  if (!Number.isFinite(weightKg) || weightKg == null) return undefined;
  return Math.round(weightKg * 1000);
}

export function convertGramsToWeight(
  grams?: number | null,
  unit?: WeightUnitName | null,
): number | undefined {
  if (!Number.isFinite(grams) || grams == null) return undefined;
  return convertKgToWeight(grams / 1000, unit);
}

export function convertHeightToCm(
  height?: number | null,
  unit?: LengthUnitName | null,
): number | undefined {
  if (!Number.isFinite(height) || height == null || !unit) return undefined;
  if (unit === "cm") return height;
  return height * CM_PER_FT;
}

export function convertCmToHeight(
  heightCm?: number | null,
  unit?: LengthUnitName | null,
): number | undefined {
  if (!Number.isFinite(heightCm) || heightCm == null || !unit) return undefined;
  if (unit === "cm") return heightCm;
  return heightCm / CM_PER_FT;
}

export function getAgeYears(birthDate?: Date, referenceDate: Date = new Date()): number | undefined {
  if (!birthDate || Number.isNaN(birthDate.getTime())) return undefined;

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const birthdayPassed =
    referenceDate.getMonth() > birthDate.getMonth() ||
    (referenceDate.getMonth() === birthDate.getMonth() &&
      referenceDate.getDate() >= birthDate.getDate());

  if (!birthdayPassed) {
    age -= 1;
  }

  return Math.max(0, age);
}

export function calculateDailyCalorieTarget(
  input: DailyCalorieTargetInput,
): DailyCalorieTargetResult {
  const {
    sex,
    birthDate,
    weight,
    weightUnit,
    height,
    heightUnit,
    activityFactor,
    goalWeight,
    goalWeightUnit,
    targetDate,
    referenceDate = new Date(),
  } = input;

  const ageYears = getAgeYears(birthDate, referenceDate);
  const weightKg = convertWeightToKg(weight, weightUnit);
  const heightCm = convertHeightToCm(height, heightUnit);

  if (
    !sex ||
    ageYears == null ||
    !Number.isFinite(weightKg) ||
    !Number.isFinite(heightCm) ||
    !Number.isFinite(activityFactor) ||
    activityFactor == null
  ) {
    return { bmr: null, tdee: null, dailyCalorieTarget: null };
  }

  const safeWeightKg = weightKg!;
  const safeHeightCm = heightCm!;
  const safeActivityFactor = activityFactor!;

  const rawBmr = mifflinStJeor(sex, safeWeightKg, safeHeightCm, ageYears);
  if (!Number.isFinite(rawBmr) || rawBmr <= 0) {
    return { bmr: null, tdee: null, dailyCalorieTarget: null };
  }

  const bmr = Math.round(rawBmr);
  const tdee = Math.round(bmr * safeActivityFactor);

  if (
    goalWeight == null ||
    !goalWeightUnit ||
    !targetDate ||
    Number.isNaN(targetDate.getTime())
  ) {
    return { bmr, tdee, dailyCalorieTarget: tdee };
  }

  const goalWeightKg = convertWeightToKg(goalWeight, goalWeightUnit);
  if (!Number.isFinite(goalWeightKg) || goalWeightKg == null) {
    return { bmr, tdee, dailyCalorieTarget: null };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.ceil((targetDate.getTime() - referenceDate.getTime()) / msPerDay));
  const dailyCalorieChange = ((goalWeightKg - safeWeightKg) * 7700) / days;
  const dailyCalorieTarget = Math.round(tdee + dailyCalorieChange);

  if (!Number.isFinite(dailyCalorieTarget) || dailyCalorieTarget <= 0) {
    return { bmr, tdee, dailyCalorieTarget: null };
  }

  return { bmr, tdee, dailyCalorieTarget };
}

export function getDefaultMacroPercentages(activityLevelId?: number): MacroPercentages {
  const proteinPercentage = (() => {
    switch (activityLevelId) {
      case 1:
        return 20;
      case 2:
        return 25;
      case 3:
        return 30;
      case 4:
        return 35;
      case 5:
        return 40;
      default:
        return 30;
    }
  })();

  const fatPercentage = 25;
  const carbsPercentage = 100 - proteinPercentage - fatPercentage;

  return {
    proteinPercentage,
    fatPercentage,
    carbsPercentage,
  };
}

export function normalizeMacroPercentages(
  proteinPercentage: number,
  fatPercentage: number,
  carbsPercentage: number,
): MacroPercentages {
  const protein = Math.max(0, Math.round(proteinPercentage));
  const fat = Math.max(0, Math.round(fatPercentage));
  let carbs = Math.max(0, Math.round(carbsPercentage));

  const total = protein + fat + carbs;
  if (total === 100) {
    return {
      proteinPercentage: protein,
      fatPercentage: fat,
      carbsPercentage: carbs,
    };
  }

  if (total === 0) {
    return {
      proteinPercentage: 30,
      fatPercentage: 25,
      carbsPercentage: 45,
    };
  }

  carbs = Math.max(0, 100 - protein - fat);
  if (protein + fat + carbs !== 100) {
    const nextProtein = Math.min(100, protein);
    const nextFat = Math.min(100 - nextProtein, fat);
    carbs = Math.max(0, 100 - nextProtein - nextFat);
    return {
      proteinPercentage: nextProtein,
      fatPercentage: nextFat,
      carbsPercentage: carbs,
    };
  }

  return {
    proteinPercentage: protein,
    fatPercentage: fat,
    carbsPercentage: carbs,
  };
}

export function deriveMacroPercentages({
  activityLevelId,
  dailyCalorieTarget,
  dailyProteinGoalGrams,
  dailyFatGoalGrams,
  dailyCarbsGoalGrams,
}: MacroPercentageInput): MacroPercentages {
  const hasExplicitMacros =
    Number.isFinite(dailyCalorieTarget) &&
    (dailyCalorieTarget ?? 0) > 0 &&
    (dailyProteinGoalGrams ?? 0) > 0 &&
    (dailyFatGoalGrams ?? 0) > 0 &&
    (dailyCarbsGoalGrams ?? 0) > 0;

  if (!hasExplicitMacros) {
    return getDefaultMacroPercentages(activityLevelId);
  }

  const calorieTarget = dailyCalorieTarget ?? 0;
  const proteinPercentage = ((dailyProteinGoalGrams ?? 0) * 4 / calorieTarget) * 100;
  const fatPercentage = ((dailyFatGoalGrams ?? 0) * 9 / calorieTarget) * 100;
  const carbsPercentage = ((dailyCarbsGoalGrams ?? 0) * 4 / calorieTarget) * 100;

  return normalizeMacroPercentages(proteinPercentage, fatPercentage, carbsPercentage);
}

export function calculateMacroGoals(
  dailyCalorieTarget: number | null,
  percentages: MacroPercentages,
) {
  if (!Number.isFinite(dailyCalorieTarget) || dailyCalorieTarget == null || dailyCalorieTarget <= 0) {
    return {
      dailyProteinGoalGrams: undefined,
      dailyFatGoalGrams: undefined,
      dailyCarbsGoalGrams: undefined,
    };
  }

  return {
    dailyProteinGoalGrams: Math.round(dailyCalorieTarget * (percentages.proteinPercentage / 100) / 4),
    dailyFatGoalGrams: Math.round(dailyCalorieTarget * (percentages.fatPercentage / 100) / 9),
    dailyCarbsGoalGrams: Math.round(dailyCalorieTarget * (percentages.carbsPercentage / 100) / 4),
  };
}
