import type { Context, Next } from "hono";

/**
 * Ensures a user is authenticated (c.get("user") not null).
 * Returns 401 JSON error if unauthenticated.
 */
export function requireAuth() {
    return async (c: Context, next: Next) => {
        const user = c.get("user");
        if (!user) {
            return c.json({error: "Unauthorized"}, 401);
        }
        await next();
    };
}