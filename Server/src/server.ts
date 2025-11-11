import { Hono } from "hono";
import { auth } from "./auth";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import type { AuthSession, AuthUser } from "@/types/auth.types";

export const app = new Hono<{
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
}>();

app.use(trimTrailingSlash());

app.use("*", async (c: any, next: any) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

if (process.env.USE_CORS == "true") {
  app.use(
    "/api/*",
    cors({
      origin: (origin: string) => {
        if (!origin) return "";
        const fallback = [
          "https://localhost:3000",
          "https://localhost:3001",
          "exp://10.181.102.1:8080",
          "exp://10.181.102.1:8081",
        ];
        const allowed = new Set(
          (process.env.CORS_ORIGINS || fallback.join(","))
            .split(",")
            .map((s) => s.trim())
        );
        return allowed.has(origin) ? origin : "";
      },
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      credentials: true,
      maxAge: 600,
    })
  );
}

app.on(["POST", "GET"], "/api/auth/*", (c: { req: { raw: any } }) => {
  return auth.handler(c.req.raw);
});

export function startServer(port = process.env.PORT) {
  console.log(`Server listening on :${port}`);
  console.log(`App running at https://localhost:${port}/api`);
  Bun.serve({
    port,
    fetch: app.fetch,
  });
}
