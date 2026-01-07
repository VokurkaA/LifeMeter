import {z} from "zod";

export const updateProfileSchema = z.object({
    date_of_birth: z.string().date().optional().nullable(),
    sex: z.enum(['M', 'F']).optional().nullable(),
    current_activity_factor: z.number().min(0).optional(),
    current_bmr_calories: z.number().int().positive().optional().nullable(),
    default_weight_unit_id: z.number().int().optional().nullable(),
    default_length_unit_id: z.number().int().optional().nullable(),
    finished_onboarding: z.boolean(),
});

export const updateGoalSchema = z.object({
    daily_steps_goal: z.number().int().positive().optional().nullable(),
    bedtime_goal: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
    wakeup_goal: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
    daily_protein_goal_grams: z.number().int().positive().optional().nullable(),
    daily_fat_goal_grams: z.number().int().positive().optional().nullable(),
    daily_carbs_goal_grams: z.number().int().positive().optional().nullable(),
    target_weight_grams: z.number().positive().optional().nullable(),
    target_weight_date: z.string().date().optional().nullable(),
});

export const logWeightSchema = z.object({
    measured_at: z.string().datetime(),
    weight_grams: z.number().positive(),
    body_fat_percentage: z.number().min(0).max(100).nullable(),
    lean_tissue_percentage: z.number().min(0).max(100).nullable(),
    water_percentage: z.number().min(0).max(100).nullable(),
    bone_mass_percentage: z.number().min(0).max(100).nullable(),
});

export const logHeightSchema = z.object({
    measured_at: z.string().datetime(), height_cm: z.number().positive(),
});