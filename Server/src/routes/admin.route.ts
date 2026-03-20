import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { requireAdmin } from "@/middleware/requireAdmin";
import {
  getPagination,
  makePaginationResult,
  pagination,
} from "@/middleware/pagination";
import {
  adminMealsResponseSchema,
  adminOverviewSchema,
  adminSleepResponseSchema,
  adminUserFilterSchema,
  adminUserIdParamsSchema,
  adminUserProfileBundleSchema,
  adminUsersResponseSchema,
  adminWorkoutsResponseSchema,
  adminWorkoutTemplatesResponseSchema,
} from "@/schemas/admin.schema";
import { adminService } from "@/services/admin.service";
import { createLogger } from "@/services/logger.service";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import type { PaginationProps } from "@/types/pagination.types";

export const adminRouter = new OpenAPIHono<{
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
    pagination: PaginationProps;
  };
}>();

const log = createLogger("Admin Route");
const ErrorSchema = z.object({ error: z.string() });

adminRouter.use("*", requireAdmin());
adminRouter.use("*", pagination());

const overviewRoute = createRoute({
  method: "get",
  path: "/overview",
  summary: "Get top-level admin metrics",
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: "Overview metrics",
      content: { "application/json": { schema: adminOverviewSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const usersRoute = createRoute({
  method: "get",
  path: "/users",
  summary: "List users for admin inspection",
  security: [{ cookieAuth: [] }],
  request: {
    query: adminUserFilterSchema,
  },
  responses: {
    200: {
      description: "Paginated users",
      content: { "application/json": { schema: adminUsersResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const userRoute = createRoute({
  method: "get",
  path: "/users/{id}",
  summary: "Get a single user summary",
  security: [{ cookieAuth: [] }],
  request: { params: adminUserIdParamsSchema },
  responses: {
    200: {
      description: "User summary",
      content: {
        "application/json": { schema: adminUserProfileBundleSchema.shape.user },
      },
    },
    404: {
      description: "User not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const userProfileRoute = createRoute({
  method: "get",
  path: "/users/{id}/profile",
  summary: "Get a user profile bundle",
  security: [{ cookieAuth: [] }],
  request: { params: adminUserIdParamsSchema },
  responses: {
    200: {
      description: "User profile bundle",
      content: {
        "application/json": { schema: adminUserProfileBundleSchema },
      },
    },
    404: {
      description: "User not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const userMealsRoute = createRoute({
  method: "get",
  path: "/users/{id}/meals",
  summary: "Get recent user meals",
  security: [{ cookieAuth: [] }],
  request: {
    params: adminUserIdParamsSchema,
    query: adminUserFilterSchema.omit({ q: true }),
  },
  responses: {
    200: {
      description: "Paginated user meals",
      content: { "application/json": { schema: adminMealsResponseSchema } },
    },
    404: {
      description: "User or meals not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const userSleepRoute = createRoute({
  method: "get",
  path: "/users/{id}/sleep",
  summary: "Get recent user sleep entries",
  security: [{ cookieAuth: [] }],
  request: {
    params: adminUserIdParamsSchema,
    query: adminUserFilterSchema.omit({ q: true }),
  },
  responses: {
    200: {
      description: "Paginated user sleep entries",
      content: { "application/json": { schema: adminSleepResponseSchema } },
    },
    404: {
      description: "User or sleep entries not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const userWorkoutsRoute = createRoute({
  method: "get",
  path: "/users/{id}/workouts",
  summary: "Get recent user workouts",
  security: [{ cookieAuth: [] }],
  request: {
    params: adminUserIdParamsSchema,
    query: adminUserFilterSchema.omit({ q: true }),
  },
  responses: {
    200: {
      description: "Paginated user workouts",
      content: { "application/json": { schema: adminWorkoutsResponseSchema } },
    },
    404: {
      description: "User or workouts not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

const userWorkoutTemplatesRoute = createRoute({
  method: "get",
  path: "/users/{id}/workout-templates",
  summary: "Get recent user workout templates",
  security: [{ cookieAuth: [] }],
  request: {
    params: adminUserIdParamsSchema,
    query: adminUserFilterSchema.omit({ q: true }),
  },
  responses: {
    200: {
      description: "Paginated user workout templates",
      content: {
        "application/json": { schema: adminWorkoutTemplatesResponseSchema },
      },
    },
    404: {
      description: "User or workout templates not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

adminRouter.openapi(overviewRoute, async (c) => {
  try {
    return c.json(await adminService.getOverview(), 200);
  } catch (error) {
    log.error("Failed to load admin overview", { error });
    return c.json({ error: "Failed to load overview" }, 500);
  }
});

adminRouter.openapi(usersRoute, async (c) => {
  try {
    const paginationProps = getPagination(c);
    const { q } = c.req.valid("query");
    const { rows, total } = await adminService.getUsers(paginationProps, q);
    return c.json(
      { rows, total, pagination: makePaginationResult(total, c) },
      200,
    );
  } catch (error) {
    log.error("Failed to load admin users", { error });
    return c.json({ error: "Failed to load users" }, 500);
  }
});

adminRouter.openapi(userRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    return c.json(await adminService.getUserById(id), 200);
  } catch (error: any) {
    const message = error?.message || "Failed to load user";
    const status = /not found/i.test(message) ? 404 : 500;
    if (status === 500) {
      log.error("Failed to load admin user", { error });
    }
    return c.json({ error: message }, status);
  }
});

adminRouter.openapi(userProfileRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    return c.json(await adminService.getUserProfileBundle(id), 200);
  } catch (error: any) {
    const message = error?.message || "Failed to load user profile";
    const status = /not found/i.test(message) ? 404 : 500;
    if (status === 500) {
      log.error("Failed to load admin user profile bundle", { error });
    }
    return c.json({ error: message }, status);
  }
});

adminRouter.openapi(userMealsRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const paginationProps = getPagination(c);
    const { rows, total } = await adminService.getUserMeals(id, paginationProps);
    return c.json(
      { rows, total, pagination: makePaginationResult(total, c) },
      200,
    );
  } catch (error: any) {
    const message = error?.message || "Failed to load user meals";
    const status = /not found/i.test(message) ? 404 : 500;
    if (status === 500) {
      log.error("Failed to load admin user meals", { error });
    }
    return c.json({ error: message }, status);
  }
});

adminRouter.openapi(userSleepRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const paginationProps = getPagination(c);
    const { rows, total } = await adminService.getUserSleepEntries(
      id,
      paginationProps,
    );
    return c.json(
      { rows, total, pagination: makePaginationResult(total, c) },
      200,
    );
  } catch (error: any) {
    const message = error?.message || "Failed to load user sleep entries";
    const status = /not found/i.test(message) ? 404 : 500;
    if (status === 500) {
      log.error("Failed to load admin user sleep entries", { error });
    }
    return c.json({ error: message }, status);
  }
});

adminRouter.openapi(userWorkoutsRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const paginationProps = getPagination(c);
    const { rows, total } = await adminService.getUserWorkouts(
      id,
      paginationProps,
    );
    return c.json(
      { rows, total, pagination: makePaginationResult(total, c) },
      200,
    );
  } catch (error: any) {
    const message = error?.message || "Failed to load user workouts";
    const status = /not found/i.test(message) ? 404 : 500;
    if (status === 500) {
      log.error("Failed to load admin user workouts", { error });
    }
    return c.json({ error: message }, status);
  }
});

adminRouter.openapi(userWorkoutTemplatesRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const paginationProps = getPagination(c);
    const { rows, total } = await adminService.getUserWorkoutTemplates(
      id,
      paginationProps,
    );
    return c.json(
      { rows, total, pagination: makePaginationResult(total, c) },
      200,
    );
  } catch (error: any) {
    const message = error?.message || "Failed to load user workout templates";
    const status = /not found/i.test(message) ? 404 : 500;
    if (status === 500) {
      log.error("Failed to load admin user workout templates", { error });
    }
    return c.json({ error: message }, status);
  }
});
