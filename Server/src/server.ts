import {Hono} from "hono";
import {auth} from "./auth.js";
import {cors} from "hono/cors";
import {trimTrailingSlash} from "hono/trailing-slash";

export const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null;
    };
}>();

app.use(trimTrailingSlash());

app.use("*", async (c, next) => {
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

app.use(
    "/api/*",
    cors({
        origin: (origin) => {
            if (!origin) return "";
            const allowed = new Set([
                "http://localhost:3000",
                "http://localhost:3001",
            ]);
            return allowed.has(origin) ? origin : "";
        },
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        exposeHeaders: ["Content-Length"],
        credentials: true,
        maxAge: 600,
    })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});

export function startServer(port = process.env.PORT) {
    console.log(`Server (Bun) listening on :${port}`);
    console.log(`App running at http://localhost:${port}`);
    Bun.serve({
        port,
        fetch: app.fetch,
    });
}
