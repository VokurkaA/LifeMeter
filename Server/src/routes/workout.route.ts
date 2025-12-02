import {Hono} from "hono";
import type {AuthSession, AuthUser} from "@/types/auth.types";
import {workoutService} from "@/services/workout.service";

export const workoutRouter = new Hono<{ Variables: { user: AuthUser | null; session: AuthSession | null } }>();

workoutRouter.get('/exercises', async (c) => {
    const result = await workoutService.getExercises();
    if (!result) {
        return c.json({error: "Failed to fetch exercises"}, 500);
    }
    return c.json(result);
})

workoutRouter.get('/weight-options', async (c) => {
    const result = await workoutService.getWeightOptions();
    if (!result) {
        return c.json({error: "Failed to fetch weight options"}, 500);
    }
    return c.json(result);
})

workoutRouter.get('/set-styles', async (c) => {
    const result = await workoutService.getSetStyles();
    if (!result) {
        return c.json({error: "Failed to fetch set styles"}, 500);
    }
    return c.json(result);

})

workoutRouter.get('/set-types', async (c) => {
    const result = await workoutService.getSetTypes();
    if (!result) {
        return c.json({error: "Failed to fetch set types"}, 500);
    }
    return c.json(result);
})