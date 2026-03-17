import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import { workoutService } from "@/services/workout.service";
import { createLogger } from "@/services/logger.service";
import { exerciseSchema, weightUnitSchema, setStyleSchema, setTypeSchema } from "@/schemas/workout.schema";

export const workoutRouter = new OpenAPIHono<{
  Variables: { user: AuthUser | null; session: AuthSession | null };
}>();

const log = createLogger("Workout Route");

const ErrorSchema = z.object({
  error: z.string(),
});

const getExercisesRoute = createRoute({
  method: "get",
  path: "/exercises",
  summary: "Get list of all exercises",
  responses: {
    200: { 
      description: "List of exercises",
      content: {
        "application/json": {
          schema: z.array(exerciseSchema),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

const getWeightOptionsRoute = createRoute({
  method: "get",
  path: "/weight-options",
  summary: "Get available weight units and options",
  responses: {
    200: { 
      description: "Weight options",
      content: {
        "application/json": {
          schema: z.array(weightUnitSchema),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

const getSetStylesRoute = createRoute({
  method: "get",
  path: "/set-styles",
  summary: "Get available workout set styles (e.g., straight, superset)",
  responses: {
    200: { 
      description: "Set styles",
      content: {
        "application/json": {
          schema: z.array(setStyleSchema),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

const getSetTypesRoute = createRoute({
  method: "get",
  path: "/set-types",
  summary: "Get available workout set types (e.g., warm-up, working)",
  responses: {
    200: { 
      description: "Set types",
      content: {
        "application/json": {
          schema: z.array(setTypeSchema),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

workoutRouter.openapi(getExercisesRoute, async (c) => {
  try {
    const result = await workoutService.getExercises();
    return c.json(result, 200);
  } catch (e: any) {
    log.error("Error fetching exercises", { error: e });
    return c.json({ error: "Failed to fetch exercises" }, 500);
  }
});

workoutRouter.openapi(getWeightOptionsRoute, async (c) => {
  try {
    const result = await workoutService.getWeightOptions();
    return c.json(result, 200);
  } catch (e: any) {
    log.error("Error fetching weight options", { error: e });
    return c.json({ error: "Failed to fetch weight options" }, 500);
  }
});

workoutRouter.openapi(getSetStylesRoute, async (c) => {
  try {
    const result = await workoutService.getSetStyles();
    return c.json(result, 200);
  } catch (e: any) {
    log.error("Error fetching set styles", { error: e });
    return c.json({ error: "Failed to fetch set styles" }, 500);
  }
});

workoutRouter.openapi(getSetTypesRoute, async (c) => {
  try {
    const result = await workoutService.getSetTypes();
    return c.json(result, 200);
  } catch (e: any) {
    log.error("Error fetching set types", { error: e });
    return c.json({ error: "Failed to fetch set types" }, 500);
  }
});
