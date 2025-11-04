import type { Context, Next } from "hono";

export function requireAdmin() {
    return async (c: Context, next: Next) => {
        const user = c.get("user") as { role?: string | string[] } | null;
        if (!user) {
            return c.json({error: "Unauthorized"}, 401);
        }
        const roles = Array.isArray(user.role) ? user.role : typeof user.role === "string" ? user.role.split(",").map((r) => r.trim()).filter(Boolean) : [];
        if (!roles.includes("admin")) {
            return c.json({error: "Forbidden"}, 403);
        }
        await next();
    };
}