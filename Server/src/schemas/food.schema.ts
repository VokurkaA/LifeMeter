import { z } from "@hono/zod-openapi";

export const foodSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  branded_food_id: z.number().int().nullable().openapi({ example: null }),
  food_category_id: z.number().int().nullable().openapi({ example: 1 }),
  description: z.string().openapi({ example: "Apple" }),
  brand_owner: z.string().optional().openapi({ example: "Farm Fresh" }),
  brand_name: z.string().optional().openapi({ example: "Farm Fresh" }),
  category_name: z.string().optional().openapi({ example: "Fruits" }),
}).openapi("Food");

export const foodCategorySchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  name: z.string().openapi({ example: "Fruits" }),
}).openapi("FoodCategory");

export const brandedFoodSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  brand_owner: z.string().optional().openapi({ example: "Farm Fresh" }),
  brand_name: z.string().optional().openapi({ example: "Farm Fresh" }),
  subbrand_name: z.string().optional().openapi({ example: "Apples" }),
  gtin_upc: z.string().optional().openapi({ example: "0123456789012" }),
  ingredients: z.string().optional().openapi({ example: "Apples" }),
}).openapi("BrandedFood");

export const portionSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  food_id: z.number().int().openapi({ example: 1 }),
  gram_weight: z.number().openapi({ example: 150 }),
  portion_amount: z.number().optional().openapi({ example: 1 }),
  portion_unit: z.string().optional().openapi({ example: "medium" }),
  modifier: z.string().optional().openapi({ example: "raw" }),
}).openapi("Portion");

export const completeNutrientSchema = z.object({
  food_id: z.number().int().openapi({ example: 1 }),
  name: z.string().openapi({ example: "Protein" }),
  unit: z.string().openapi({ example: "G" }),
  nutrient_nbr: z.number().openapi({ example: 203 }),
  amount: z.number().openapi({ example: 0.3 }),
}).openapi("CompleteNutrient");

export const foodDetailSchema = z.object({
  food: foodSchema,
  category: foodCategorySchema.nullable(),
  brandedFood: brandedFoodSchema.nullable(),
  portions: z.array(portionSchema),
  nutrients: z.array(completeNutrientSchema),
}).openapi("FoodDetail");
