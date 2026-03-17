import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import { userProfileService } from "@/services/user.profile.service";
import {
  logHeightSchema,
  logWeightSchema,
  updateGoalSchema,
  updateProfileSchema,
} from "@/schemas/user.profile.schema";

export const userProfileRouter = new OpenAPIHono<{
  Variables: { user: AuthUser; session: AuthSession };
}>();

const getActivityLevelsRoute = createRoute({
  method: "get",
  path: "/reference/activity-levels",
  summary: "Get activity level reference data",
  responses: {
    200: { 
      description: "Activity levels",
      content: {
        "application/json": { 
          schema: z.array(z.object({
            id: z.number().openapi({ example: 1 }),
            name: z.string().openapi({ example: "Sedentary" }),
            multiplier: z.number().openapi({ example: 1.2 })
          })) 
        }
      }
    },
    500: { description: "Internal server error" }
  },
});

const getLengthUnitsRoute = createRoute({
  method: "get",
  path: "/reference/length-units",
  summary: "Get length unit reference data",
  responses: {
    200: { 
      description: "Length units",
      content: {
        "application/json": { 
          schema: z.array(z.object({
            id: z.number().openapi({ example: 1 }),
            name: z.string().openapi({ example: "centimeter" }),
            abbreviation: z.string().openapi({ example: "cm" })
          }))
        }
      }
    },
    500: { description: "Internal server error" }
  },
});

const getWeightUnitsRoute = createRoute({
  method: "get",
  path: "/reference/weight-units",
  summary: "Get weight unit reference data",
  responses: {
    200: { 
      description: "Weight units",
      content: {
        "application/json": { 
          schema: z.array(z.object({
            id: z.number().openapi({ example: 1 }),
            name: z.string().openapi({ example: "kilogram" }),
            abbreviation: z.string().openapi({ example: "kg" })
          }))
        }
      }
    },
    500: { description: "Internal server error" }
  },
});

const getProfileRoute = createRoute({
  method: "get",
  path: "/profile",
  summary: "Get current user profile",
  responses: {
    200: { 
      description: "User profile",
      content: {
        "application/json": { schema: updateProfileSchema }
      }
    },
    500: { description: "Internal server error" }
  },
});

const updateProfileRoute = createRoute({
  method: "put",
  path: "/profile",
  summary: "Update current user profile",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateProfileSchema,
        },
      },
    },
  },
  responses: {
    200: { 
      description: "Profile updated",
      content: {
        "application/json": { schema: updateProfileSchema }
      }
    },
    400: { description: "Validation failed" },
    500: { description: "Internal server error" }
  },
});

const getGoalsRoute = createRoute({
  method: "get",
  path: "/goals",
  summary: "Get user goals",
  responses: {
    200: { 
      description: "User goals",
      content: {
        "application/json": { schema: updateGoalSchema }
      }
    },
    500: { description: "Internal server error" }
  },
});

const updateGoalsRoute = createRoute({
  method: "put",
  path: "/goals",
  summary: "Update user goals",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateGoalSchema,
        },
      },
    },
  },
  responses: {
    200: { 
      description: "Goals updated",
      content: {
        "application/json": { schema: updateGoalSchema }
      }
    },
    400: { description: "Validation failed" },
    500: { description: "Internal server error" }
  },
});

const logWeightRoute = createRoute({
  method: "post",
  path: "/log/weight",
  summary: "Log body weight",
  request: {
    body: {
      content: {
        "application/json": {
          schema: logWeightSchema,
        },
      },
    },
  },
  responses: {
    201: { 
      description: "Weight logged",
      content: {
        "application/json": { schema: logWeightSchema }
      }
    },
    400: { description: "Validation failed" },
    500: { description: "Internal server error" }
  },
});

const getLatestWeightRoute = createRoute({
  method: "get",
  path: "/log/weight/latest",
  summary: "Get latest weight log",
  responses: {
    200: { 
      description: "Latest weight log",
      content: {
        "application/json": { schema: logWeightSchema }
      }
    },
    500: { description: "Internal server error" }
  },
});

const logHeightRoute = createRoute({
  method: "post",
  path: "/log/height",
  summary: "Log height",
  request: {
    body: {
      content: {
        "application/json": {
          schema: logHeightSchema,
        },
      },
    },
  },
  responses: {
    201: { 
      description: "Height logged",
      content: {
        "application/json": { schema: logHeightSchema }
      }
    },
    400: { description: "Validation failed" },
    500: { description: "Internal server error" }
  },
});

userProfileRouter.openapi(getActivityLevelsRoute, async (c) => {
  const levels = await userProfileService.getActivityLevels();
  return c.json(levels, 200);
});

userProfileRouter.openapi(getLengthUnitsRoute, async (c) => {
  const units = await userProfileService.getLengthUnits();
  return c.json(units, 200);
});

userProfileRouter.openapi(getWeightUnitsRoute, async (c) => {
  const units = await userProfileService.getWeightUnits();
  return c.json(units, 200);
});

userProfileRouter.openapi(getProfileRoute, async (c) => {
  const user = c.get("user");
  const profile = await userProfileService.getProfile(user.id);
  if (!profile) return c.json({ error: "Profile not found" }, 404);
  return c.json(profile, 200);
});

userProfileRouter.openapi(updateProfileRoute, async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");
  const updated = await userProfileService.upsertProfile(user.id, data);
  return c.json(updated, 200);
});

userProfileRouter.openapi(getGoalsRoute, async (c) => {
  const user = c.get("user");
  const goals = await userProfileService.getGoals(user.id);
  return c.json(goals || {}, 200);
});

userProfileRouter.openapi(updateGoalsRoute, async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");
  const updated = await userProfileService.upsertGoals(user.id, data);
  return c.json(updated, 200);
});

userProfileRouter.openapi(logWeightRoute, async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");
  const log = await userProfileService.logWeight(user.id, data);
  return c.json(log, 201);
});

userProfileRouter.openapi(getLatestWeightRoute, async (c) => {
  const user = c.get("user");
  const log = await userProfileService.getLatestWeight(user.id);
  return c.json(log, 200);
});

userProfileRouter.openapi(logHeightRoute, async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");
  const log = await userProfileService.logHeight(user.id, data);
  return c.json(log, 201);
});
