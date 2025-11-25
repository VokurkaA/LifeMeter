import { z } from "zod";

const mealItemSchema = z.object({
    food_id: z.number().int().positive(),
    total_grams: z.number().positive(),
    quantity: z.number().positive().optional(),
    portion_id: z.number().int().positive().optional().nullable(),
    description: z.string().trim().min(1).optional().nullable()
});

const mealBodySchema = z.object({
    name: z.string().trim().min(1),
    eaten_at: z.string().datetime({ offset: true }).optional(),
    items: z.array(mealItemSchema).min(1, "At least one item is required")
});

const mealUpdateSchema = z.object({
    name: z.string().trim().min(1).optional(),
    eaten_at: z.string().datetime().optional(),
    items: z.array(mealItemSchema).optional()
});

export { mealBodySchema, mealItemSchema, mealUpdateSchema };