
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { requireAuth } from "@/middleware/requireAuth";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import { userSleepRouter } from "@/routes/user/user.sleep.route";
import { userFoodRouter } from "@/routes/user/user.food.route";
import { userWorkoutRouter } from "@/routes/user/user.workout.route";
import { userProfileRouter } from "@/routes/user/user.profile.route";
import { userSchema } from "@/schemas/auth.schema";
import { userSyncRouter } from "@/routes/user/user.sync.route";

export const userRouter = new OpenAPIHono<{
  Variables: { user: AuthUser | null; session: AuthSession | null };
}>();

userRouter.use("*", requireAuth());

userRouter.route("/sleep", userSleepRouter);

userRouter.route("/food", userFoodRouter);

userRouter.route("/workout", userWorkoutRouter);

userRouter.route("/data", userProfileRouter);

userRouter.route("/sync", userSyncRouter);

const ErrorSchema = z.object({
  error: z.string(),
});

const getUserRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get current user profile",
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: "User profile",
      content: {
        "application/json": {
          schema: userSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

userRouter.openapi(getUserRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    // Should not happen because of requireAuth
    return c.json({ error: "Unauthorized" }, 401);
  }
  return c.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    banExpires: user.banExpires?.toISOString() || null,
    role: user.role || undefined,
  }, 200);
});
