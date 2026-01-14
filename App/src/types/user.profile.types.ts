export interface LengthUnit {
  id: number;
  name: string;
  meterConversionFactor: number;
}

export interface ActivityLevel {
  id: number;
  name: string;
  description: string | null;
  minFactor: number;
  maxFactor: number;
}

export interface WeightUnit {
  id: number;
  name: string;
  gramConversionFactor: number;
}

export interface UserProfile {
  userId: string;
  dateOfBirth: string | Date | null;
  sex: 'M' | 'F' | null;
  currentActivityFactor: number;
  currentBmrCalories: number | null;
  defaultWeightUnitId: number | null;
  defaultLengthUnitId: number | null;
  finishedOnboarding: boolean;
}

export interface UserGoal {
  userId: string;
  dailyStepsGoal: number | null;
  bedtimeGoal: string | null;
  wakeupGoal: string | null;
  dailyProteinGoalGrams: number | null;
  dailyFatGoalGrams: number | null;
  dailyCarbsGoalGrams: number | null;
  targetWeightGrams: number | null;
  targetWeightDate: string | Date | null;
}

export interface UserWeightLog {
  id: string;
  userId: string;
  measuredAt: string | Date;
  weightGrams: number;
  bodyFatPercentage: number | null;
  leanTissuePercentage: number | null;
  waterPercentage: number | null;
  boneMassPercentage: number | null;
}

export interface UserHeightLog {
  id: string;
  userId: string;
  measuredAt: string | Date;
  heightCm: number;
}

export interface UpdateProfileInput {
  dateOfBirth?: string | null;
  sex?: 'M' | 'F' | null;
  currentActivityFactor?: number;
  currentBmrCalories?: number | null;
  defaultWeightUnitId?: number | null;
  defaultLengthUnitId?: number | null;
  finishedOnboarding?: boolean;
}

export interface UpdateGoalInput {
  dailyStepsGoal?: number | null;
  bedtimeGoal?: string | null;
  wakeupGoal?: string | null;
  dailyProteinGoalGrams?: number | null;
  dailyFatGoalGrams?: number | null;
  dailyCarbsGoalGrams?: number | null;
  targetWeightGrams?: number | null;
  targetWeightDate?: string | null;
}

export interface LogWeightInput {
  measuredAt: string;
  weightGrams: number;
  bodyFatPercentage?: number | null;
  leanTissuePercentage?: number | null;
  waterPercentage?: number | null;
  boneMassPercentage?: number | null;
}

export interface LogHeightInput {
  measuredAt: string;
  heightCm: number;
}