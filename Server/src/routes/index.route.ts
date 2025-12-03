import {Hono} from 'hono'
import {foodRouter} from "./food.route";
import {userRouter} from "@/routes/user/user.route";
import type {AuthSession, AuthUser} from "@/types/auth.types";
import {workoutRouter} from "@/routes/workout.route";

export const router = new Hono<{ Variables: { user: AuthUser | null; session: AuthSession | null } }>();

router.get("/", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString(), message: "API is healthy" });
});

router.get("/routes", (c) => {
    const base = "/api";

    const structured = {
        base,
        resources: {
            root: {
                requiresAuth: false,
                endpoints: {
                    GET: [{ path: `${base}/` }],
                },
            },
            routes: {
                requiresAuth: false,
                endpoints: {
                    GET: [{ path: `${base}/routes` }],
                },
            },
            auth: {
                base: `${base}/auth`,
                requiresAuth: false,
                note: "Proxied to better-auth handler",
                endpoints: {
                    GET: [{ path: `${base}/auth/*` }],
                    POST: [{ path: `${base}/auth/*` }],
                },
            },
            food: {
                base: `${base}/food`,
                requiresAuth: true,
                endpoints: {
                    GET: [
                        { path: `${base}/food` },
                        { path: `${base}/food/search`, query: ["name?", "gtin?"] },
                        { path: `${base}/food/:id` },
                    ],
                },
            },
            user: {
                base: `${base}/user`,
                requiresAuth: true,
                endpoints: {
                    GET: [{ path: `${base}/user` }],
                },
            },
            userFood: {
                base: `${base}/user/food`,
                requiresAuth: true,
                endpoints: {
                    GET: [{ path: `${base}/user/food` }],
                    POST: [{ path: `${base}/user/food` }],
                    GET_ID: [{ path: `${base}/user/food/:id` }],
                    PATCH: [{ path: `${base}/user/food/:id` }],
                    DELETE: [{ path: `${base}/user/food/:id` }],
                },
            },
            userSleep: {
                base: `${base}/user/sleep`,
                requiresAuth: true,
                endpoints: {
                    POST: [
                        { path: `${base}/user/sleep/start` },
                        { path: `${base}/user/sleep/end` },
                        { path: `${base}/user/sleep/new` },
                    ],
                    GET: [
                        { path: `${base}/user/sleep` },
                        { path: `${base}/user/sleep/:id` },
                    ],
                    PATCH: [{ path: `${base}/user/sleep/:id` }],
                    DELETE: [{ path: `${base}/user/sleep/:id` }],
                },
            },
            userWorkout: {
                base: `${base}/user/workout`,
                requiresAuth: true,
                endpoints: {
                    GET: [{ path: `${base}/user/workout` }],
                    POST: [{ path: `${base}/user/workout` }],
                    GET_ID: [{ path: `${base}/user/workout/:id` }],
                    PATCH: [{ path: `${base}/user/workout/:id` }],
                    DELETE: [{ path: `${base}/user/workout/:id` }],
                },
            },
            userWorkoutTemplate: {
                base: `${base}/user/template/workout`,
                requiresAuth: true,
                endpoints: {
                    GET: [{ path: `${base}/user/template/workout` }],
                    POST: [{ path: `${base}/user/template/workout` }],
                    GET_ID: [{ path: `${base}/user/template/workout/:id` }],
                    PATCH: [{ path: `${base}/user/template/workout/:id` }],
                    DELETE: [{ path: `${base}/user/template/workout/:id` }],
                },
            },
        },
    } as const;

    return c.json(structured);
});

router.route("/food", foodRouter);
router.route("/user", userRouter);
router.route('/workout', workoutRouter)