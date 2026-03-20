import type { FullUserMeal } from "@/types/food.type";
import type { PaginationResult } from "@/types/pagination.types";
import type { SleepEntry } from "@/types/sleep.types";
import type {
  UserGoal,
  UserHeightLog,
  UserProfile,
  UserWeightLog,
} from "@/types/user.profile.types";
import type { FullWorkout, FullWorkoutTemplate } from "@/types/workout.types";

export type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginMethod: string | null;
  finishedOnboarding: boolean;
  lastSessionAt: string | null;
};

export type AdminOverview = {
  totalUsers: number;
  totalMeals: number;
  totalSleepEntries: number;
  totalWorkouts: number;
  totalWorkoutTemplates: number;
  activeSleepEntries: number;
};

export type AdminBloodPressureLog = {
  id: string;
  user_id: string;
  measured_at: string;
  systolic_mmhg: number;
  diastolic_mmhg: number;
};

export type AdminHeartRateLog = {
  id: string;
  user_id: string;
  measured_at: string;
  bpm: number;
};

export type AdminUserProfileBundle = {
  user: AdminUserSummary;
  profile: UserProfile | null;
  goals: UserGoal | null;
  latestWeight: UserWeightLog | null;
  latestHeight: UserHeightLog | null;
  latestBloodPressure: AdminBloodPressureLog | null;
  latestHeartRate: AdminHeartRateLog | null;
};

export type AdminPaginatedResponse<T> = {
  rows: T[];
  total: number;
  pagination: PaginationResult;
};

export type AdminUserMealsResponse = AdminPaginatedResponse<{
  userMeal: FullUserMeal["userMeal"];
  userFoods: FullUserMeal["userFoods"][number]["userFood"][];
}>;

export type AdminUserSleepResponse = AdminPaginatedResponse<SleepEntry>;
export type AdminUserWorkoutsResponse = AdminPaginatedResponse<FullWorkout>;
export type AdminUserWorkoutTemplatesResponse =
  AdminPaginatedResponse<FullWorkoutTemplate>;
