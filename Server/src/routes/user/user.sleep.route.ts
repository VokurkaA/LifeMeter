import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import { sleepService } from "@/services/sleep.service";
import { createLogger } from "@/services/logger.service";
import {
  SleepEntrySchema,
  StartSleepSchema,
  EndSleepSchema,
  NewSleepEntrySchema,
  UpdateSleepEntrySchema,
} from "@/schemas/user.sleep.schema";

export const userSleepRouter = new OpenAPIHono<{
  Variables: { user: AuthUser | null; session: AuthSession | null };
}>();

const log = createLogger("User Sleep Route");

const ErrorSchema = z.object({
  error: z.string(),
});

const startSleepRoute = createRoute({
  method: "post",
  path: "/start",
  summary: "Start a sleep session",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: StartSleepSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: SleepEntrySchema,
        },
      },
      description: "Sleep session started",
    },
    400: {
      description: "Invalid request",
      content: { "application/json": { schema: ErrorSchema } }
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } }
    }
  },
});

const endSleepRoute = createRoute({
  method: "post",
  path: "/end",
  summary: "End current sleep session",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: EndSleepSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SleepEntrySchema,
        },
      },
      description: "Sleep session ended",
    },
    400: {
      description: "No active sleep entry",
      content: { "application/json": { schema: ErrorSchema } }
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } }
    }
  },
});

const newSleepRoute = createRoute({
  method: "post",
  path: "/new",
  summary: "Create a new sleep entry manually",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: NewSleepEntrySchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: SleepEntrySchema,
        },
      },
      description: "Sleep entry created",
    },
    400: {
      description: "Invalid dates",
      content: { "application/json": { schema: ErrorSchema } }
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } }
    }
  },
});

const getAllSleepRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get all sleep entries for current user",
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(SleepEntrySchema),
        },
      },
      description: "List of sleep entries",
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } }
    }
  },
});

const getSleepByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  summary: "Get a sleep entry by ID",
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SleepEntrySchema,
        },
      },
      description: "Sleep entry details",
    },
    404: {
      description: "Sleep entry not found",
      content: { "application/json": { schema: ErrorSchema } }
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } }
    }
  },
});

const updateSleepRoute = createRoute({
  method: "patch",
  path: "/{id}",
  summary: "Update a sleep entry",
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateSleepEntrySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SleepEntrySchema,
        },
      },
      description: "Sleep entry updated",
    },
    404: {
      description: "Sleep entry not found",
      content: { "application/json": { schema: ErrorSchema } }
    },
    400: {
      description: "Invalid request",
      content: { "application/json": { schema: ErrorSchema } }
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } }
    }
  },
});

const deleteSleepRoute = createRoute({
  method: "delete",
  path: "/{id}",
  summary: "Delete a sleep entry",
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    204: {
      description: "Sleep entry deleted",
    },
    404: {
      description: "Sleep entry not found",
      content: { "application/json": { schema: ErrorSchema } }
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } }
    }
  },
});

userSleepRouter.openapi(startSleepRoute, async (c) => {
  const { startAt, note } = c.req.valid("json");
  const userId = c.get("user")!.id;

  try {
    const entry = await sleepService.startSleep(userId, startAt, note);
    return c.json(entry, 201);
  } catch (e: any) {
    const message = e?.message || "Failed to start sleep";
    log.error("Error starting sleep", { error: e });
    return c.json({ error: message }, 400);
  }
});

userSleepRouter.openapi(endSleepRoute, async (c) => {
  const { endAt } = c.req.valid("json");
  const userId = c.get("user")!.id;

  try {
    const entry = await sleepService.endSleep(userId, endAt);
    return c.json(entry, 200);
  } catch (e: any) {
    const msg = e?.message || "Failed to end sleep";
    const status = /no active sleep entry/i.test(msg) ? 400 : 500;
    if (status === 500) log.error("Error ending sleep", { error: e });
    return c.json({ error: msg }, status as any);
  }
});

userSleepRouter.openapi(newSleepRoute, async (c) => {
  const { startAt, endAt, note } = c.req.valid("json");
  const userId = c.get("user")!.id;

  try {
    const entry = await sleepService.addSleepEntry(userId, startAt, endAt ?? null, note ?? null);
    return c.json(entry, 201);
  } catch (e: any) {
    const msg = e?.message || "Failed to create sleep entry";
    const status = /earlier than/i.test(msg) ? 400 : 500;
    if (status === 500) log.error("Error creating new sleep entry", { error: e });
    return c.json({ error: msg }, status as any);
  }
});

userSleepRouter.openapi(getAllSleepRoute, async (c) => {
  const userId = c.get("user")!.id;
  try {
    const entries = await sleepService.getAllSleepEntries(userId);
    return c.json(entries, 200);
  } catch (e: any) {
    log.error("Error fetching sleep entries", { error: e });
    return c.json({ error: e.message }, 500);
  }
});

userSleepRouter.openapi(getSleepByIdRoute, async (c) => {
  const userId = c.get("user")!.id;
  const { id } = c.req.valid("param");

  try {
    const entry = await sleepService.getSleepEntry(userId, id);
    return c.json(entry, 200);
  } catch (e: any) {
    const msg = e?.message || "Failed to fetch sleep entry";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) log.error(`Error fetching sleep entry ${id}`, { error: e });
    return c.json({ error: msg }, status as any);
  }
});

userSleepRouter.openapi(updateSleepRoute, async (c) => {
  const userId = c.get("user")!.id;
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  try {
    const existing = await sleepService.getSleepEntry(userId, id);
    const startAt = body.startAt ?? (existing.sleep_start as unknown as string);
    const endAt = body.endAt !== undefined ? body.endAt : existing.sleep_end;
    const note = body.note !== undefined ? body.note : existing.note;

    const updated = await sleepService.alterSleepEntry(userId, id, startAt, endAt, note);
    return c.json(updated, 200);
  } catch (e: any) {
    const msg = e?.message || "Failed to update sleep entry";
    const status = /not found/i.test(msg) ? 404 : /earlier than/i.test(msg) ? 400 : 500;
    if (status === 500) log.error(`Error updating sleep entry ${id}`, { error: e });
    return c.json({ error: msg }, status as any);
  }
});

userSleepRouter.openapi(deleteSleepRoute, async (c) => {
  const userId = c.get("user")!.id;
  const { id } = c.req.valid("param");

  try {
    await sleepService.deleteSleepEntry(userId, id);
    return c.body(null, 204);
  } catch (e: any) {
    const msg = e?.message || "Failed to delete sleep entry";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) log.error(`Error deleting sleep entry ${id}`, { error: e });
    return c.json({ error: msg }, status as any);
  }
});
