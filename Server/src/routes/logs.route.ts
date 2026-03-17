import { Hono } from "hono";
import { upgradeWebSocket } from "../server";
import { logEmitter, getLogs } from "../services/logger.service";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  getPagination,
  makePaginationResult,
  pagination,
} from "@/middleware/pagination";

const logsRouter = new Hono();
const listeners = new WeakMap<any, (log: any) => void>();

logsRouter.get(
  "/",
  requireAdmin(),
  async (c, next) => {
    if (c.req.header("upgrade")?.toLowerCase() === "websocket") {
      const filterContext = c.req.query("context");
      const filterLevel = c.req.query("level");

      return upgradeWebSocket((c) => {
        return {
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
      })(c, next);
    }
    await next();
  },
  pagination(),
  async (c) => {
    try {
      const { limit, offset } = getPagination(c);

      const filters = {
        dateStart: c.req.query("dateStart"),
        dateEnd: c.req.query("dateEnd"),
        context: c.req.query("context"),
        level: c.req.query("level"),
        limit,
        offset,
      };

      const { rows, total } = getLogs(filters);

      return c.json({
        rows,
        total,
        pagination: makePaginationResult(total, c),
      });
    } catch (err) {
      console.error("Failed to retrieve logs:", err);
      return c.json({ error: "Failed to retrieve logs" }, 500);
    }
  },
);

export { logsRouter };
