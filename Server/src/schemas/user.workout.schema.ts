import {z} from "zod";

export const templateSetSchema = z.object({
    exercise_id: z.string().uuid(),
    seq_number: z.number().int(),
    repetitions: z.number().int().nullable().optional(),
    rir: z.number().int().nullable().optional(),
    rest_time: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    style_id: z.string().uuid().nullable().optional(),
    set_type_id: z.string().uuid().nullable().optional(),
});

export const workoutTemplateBodySchema = z.object({
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    label: z.array(z.string()).nullable().optional(),
    sets: z.array(templateSetSchema).default([])
});

export const workoutTemplateUpdateSchema = workoutTemplateBodySchema.partial();

export const workoutSetSchema = z.object({
    exercise_id: z.string().uuid(),
    seq_number: z.number().int(),
    weight: z.number().nullable().optional(),
    weight_unit_id: z.number().int().nullable().optional(),
    repetitions: z.number().int(),
    rir: z.number().int().nullable().optional(),
    rest_time: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    style_id: z.string().uuid().nullable().optional(),
    set_type_id: z.string().uuid().nullable().optional(),
});

export const workoutBodySchema = z.object({
    workout_template_id: z.string().uuid().nullable().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().nullable().optional(),
    label: z.array(z.string()).nullable().optional(),
    notes: z.string().nullable().optional(),
    sets: z.array(workoutSetSchema).default([])
});

export const workoutUpdateSchema = workoutBodySchema.partial();