import { z } from "@hono/zod-openapi";

export const updateProfileSchema = z.object({
    date_of_birth: z.string().date().optional().nullable().openapi({ example: "1990-01-01" }),
    sex: z.enum(['M', 'F']).optional().nullable().openapi({ example: "M" }),
    current_activity_factor: z.number().min(0).optional().openapi({ example: 1.2 }),
    current_bmr_calories: z.number().int().positive().optional().nullable().openapi({ example: 2000 }),
    default_weight_unit_id: z.number().int().optional().nullable().openapi({ example: 1 }),
    default_length_unit_id: z.number().int().optional().nullable().openapi({ example: 1 }),
    finished_onboarding: z.boolean().openapi({ example: true }),
}).openapi("UpdateProfile");

export const updateGoalSchema = z.object({
    daily_steps_goal: z.number().int().positive().optional().nullable().openapi({ example: 10000 }),
    bedtime_goal: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable().openapi({ example: "22:00:00" }),
    wakeup_goal: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable().openapi({ example: "06:00:00" }),
    daily_protein_goal_grams: z.number().int().positive().optional().nullable().openapi({ example: 150 }),
    daily_fat_goal_grams: z.number().int().positive().optional().nullable().openapi({ example: 70 }),
    daily_carbs_goal_grams: z.number().int().positive().optional().nullable().openapi({ example: 300 }),
    target_weight_grams: z.number().positive().optional().nullable().openapi({ example: 80000 }),
    target_weight_date: z.string().date().optional().nullable().openapi({ example: "2024-01-01" }),
}).openapi("UpdateGoal");

export const logWeightSchema = z.object({
    measured_at: z.string().datetime().openapi({ example: "2023-10-01T08:00:00Z" }),
    weight_grams: z.number().positive().openapi({ example: 85000 }),
    body_fat_percentage: z.number().min(0).max(100).nullable().openapi({ example: 15.5 }),
    lean_tissue_percentage: z.number().min(0).max(100).nullable().openapi({ example: 80.0 }),
    water_percentage: z.number().min(0).max(100).nullable().openapi({ example: 60.0 }),
    bone_mass_percentage: z.number().min(0).max(100).nullable().openapi({ example: 4.5 }),
}).openapi("LogWeight");

export const logHeightSchema = z.object({
    measured_at: z.string().datetime().openapi({ example: "2023-10-01T08:00:00Z" }),
    height_cm: z.number().positive().openapi({ example: 180.5 }),
}).openapi("LogHeight");
