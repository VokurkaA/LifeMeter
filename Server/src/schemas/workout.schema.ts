import { z } from "@hono/zod-openapi";

export const exerciseSchema = z.object({
  id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  type: z.string().openapi({ example: "Bench Press" }),
  variant: z.string().openapi({ example: "Barbell" }),
}).openapi("Exercise");

export const weightUnitSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  name: z.string().openapi({ example: "kilogram" }),
  gram_conversion_factor: z.number().openapi({ example: 1000 }),
}).openapi("WeightUnit");

export const setStyleSchema = z.object({
  id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
  name: z.string().openapi({ example: "Straight" }),
}).openapi("SetStyle");

export const setTypeSchema = z.object({
  id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440002" }),
  name: z.string().openapi({ example: "Working" }),
}).openapi("SetType");
