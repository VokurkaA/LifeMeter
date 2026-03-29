import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import { createLogger } from "@/services/logger.service";
import { healthSyncService } from "@/services/health.sync.service";
import {
  healthSyncBatchRequestSchema,
  healthSyncBatchResponseSchema,
  healthSyncStatusQuerySchema,
  healthSyncStatusResponseSchema,
} from "@/schemas/user.sync.schema";

export const userSyncRouter = new OpenAPIHono<{
  Variables: { user: AuthUser | null; session: AuthSession | null };
}>();

const log = createLogger("User Sync Route");

const ErrorSchema = z.object({
  error: z.string(),
});

const getSyncStateRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get committed health sync state for the current user",
  security: [{ cookieAuth: [] }],
  request: {
    query: healthSyncStatusQuerySchema,
  },
  responses: {
    200: {
      description: "Current health sync status",
      content: {
        "application/json": {
          schema: healthSyncStatusResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

const syncBatchRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Import a health sync batch and normalize it into the user database",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: healthSyncBatchRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Batch processed",
      content: {
        "application/json": {
          schema: healthSyncBatchResponseSchema,
        },
      },
    },
    409: {
      description: "Sync state conflict",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

userSyncRouter.openapi(getSyncStateRoute, async (c) => {
  const userId = c.get("user")!.id;
  const { provider } = c.req.valid("query");

  try {
    const status = await healthSyncService.getSyncState(userId, provider);
    return c.json(status, 200);
  } catch (error: any) {
    log.error("Failed to fetch health sync state", {
      error,
      userId,
      provider,
    });
    return c.json({ error: "Failed to fetch health sync state" }, 500);
  }
});

userSyncRouter.openapi(syncBatchRoute, async (c) => {
  const userId = c.get("user")!.id;
  const body = c.req.valid("json");

  try {
    const result = await healthSyncService.syncBatch(userId, body);
    return c.json(result, 200);
  } catch (error: any) {
    if (healthSyncService.isConflictError(error)) {
      return c.json({ error: error.message }, 409);
    }

    log.error("Failed to process health sync batch", {
      error,
      userId,
      provider: body.provider,
      batchIndex: body.batchIndex,
      syncRunId: body.syncRunId,
    });
    return c.json({ error: "Failed to process health sync batch" }, 500);
  }
});
