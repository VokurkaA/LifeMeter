import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import {
  getPagination,
  makePaginationResult,
  pagination,
} from "@/middleware/pagination";
import { workoutService } from "@/services/workout.service";
import {
  workoutBodySchema,
  workoutTemplateBodySchema,
  workoutTemplateUpdateSchema,
  workoutUpdateSchema,
  workoutTemplateSchema,
  workoutSchema,
} from "@/schemas/user.workout.schema";
import type { PaginationProps } from "@/types/pagination.types";
import { createLogger } from "@/services/logger.service";
import { paginationQuerySchema, createPaginatedResponseSchema } from "@/schemas/pagination.schema";

export const userWorkoutRouter = new OpenAPIHono<{
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
    pagination: PaginationProps;
  };
}>();

const log = createLogger("User Workout Route");

userWorkoutRouter.use("*", pagination());

const createTemplateRoute = createRoute({
  method: "post",
  path: "/template",
  summary: "Create a workout template",
  request: {
    body: {
      content: {
        "application/json": {
          schema: workoutTemplateBodySchema,
        },
      },
    },
  },
  responses: {
    201: { 
      description: "Template created",
      content: {
        "application/json": {
          schema: workoutTemplateSchema
        }
      }
    },
    400: { description: "Validation failed" },
    500: { description: "Internal server error" }
  },
});

const getAllTemplatesRoute = createRoute({
  method: "get",
  path: "/template",
  summary: "Get all workout templates",
  request: {
    query: paginationQuerySchema,
  },
  responses: {
    200: { 
      description: "List of templates",
      content: {
        "application/json": {
          schema: createPaginatedResponseSchema(workoutTemplateSchema)
        }
      }
    },
    500: { description: "Internal server error" }
  },
});

const getTemplateByIdRoute = createRoute({
  method: "get",
  path: "/template/{id}",
  summary: "Get a workout template by ID",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    200: { 
      description: "Template details",
      content: {
        "application/json": {
          schema: workoutTemplateSchema
        }
      }
    },
    404: { description: "Template not found" },
    500: { description: "Internal server error" }
  },
});

const updateTemplateRoute = createRoute({
  method: "patch",
  path: "/template/{id}",
  summary: "Update a workout template",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: workoutTemplateUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: { 
      description: "Template updated",
      content: {
        "application/json": {
          schema: workoutTemplateSchema
        }
      }
    },
    400: { description: "Validation failed" },
    404: { description: "Template not found" },
    500: { description: "Internal server error" }
  },
});

const deleteTemplateRoute = createRoute({
  method: "delete",
  path: "/template/{id}",
  summary: "Delete a workout template",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    204: { description: "Template deleted" },
    404: { description: "Template not found" },
    500: { description: "Internal server error" }
  },
});

const getAllWorkoutsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get all user workouts",
  request: {
    query: paginationQuerySchema,
  },
  responses: {
    200: { 
      description: "List of workouts",
      content: {
        "application/json": {
          schema: createPaginatedResponseSchema(workoutSchema)
        }
      }
    },
    500: { description: "Internal server error" }
  },
});

const createWorkoutRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Log a new workout",
  request: {
    body: {
      content: {
        "application/json": {
          schema: workoutBodySchema,
        },
      },
    },
  },
  responses: {
    201: { 
      description: "Workout logged",
      content: {
        "application/json": {
          schema: workoutSchema
        }
      }
    },
    400: { description: "Validation failed" },
    500: { description: "Internal server error" }
  },
});

const getWorkoutByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  summary: "Get a workout by ID",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    200: { 
      description: "Workout details",
      content: {
        "application/json": {
          schema: workoutSchema
        }
      }
    },
    404: { description: "Workout not found" },
    500: { description: "Internal server error" }
  },
});

const updateWorkoutRoute = createRoute({
  method: "patch",
  path: "/{id}",
  summary: "Update a workout log",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: workoutUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: { 
      description: "Workout updated",
      content: {
        "application/json": {
          schema: workoutSchema
        }
      }
    },
    400: { description: "Validation failed" },
    404: { description: "Workout not found" },
    500: { description: "Internal server error" }
  },
});

const deleteWorkoutRoute = createRoute({
  method: "delete",
  path: "/{id}",
  summary: "Delete a workout log",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    204: { description: "Workout deleted" },
    404: { description: "Workout not found" },
    500: { description: "Internal server error" }
  },
});

userWorkoutRouter.openapi(createTemplateRoute, async (c) => {
  const user = c.get("user")!;
  const data = c.req.valid("json");
  try {
    const result = await workoutService.addUserWorkoutTemplate(user.id, data);
    return c.json(result, 201);
  } catch (e: any) {
    log.error("Error creating workout template", { error: e });
    return c.json({ error: e?.message || "Failed to create workout template" }, 500);
  }
});

userWorkoutRouter.openapi(getAllTemplatesRoute, async (c) => {
  const user = c.get("user")!;
  const paginationProps = getPagination(c);
  try {
    const { rows, total } = await workoutService.getAllUserWorkoutTemplates(user.id, paginationProps);
    return c.json({ rows, total, pagination: makePaginationResult(total, c) }, 200);
  } catch (e: any) {
    log.error("Error fetching workout templates", { error: e });
    return c.json({ error: e?.message || "Failed to fetch templates" }, 500);
  }
});

userWorkoutRouter.openapi(getTemplateByIdRoute, async (c) => {
  const user = c.get("user")!;
  const { id } = c.req.valid("param");
  try {
    const result = await workoutService.getUserWorkoutTemplateById(user.id, id);
    return c.json(result, 200);
  } catch (e: any) {
    const msg = e?.message || "Template not found";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) log.error(`Error fetching workout template ${id}`, { error: e });
    return c.json({ error: msg }, status);
  }
});

userWorkoutRouter.openapi(updateTemplateRoute, async (c) => {
  const user = c.get("user")!;
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  try {
    const result = await workoutService.updateUserWorkoutTemplate(user.id, id, data);
    return c.json(result, 200);
  } catch (e: any) {
    const msg = e?.message || "Failed to update template";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) log.error(`Error updating workout template ${id}`, { error: e });
    return c.json({ error: msg }, status);
  }
});

userWorkoutRouter.openapi(deleteTemplateRoute, async (c) => {
  const user = c.get("user")!;
  const { id } = c.req.valid("param");
  try {
    await workoutService.deleteUserWorkoutTemplate(user.id, id);
    return c.body(null, 204);
  } catch (e: any) {
    const msg = e?.message || "Failed to delete template";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) log.error(`Error deleting workout template ${id}`, { error: e });
    return c.json({ error: msg }, status);
  }
});

userWorkoutRouter.openapi(getAllWorkoutsRoute, async (c) => {
  const user = c.get("user")!;
  const paginationProps = getPagination(c);
  try {
    const { rows, total } = await workoutService.getAllUserWorkouts(user.id, paginationProps);
    return c.json({ rows, total, pagination: makePaginationResult(total, c) }, 200);
  } catch (e: any) {
    log.error("Error fetching workouts", { error: e });
    return c.json({ error: e?.message || "Failed to fetch workouts" }, 500);
  }
});

userWorkoutRouter.openapi(createWorkoutRoute, async (c) => {
  const user = c.get("user")!;
  const data = c.req.valid("json");
  const start_date = data.start_date || new Date().toISOString();
  try {
    const result = await workoutService.addUserWorkout(user.id, { ...data, start_date });
    return c.json(result, 201);
  } catch (e: any) {
    log.error("Error creating workout", { error: e });
    return c.json({ error: e?.message || "Failed to create workout" }, 500);
  }
});

userWorkoutRouter.openapi(getWorkoutByIdRoute, async (c) => {
  const user = c.get("user")!;
  const { id } = c.req.valid("param");
  try {
    const result = await workoutService.getUserWorkoutById(user.id, id);
    return c.json(result, 200);
  } catch (e: any) {
    const msg = e?.message || "Workout not found";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) log.error(`Error fetching workout ${id}`, { error: e });
    return c.json({ error: msg }, status);
  }
});

userWorkoutRouter.openapi(updateWorkoutRoute, async (c) => {
  const user = c.get("user")!;
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  try {
    const result = await workoutService.updateUserWorkout(user.id, id, data);
    return c.json(result, 200);
  } catch (e: any) {
    const msg = e?.message || "Failed to update workout";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) log.error(`Error updating workout ${id}`, { error: e });
    return c.json({ error: msg }, status);
  }
});

userWorkoutRouter.openapi(deleteWorkoutRoute, async (c) => {
  const user = c.get("user")!;
  const { id } = c.req.valid("param");
  try {
    await workoutService.deleteUserWorkout(user.id, id);
    return c.body(null, 204);
  } catch (e: any) {
    const msg = e?.message || "Failed to delete workout";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) log.error(`Error deleting workout ${id}`, { error: e });
    return c.json({ error: msg }, status);
  }
});
