import { Hono } from "hono";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import {
  getPagination,
  makePaginationResult,
  pagination,
} from "@/middleware/pagination";
import { workoutService } from "@/services/workout.service";
import {
  workoutBodySchema,
  workoutTemplateBodySchema,
  workoutTemplateUpdateSchema,
  workoutUpdateSchema,
} from "@/schemas/user.workout.schema";
import type { PaginationProps } from "@/types/pagination.types";
import { createLogger } from "@/services/logger.service";

export const userWorkoutRouter = new Hono<{
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
    pagination: PaginationProps;
  };
}>();

const log = createLogger("User Workout Route");

userWorkoutRouter.post("/template", async (c) => {
  const user = c.get("user")!;
  const rawBody = await c.req.json().catch(() => ({}));

  const parsed = workoutTemplateBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      400,
    );
  }

  try {
    const result = await workoutService.addUserWorkoutTemplate(
      user.id,
      parsed.data,
    );
    return c.json(result, 201);
  } catch (e: any) {
    const msg = e?.message || "Failed to create workout template";
    log.error("Error creating workout template", { error: e });
    return c.json({ error: msg }, 500);
  }
});

userWorkoutRouter.get("/template", pagination(), async (c) => {
  const user = c.get("user")!;
  const paginationProps = getPagination(c);
  try {
    const { rows, total } = await workoutService.getAllUserWorkoutTemplates(
      user.id,
      paginationProps,
    );
    return c.json({ rows, total, pagination: makePaginationResult(total, c) });
  } catch (e: any) {
    log.error("Error fetching workout templates", { error: e });
    return c.json({ error: e?.message || "Failed to fetch templates" }, 500);
  }
});

userWorkoutRouter.get("/template/:id", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");

  try {
    const result = await workoutService.getUserWorkoutTemplateById(user.id, id);
    return c.json(result);
  } catch (e: any) {
    const msg = e?.message || "Template not found";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) {
      log.error(`Error fetching workout template ${id}`, { error: e });
    }
    return c.json({ error: msg }, status);
  }
});

userWorkoutRouter.patch("/template/:id", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const rawBody = await c.req.json().catch(() => ({}));

  const parsed = workoutTemplateUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      400,
    );
  }

  try {
    const result = await workoutService.updateUserWorkoutTemplate(
      user.id,
      id,
      parsed.data,
    );
    return c.json(result);
  } catch (e: any) {
    const msg = e?.message || "Failed to update template";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) {
      log.error(`Error updating workout template ${id}`, { error: e });
    }
    return c.json({ error: msg }, status);
  }
});

userWorkoutRouter.delete("/template/:id", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");

  try {
    await workoutService.deleteUserWorkoutTemplate(user.id, id);
    return c.body(null, 204);
  } catch (e: any) {
    const msg = e?.message || "Failed to delete template";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) {
      log.error(`Error deleting workout template ${id}`, { error: e });
    }
    return c.json({ error: msg }, status);
  }
});

userWorkoutRouter.get("/", pagination(), async (c) => {
  const user = c.get("user")!;
  const paginationProps = getPagination(c); // <--- FIXED HERE
  try {
    const { rows, total } = await workoutService.getAllUserWorkouts(
      user.id,
      paginationProps,
    );
    return c.json({ rows, total, pagination: makePaginationResult(total, c) });
  } catch (e: any) {
    log.error("Error fetching workouts", { error: e });
    return c.json({ error: e?.message || "Failed to fetch workouts" }, 500);
  }
});

userWorkoutRouter.post("/", async (c) => {
  const user = c.get("user")!;
  const rawBody = await c.req.json().catch(() => ({}));

  const parsed = workoutBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      400,
    );
  }

  const start_date = parsed.data.start_date || new Date().toISOString();

  try {
    const result = await workoutService.addUserWorkout(user.id, {
      ...parsed.data,
      start_date,
    });
    return c.json(result, 201);
  } catch (e: any) {
    const msg = e?.message || "Failed to create workout";
    log.error("Error creating workout", { error: e });
    return c.json({ error: msg }, 500);
  }
});

userWorkoutRouter.get("/:id", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");

  try {
    const result = await workoutService.getUserWorkoutById(user.id, id);
    return c.json(result);
  } catch (e: any) {
    const msg = e?.message || "Workout not found";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) {
      log.error(`Error fetching workout ${id}`, { error: e });
    }
    return c.json({ error: msg }, status);
  }
});

userWorkoutRouter.patch("/:id", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const rawBody = await c.req.json().catch(() => ({}));

  const parsed = workoutUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      400,
    );
  }

  try {
    const result = await workoutService.updateUserWorkout(
      user.id,
      id,
      parsed.data,
    );
    return c.json(result);
  } catch (e: any) {
    const msg = e?.message || "Failed to update workout";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) {
      log.error(`Error updating workout ${id}`, { error: e });
    }
    return c.json({ error: msg }, status);
  }
});

userWorkoutRouter.delete("/:id", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");

  try {
    await workoutService.deleteUserWorkout(user.id, id);
    return c.body(null, 204);
  } catch (e: any) {
    const msg = e?.message || "Failed to delete workout";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) {
      log.error(`Error deleting workout ${id}`, { error: e });
    }
    return c.json({ error: msg }, status);
  }
});
