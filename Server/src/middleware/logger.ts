import { createMiddleware } from "hono/factory";
import { createLogger } from "@/services/logger.service";

const log = createLogger("HTTP");

export const requestLogger = createMiddleware(async (c, next) => {
  const start = performance.now();
  const { method, url } = c.req;
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
    c.req.header("x-real-ip") ??
    "unknown";

  await next();

  const end = performance.now();
  const duration = (end - start).toFixed(2);
  const status = c.res.status;

  const pathObj = new URL(url, "http://localhost");
  const cleanUrl = pathObj.pathname + pathObj.search;

  const logData = {
    status,
    duration: `${duration}ms`,
    ip,
  };

  const message = `${method} ${cleanUrl}`;

  if (status >= 500) {
    log.error(message, logData);
  } else if (status >= 400) {
    log.warn(message, logData);
  } else {
    log.log(message, logData);
  }
});
