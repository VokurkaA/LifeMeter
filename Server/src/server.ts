import { OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "./auth";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import { logger } from "@/services/logger.service";
import { requestLogger } from "@/middleware/logger";
import { HTTPException } from "hono/http-exception";
import { upgradeWebSocket, websocket } from "hono/bun";
import { secureHeaders } from "hono/secure-headers";
 
export const app = new OpenAPIHono<{
  Variables: { user: AuthUser | null; session: AuthSession | null };
}>();

export { upgradeWebSocket };

app.use(secureHeaders());
app.use(trimTrailingSlash());
app.use(requestLogger);

app.onError((err, c) => {
  const status = err instanceof HTTPException ? err.status : 500;
  const logMethod = status >= 500 ? "error" : "warn";

  logger[logMethod](err.message || "Internal Server Error", {
    context: "Router",
    path: c.req.path,
    error: err,
  });

  return c.json(
    {
      error: err.message || "Internal Server Error",
    },
    status,
  );
});

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
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
          "http://127.0.0.1:3002",
          "exp://10.181.102.1:8080",
          "exp://10.181.102.1:8081",
        ];
        const allowed = new Set(
          (process.env.CORS_ORIGINS || fallback.join(","))
            .split(",")
            .map((s) => s.trim()),
        );
        return allowed.has(origin) ? origin : "";
      },
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      credentials: true,
      maxAge: 600,
    }),
  );
}

app.all("/api/auth/*", async (c) => {
  const headers = new Headers(c.req.raw.headers);
  const requestUrl = new URL(c.req.raw.url);

  if (!headers.get("origin")) {
    headers.set("origin", requestUrl.origin);
  }

  const req = new Request(c.req.raw.url, {
    method: c.req.raw.method,
    headers,
    body:
      c.req.raw.method === "GET" || c.req.raw.method === "HEAD"
        ? undefined
        : c.req.raw.body,
  });

  return auth.handler(req);
});

export function startServer(port = process.env.PORT) {
  logger.log(`Server listening on :${port}`, { context: "Server" });
  logger.log(`App running at http://localhost:${port}/api`, {
    context: "Server",
  });
  Bun.serve({
    port,
    fetch: app.fetch,
    websocket,
  });
}
