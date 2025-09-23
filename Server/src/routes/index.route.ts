import {Hono} from "hono";
import {foodRouter} from "./food.route.js";

export const router = new Hono<{ Variables: { user: unknown | null; session: unknown | null } }>();

router.get("/", (c) => {
    return c.json({status: "ok", timestamp: new Date().toISOString(), message: "API is healthy"});
});

router.route("/food", foodRouter);