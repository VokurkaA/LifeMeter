import { z } from "@hono/zod-openapi";

export const templateSetSchema = z.object({
    exercise_id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    seq_number: z.number().int().openapi({ example: 1 }),
    repetitions: z.number().int().nullable().optional().openapi({ example: 10 }),
    rir: z.number().int().nullable().optional().openapi({ example: 2 }),
    rest_time: z.string().nullable().optional().openapi({ example: "00:01:30" }),
    notes: z.string().nullable().optional().openapi({ example: "Focus on form" }),
    style_id: z.string().uuid().nullable().optional().openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
    set_type_id: z.string().uuid().nullable().optional().openapi({ example: "550e8400-e29b-41d4-a716-446655440002" }),
}).openapi("TemplateSet");

export const workoutTemplateBodySchema = z.object({
    name: z.string().min(1).openapi({ example: "Chest Day" }),
    description: z.string().nullable().optional().openapi({ example: "Focus on upper chest" }),
    label: z.array(z.string()).nullable().optional().openapi({ example: ["Push", "Hypertrophy"] }),
    sets: z.array(templateSetSchema).default([])
}).openapi("WorkoutTemplateBody");

export const workoutTemplateSchema = workoutTemplateBodySchema.extend({
    id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440003" }),
    user_id: z.string().openapi({ example: "user_123" }),
}).openapi("WorkoutTemplate");

export const workoutTemplateUpdateSchema = workoutTemplateBodySchema.partial().openapi("WorkoutTemplateUpdate");

export const workoutSetSchema = z.object({
    exercise_id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    seq_number: z.number().int().openapi({ example: 1 }),
    weight: z.number().nullable().optional().openapi({ example: 60.5 }),
    weight_unit_id: z.number().int().nullable().optional().openapi({ example: 1 }),
    repetitions: z.number().int().openapi({ example: 10 }),
    rir: z.number().int().nullable().optional().openapi({ example: 2 }),
    rest_time: z.string().nullable().optional().openapi({ example: "00:01:30" }),
    notes: z.string().nullable().optional().openapi({ example: "Good set" }),
    style_id: z.string().uuid().nullable().optional().openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
    set_type_id: z.string().uuid().nullable().optional().openapi({ example: "550e8400-e29b-41d4-a716-446655440002" }),
}).openapi("WorkoutSet");

export const workoutBodySchema = z.object({
    workout_template_id: z.string().uuid().nullable().optional().openapi({ example: "550e8400-e29b-41d4-a716-446655440003" }),
    start_date: z.string().datetime().optional().openapi({ example: "2023-10-01T10:00:00Z" }),
    end_date: z.string().datetime().nullable().optional().openapi({ example: "2023-10-01T11:00:00Z" }),
    label: z.array(z.string()).nullable().optional().openapi({ example: ["Morning session"] }),
    notes: z.string().nullable().optional().openapi({ example: "Strong workout" }),
    sets: z.array(workoutSetSchema).default([])
}).openapi("WorkoutBody");

export const workoutSchema = workoutBodySchema.extend({
    id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440004" }),
    user_id: z.string().openapi({ example: "user_123" }),
}).openapi("Workout");

export const workoutUpdateSchema = workoutBodySchema.partial().openapi("WorkoutUpdate");
