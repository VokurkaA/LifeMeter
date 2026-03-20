import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { upgradeWebSocket } from "../server";
import { logEmitter, getLogs, createLogger } from "../services/logger.service";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  getPagination,
  makePaginationResult,
  pagination,
} from "@/middleware/pagination";
import { paginationQuerySchema } from "@/schemas/pagination.schema";
import type { Context } from "hono";
import type { WSEvents } from "hono/ws";

const logsRouter = new OpenAPIHono();
const listeners = new WeakMap<any, (log: any) => void>();
const log = createLogger("Logs Route");

logsRouter.use("*", requireAdmin());
logsRouter.use("*", pagination());

const ErrorSchema = z.object({
  error: z.string(),
});

const getLogsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get system logs or connect to WebSocket for live logs",
  request: {
    query: z.object({
      dateStart: z.string().optional().openapi({ example: "2023-10-01" }),
      dateEnd: z.string().optional().openapi({ example: "2023-10-02" }),
      context: z.string().optional().openapi({ example: "Server" }),
      level: z.string().optional().openapi({ example: "error" }),
    }).merge(paginationQuerySchema),
  },
  responses: {
    200: { 
      description: "List of logs or WebSocket upgrade",
      content: {
        "application/json": {
          schema: z.object({
            rows: z.array(z.any()),
            total: z.number(),
            pagination: z.any(),
          }),
        },
      },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
    500: { description: "Internal server error", content: { "application/json": { schema: ErrorSchema } } },
  },
});

logsRouter.openapi(getLogsRoute, (async (c: Context): Promise<Response> => {
  // Check for WebSocket upgrade
  if (c.req.header("upgrade")?.toLowerCase() === "websocket") {
    const filterContext = c.req.query("context");
    const filterLevel = c.req.query("level");

    const wsEvents: WSEvents = {
      onOpen(event, ws) {
        const onLog = (log: any) => {
          if (filterContext && log.context !== filterContext) return;
          if (filterLevel && log.level !== filterLevel) return;
          ws.send(JSON.stringify({ type: "log", data: log }));
        };
        logEmitter.on("new-log", onLog);
        listeners.set(ws, onLog);
      },
      onClose(event, ws) {
        const onLog = listeners.get(ws);
        if (onLog) {
          logEmitter.off("new-log", onLog);
          listeners.delete(ws);
        }
      },
    };

    return upgradeWebSocket(c, wsEvents);
  }

  try {
    const { limit, offset } = getPagination(c as any);
    const query = (c as any).req.valid("query");

    const filters = {
      dateStart: query.dateStart,
      dateEnd: query.dateEnd,
      context: query.context,
      level: query.level,
      limit,
      offset,
    };

    const { rows, total } = getLogs(filters);

    return c.json(
      {
        rows,
        total,
        pagination: makePaginationResult(total, c as any),
      },
      200,
    );
  } catch (err: any) {
    log.error("Failed to retrieve logs", { error: err });
    return c.json({ error: "Failed to retrieve logs" }, 500);
  }
}) as any);

export { logsRouter };
