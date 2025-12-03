import {createMiddleware} from "hono/factory";
import {logger} from "@/services/logger.service";

export const requestLogger = createMiddleware(async (c, next) => {
    const start = performance.now();
    const {method, url} = c.req;

    await next();

    const end = performance.now();
    const duration = (end - start).toFixed(2);
    const status = c.res.status;

    if (status >= 500) {
        logger.error(`[HTTP] ${method} ${url}`, {status, duration: `${duration}ms`});
    } else if (status >= 400) {
        logger.warn(`[HTTP] ${method} ${url}`, {status, duration: `${duration}ms`});
    } else {
        logger.log(`[HTTP] ${method} ${url}`, {status, duration: `${duration}ms`});
    }
});