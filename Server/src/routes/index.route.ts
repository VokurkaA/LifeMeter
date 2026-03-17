import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { foodRouter } from "./food.route";
import { userRouter } from "@/routes/user/user.route";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import { workoutRouter } from "@/routes/workout.route";
import { logsRouter } from "./logs.route";
import { swaggerUI } from "@hono/swagger-ui";

export const router = new OpenAPIHono<{
  Variables: { user: AuthUser | null; session: AuthSession | null };
}>();

router.openAPIRegistry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "better-auth.session_token",
});

router.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "LifeMeter API",
    version: "1.0.0",
  },
  servers: [
    {
      url: "/api",
      description: "Main API",
    },
  ],
});

router.get("/ui", swaggerUI({ url: "/api/doc" }));

const healthCheckRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Health check",
  responses: {
    200: {
      description: "API is healthy",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "ok" }),
            timestamp: z.string().openapi({ example: "2023-10-01T12:00:00Z" }),
            message: z.string().openapi({ example: "API is healthy" }),
          }),
        },
      },
    },
  },
});

router.openapi(healthCheckRoute, (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString(), message: "API is healthy" }, 200);
});

router.route("/food", foodRouter);
router.route("/user", userRouter);
router.route("/workout", workoutRouter);
router.route("/logs", logsRouter);
