import { z } from "@hono/zod-openapi";
import { userSchema } from "@/schemas/auth.schema";
import {
  createPaginatedResponseSchema,
  paginationQuerySchema,
} from "@/schemas/pagination.schema";
import {
  fullMealResponseSchema,
  simpleMealResponseSchema,
} from "@/schemas/user.food.schema";
import { SleepEntrySchema } from "@/schemas/user.sleep.schema";
import { workoutSchema, workoutTemplateSchema } from "@/schemas/user.workout.schema";

export const adminUserSummarySchema = userSchema.extend({
  lastLoginMethod: z.string().nullable().optional().openapi({ example: "email" }),
  finishedOnboarding: z.boolean().openapi({ example: true }),
  lastSessionAt: z.string().nullable().optional().openapi({
    example: "2026-03-20T12:00:00Z",
  }),
}).openapi("AdminUserSummary");

export const adminOverviewSchema = z.object({
  totalUsers: z.number().openapi({ example: 250 }),
  totalMeals: z.number().openapi({ example: 1890 }),
  totalSleepEntries: z.number().openapi({ example: 740 }),
  totalWorkouts: z.number().openapi({ example: 1120 }),
  totalWorkoutTemplates: z.number().openapi({ example: 320 }),
  activeSleepEntries: z.number().openapi({ example: 3 }),
}).openapi("AdminOverview");

export const adminUserFilterSchema = paginationQuerySchema.extend({
  q: z.string().trim().optional().openapi({ example: "jan@example.com" }),
});

export const adminMetricLogSchema = z.object({
  id: z.string().openapi({ example: "log_123" }),
  user_id: z.string().openapi({ example: "user_123" }),
  measured_at: z.string().datetime().openapi({ example: "2026-03-20T12:00:00Z" }),
});

export const adminWeightLogSchema = adminMetricLogSchema.extend({
  weight_grams: z.number().openapi({ example: 83000 }),
  body_fat_percentage: z.number().nullable().openapi({ example: 15.4 }),
  lean_tissue_percentage: z.number().nullable().openapi({ example: 77.2 }),
  water_percentage: z.number().nullable().openapi({ example: 58.6 }),
  bone_mass_percentage: z.number().nullable().openapi({ example: 4.7 }),
}).openapi("AdminWeightLog");

export const adminHeightLogSchema = adminMetricLogSchema.extend({
  height_cm: z.number().openapi({ example: 181 }),
}).openapi("AdminHeightLog");

export const adminBloodPressureLogSchema = adminMetricLogSchema.extend({
  systolic_mmhg: z.number().openapi({ example: 122 }),
  diastolic_mmhg: z.number().openapi({ example: 78 }),
}).openapi("AdminBloodPressureLog");

export const adminHeartRateLogSchema = adminMetricLogSchema.extend({
  bpm: z.number().openapi({ example: 63 }),
}).openapi("AdminHeartRateLog");

export const adminUserProfileSchema = z.object({
  user_id: z.string().openapi({ example: "user_123" }),
  date_of_birth: z.string().date().nullable().openapi({ example: "1998-02-14" }),
  sex: z.enum(["M", "F"]).nullable().openapi({ example: "M" }),
  current_activity_factor: z.number().openapi({ example: 1.55 }),
  current_bmr_calories: z.number().nullable().openapi({ example: 2100 }),
  default_weight_unit_id: z.number().nullable().openapi({ example: 1 }),
  default_length_unit_id: z.number().nullable().openapi({ example: 1 }),
  finished_onboarding: z.boolean().openapi({ example: true }),
}).openapi("AdminUserProfile");

export const adminUserGoalsSchema = z.object({
  user_id: z.string().openapi({ example: "user_123" }),
  daily_steps_goal: z.number().nullable().openapi({ example: 10000 }),
  bedtime_goal: z.string().nullable().openapi({ example: "22:30:00" }),
  wakeup_goal: z.string().nullable().openapi({ example: "06:30:00" }),
  daily_protein_goal_grams: z.number().nullable().openapi({ example: 160 }),
  daily_fat_goal_grams: z.number().nullable().openapi({ example: 70 }),
  daily_carbs_goal_grams: z.number().nullable().openapi({ example: 280 }),
  target_weight_grams: z.number().nullable().openapi({ example: 78000 }),
  target_weight_date: z.string().date().nullable().openapi({ example: "2026-06-01" }),
}).openapi("AdminUserGoals");

export const adminUserProfileBundleSchema = z.object({
  user: adminUserSummarySchema,
  profile: adminUserProfileSchema.nullable(),
  goals: adminUserGoalsSchema.nullable(),
  latestWeight: adminWeightLogSchema.nullable(),
  latestHeight: adminHeightLogSchema.nullable(),
  latestBloodPressure: adminBloodPressureLogSchema.nullable(),
  latestHeartRate: adminHeartRateLogSchema.nullable(),
}).openapi("AdminUserProfileBundle");

export const adminUsersResponseSchema =
  createPaginatedResponseSchema(adminUserSummarySchema);
export const adminMealsResponseSchema =
  createPaginatedResponseSchema(simpleMealResponseSchema);
export const adminSleepResponseSchema =
  createPaginatedResponseSchema(SleepEntrySchema);
export const adminWorkoutsResponseSchema =
  createPaginatedResponseSchema(z.any().openapi("AdminWorkoutListItem"));
export const adminWorkoutTemplatesResponseSchema =
  createPaginatedResponseSchema(
    z.any().openapi("AdminWorkoutTemplateListItem"),
  );

export const adminUserIdParamsSchema = z.object({
  id: z.string().openapi({ example: "user_123" }),
});

export const adminMealDetailSchema = fullMealResponseSchema.openapi(
  "AdminMealDetail",
);
