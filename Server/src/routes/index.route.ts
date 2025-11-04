import { Hono } from 'hono'
import { foodRouter } from "./food.route";
import { sleepRouter } from './sleep.route';
import type { AuthSession, AuthUser } from "@/types/auth.types";

export const router = new Hono<{ Variables: { user: AuthUser | null; session: AuthSession | null } }>();

router.get("/", (c) => {
    return c.json({status: "ok", timestamp: new Date().toISOString(), message: "API is healthy"});
});

router.get("/routes", (c) => {
    const base = "/api";

    const structured = {
        base, resources: {
            root: {
                requiresAuth: false, endpoints: {
                    GET: [{path: `${base}/`}]
                }
            }, food: {
                base: `${base}/food`, requiresAuth: true, endpoints: {
                    GET: [{path: `${base}/food`}, {path: `${base}/food/search`}, {path: `${base}/food/:id`}]
                }
            }, sleep: {
                base: `${base}/sleep`, requiresAuth: true, endpoints: {
                    POST: [{path: `${base}/sleep/start`}, {path: `${base}/sleep/end`}, {path: `${base}/sleep/new`}],
                    GET: [{path: `${base}/sleep`}, {path: `${base}/sleep/:id`}],
                    PATCH: [{path: `${base}/sleep/:id`}],
                    DELETE: [{path: `${base}/sleep/:id`}]
                }
            }
        }
    };

    return c.json(structured);
});

router.route("/food", foodRouter);
router.route("/sleep", sleepRouter);