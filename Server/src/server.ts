import {Hono} from "hono";
import {auth} from "./auth";
import {cors} from "hono/cors";
import {trimTrailingSlash} from "hono/trailing-slash";
import type {AuthSession, AuthUser} from "@/types/auth.types";
import {logger} from "@/services/logger.service";
import {requestLogger} from "@/middleware/logger";

export const app = new Hono<{
    Variables: {
        user: AuthUser | null; session: AuthSession | null;
    };
}>();

app.use(trimTrailingSlash());
app.use(requestLogger);

app.use("*", async (c: any, next: any) => {
    const session = await auth.api.getSession({headers: c.req.raw.headers});

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
    app.use("/api/*", cors({
        origin: (origin: string) => {
            if (!origin) return "";
            const fallback = ["http://localhost:3000", "http://localhost:3001", "exp://10.181.102.1:8080", "exp://10.181.102.1:8081",];
            const allowed = new Set((process.env.CORS_ORIGINS || fallback.join(","))
                .split(",")
                .map((s) => s.trim()));
            return allowed.has(origin) ? origin : "";
        },
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        exposeHeaders: ["Content-Length"],
        credentials: true,
        maxAge: 600,
    }));
}

app.all("/api/auth/*", async (c) => {
    const headers = new Headers(c.req.raw.headers);
    
    const incomingUrl = new URL(c.req.raw.url);
    const configuredBase = new URL(
        process.env.BASE_URL || `http://localhost:${process.env.PORT}`
    );
    incomingUrl.protocol = configuredBase.protocol;
    incomingUrl.host = configuredBase.host;

    if (!headers.get("origin")) {
        headers.set("origin", configuredBase.origin);
    }

    const req = new Request(incomingUrl.toString(), {
        method: c.req.raw.method,
        headers,
        body: c.req.raw.body,
    });

    return auth.handler(req);
});

export function startServer(port = process.env.PORT) {
    logger.log(`Server listening on :${port}`);
    logger.log(`App running at http://localhost:${port}/api`);
    Bun.serve({
        port, fetch: app.fetch,
    });
}
