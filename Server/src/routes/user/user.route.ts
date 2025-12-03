import {Hono} from "hono";
import {requireAuth} from "@/middleware/requireAuth";
import type {AuthSession, AuthUser} from "@/types/auth.types";
import {userSleepRouter} from "@/routes/user/user.sleep.route";
import {userFoodRouter} from "@/routes/user/user.food.route";
import {userWorkoutRouter} from "@/routes/user/user.workout.route";

export const userRouter = new Hono<{ Variables: { user: AuthUser | null; session: AuthSession | null } }>();

userRouter.use("*", requireAuth());

userRouter.route("/sleep", userSleepRouter)

userRouter.route("/food", userFoodRouter)

userRouter.route("/workout", userWorkoutRouter)

userRouter.get("/", async (c) => {
    return c.json(c.get('user'));
})