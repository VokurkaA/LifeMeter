import {Hono} from "hono";
import type {AuthSession, AuthUser} from "@/types/auth.types";
import {userProfileService} from "@/services/user.profile.service";
import { logHeightSchema, logWeightSchema, updateGoalSchema, updateProfileSchema } from "@/schemas/user.profile.schema";

export const userProfileRouter = new Hono<{ Variables: { user: AuthUser; session: AuthSession } }>();

userProfileRouter.get("/reference/activity-levels", async (c) => {
    const levels = await userProfileService.getActivityLevels();
    return c.json(levels);
});

userProfileRouter.get("/reference/length-units", async (c) => {
    const units = await userProfileService.getLengthUnits();
    return c.json(units);
});

userProfileRouter.get("/reference/weight-units", async (c) => {
    const units = await userProfileService.getWeightUnits();
    return c.json(units);
});

userProfileRouter.get("/profile", async (c) => {
    const user = c.get("user");
    const profile = await userProfileService.getProfile(user.id);
    return c.json(profile || {});
});

userProfileRouter.put("/profile", async (c) => {
    const user = c.get("user");
    const rawBody = await c.req.json().catch(() => ({}));
    const parsed = updateProfileSchema.safeParse(rawBody);

    if (!parsed.success) {
        return c.json({
            error: "Validation failed", issues: parsed.error.issues.map(i => ({
                path: i.path.join("."), message: i.message
            }))
        }, 400);
    }

    const updated = await userProfileService.upsertProfile(user.id, parsed.data);
    return c.json(updated);
});

userProfileRouter.get("/goals", async (c) => {
    const user = c.get("user");
    const goals = await userProfileService.getGoals(user.id);
    return c.json(goals || {});
});

userProfileRouter.put("/goals", async (c) => {
    const user = c.get("user");
    const rawBody = await c.req.json().catch(() => ({}));
    const parsed = updateGoalSchema.safeParse(rawBody);

    if (!parsed.success) {
        return c.json({
            error: "Validation failed", issues: parsed.error.issues.map(i => ({
                path: i.path.join("."), message: i.message
            }))
        }, 400);
    }
    const updated = await userProfileService.upsertGoals(user.id, parsed.data);
    return c.json(updated);
});

userProfileRouter.post("/log/weight", async (c) => {
    const user = c.get("user");
    const rawBody = await c.req.json().catch(() => ({}));
    const parsed = logWeightSchema.safeParse(rawBody);

    if (!parsed.success) {
        return c.json({
            error: "Validation failed", issues: parsed.error.issues.map(i => ({
                path: i.path.join("."), message: i.message
            }))
        }, 400);
    }
    const log = await userProfileService.logWeight(user.id, parsed.data);
    return c.json(log);
});

userProfileRouter.get("/log/weight/latest", async (c) => {
    const user = c.get("user");
    const log = await userProfileService.getLatestWeight(user.id);
    return c.json(log);
});

userProfileRouter.post("/log/height", async (c) => {
    const user = c.get("user");
    const rawBody = await c.req.json().catch(() => ({}));
    const parsed = logHeightSchema.safeParse(rawBody);

    if (!parsed.success) {
        return c.json({
            error: "Validation failed", issues: parsed.error.issues.map(i => ({
                path: i.path.join("."), message: i.message
            }))
        }, 400);
    }
    const log = await userProfileService.logHeight(user.id, parsed.data);
    return c.json(log);
});