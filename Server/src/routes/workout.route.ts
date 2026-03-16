import { Hono } from "hono";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import { workoutService } from "@/services/workout.service";
import { createLogger } from "@/services/logger.service";

export const workoutRouter = new Hono<{
  Variables: { user: AuthUser | null; session: AuthSession | null };
}>();

const log = createLogger("Workout Route");

workoutRouter.get("/exercises", async (c) => {
  try {
    const result = await workoutService.getExercises();
    if (!result) {
      log.error("Failed to fetch exercises: result is empty");
      return c.json({ error: "Failed to fetch exercises" }, 500);
    }
    return c.json(result);
  } catch (e: any) {
    log.error("Error fetching exercises", { error: e });
    return c.json({ error: "Failed to fetch exercises" }, 500);
  }
});

workoutRouter.get("/weight-options", async (c) => {
  try {
    const result = await workoutService.getWeightOptions();
    if (!result) {
      log.error("Failed to fetch weight options: result is empty");
      return c.json({ error: "Failed to fetch weight options" }, 500);
    }
    return c.json(result);
  } catch (e: any) {
    log.error("Error fetching weight options", { error: e });
    return c.json({ error: "Failed to fetch weight options" }, 500);
  }
});

workoutRouter.get("/set-styles", async (c) => {
  try {
    const result = await workoutService.getSetStyles();
    if (!result) {
      log.error("Failed to fetch set styles: result is empty");
      return c.json({ error: "Failed to fetch set styles" }, 500);
    }
    return c.json(result);
  } catch (e: any) {
    log.error("Error fetching set styles", { error: e });
    return c.json({ error: "Failed to fetch set styles" }, 500);
  }
});

workoutRouter.get("/set-types", async (c) => {
  try {
    const result = await workoutService.getSetTypes();
    if (!result) {
      log.error("Failed to fetch set types: result is empty");
      return c.json({ error: "Failed to fetch set types" }, 500);
    }
    return c.json(result);
  } catch (e: any) {
    log.error("Error fetching set types", { error: e });
    return c.json({ error: "Failed to fetch set types" }, 500);
  }
});
