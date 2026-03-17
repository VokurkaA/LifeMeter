import { z } from "@hono/zod-openapi";
import { foodDetailSchema } from "./food.schema";

const mealItemSchema = z.object({
    food_id: z.number().int().positive().openapi({ example: 1 }),
    total_grams: z.number().positive().openapi({ example: 100 }),
    quantity: z.number().positive().optional().openapi({ example: 1 }),
    portion_id: z.number().int().positive().optional().nullable().openapi({ example: 1 }),
    description: z.string().trim().min(1).optional().nullable().openapi({ example: "Large apple" })
}).openapi("MealItem");

const mealBodySchema = z.object({
    name: z.string().trim().min(1).openapi({ example: "Lunch" }),
    eaten_at: z.string().datetime({ offset: true }).default(() => new Date().toISOString()).openapi({ example: "2023-10-01T12:00:00Z" }),
    items: z.array(mealItemSchema).min(1, "At least one item is required")
}).openapi("MealBody");

const mealUpdateSchema = z.object({
    name: z.string().trim().min(1).optional().openapi({ example: "Updated Lunch" }),
    eaten_at: z.string().datetime().optional().openapi({ example: "2023-10-01T12:30:00Z" }),
    items: z.array(mealItemSchema).optional()
}).openapi("MealUpdate");

const userMealSchema = z.object({
    id: z.string().openapi({ example: "meal_123" }),
    user_id: z.string().openapi({ example: "user_123" }),
    eaten_at: z.string().openapi({ example: "2023-10-01T12:00:00Z" }),
    name: z.string().openapi({ example: "Lunch" }),
});

const userFoodSchema = z.object({
    id: z.string().openapi({ example: "item_123" }),
    user_meal_id: z.string().openapi({ example: "meal_123" }),
    food_id: z.number().int().openapi({ example: 1 }),
    total_grams: z.number().openapi({ example: 100 }),
    quantity: z.number().openapi({ example: 1 }),
    portion_id: z.number().int().nullable().optional().openapi({ example: 1 }),
    description: z.string().nullable().optional().openapi({ example: "Large apple" }),
});

const fullMealResponseSchema = z.object({
    userMeal: userMealSchema,
    userFoods: z.array(z.object({
        userFood: userFoodSchema,
        foodDetail: foodDetailSchema
    })),
}).openapi("FullMealResponse");

const simpleMealResponseSchema = z.object({
    userMeal: userMealSchema,
    userFoods: z.array(userFoodSchema),
}).openapi("SimpleMealResponse");

export { mealBodySchema, mealItemSchema, mealUpdateSchema, fullMealResponseSchema, simpleMealResponseSchema };
