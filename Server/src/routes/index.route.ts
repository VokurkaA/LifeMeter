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
                base: `${base}/user/workout/template`,
                requiresAuth: true,
                endpoints: {
                    GET: [{ path: `${base}/user/workout/template` }],
                    POST: [{ path: `${base}/user/workout/template` }],
                    GET_ID: [{ path: `${base}/user/workout/template/:id` }],
                    PATCH: [{ path: `${base}/user/workout/template/:id` }],
                    DELETE: [{ path: `${base}/user/workout/template/:id` }],
                },
            },
            workout: {
                base: `${base}/workout`,
                requiresAuth: false,
                endpoints: {
                    GET_EXERCISES: [{ path: `${base}/workout/exercises` }],
                    GET_WEIGHT_OPTIONS: [{ path: `${base}/workout/weight-options` }],
                    GET_SET_STYLES: [{ path: `${base}/workout/set-styles` }],
                    GET_SET_TYPES: [{ path: `${base}/workout/set-types` }],
                },
            },
            userData: {
                base: `${base}/user/data`,
                requiresAuth: true,
                endpoints: {
                    GET_ACTIVITY_LEVELS: [{ path: `${base}/user/data/reference/activity-levels` }],
                    GET_LENGTH_UNITS: [{ path: `${base}/user/data/reference/length-units` }],
                    GET_WEIGHT_UNITS: [{ path: `${base}/user/data/reference/weight-units` }],
                    GET_PROFILE: [{ path: `${base}/user/data/profile` }],
                    PUT_PROFILE: [{ path: `${base}/user/data/profile` }],
                    GET_GOALS: [{ path: `${base}/user/data/goals` }],
                    PUT_GOALS: [{ path: `${base}/user/data/goals` }],
                    POST_LOG_WEIGHT: [{ path: `${base}/user/data/log/weight` }],
                    GET_LOG_WEIGHT_LATEST: [{ path: `${base}/user/data/log/weight/latest` }],
                    POST_LOG_HEIGHT: [{ path: `${base}/user/data/log/height` }],
                },
            },
        },
    } as const;

    return c.json(structured);
});

router.route("/food", foodRouter);
router.route("/user", userRouter);
router.route('/workout', workoutRouter)