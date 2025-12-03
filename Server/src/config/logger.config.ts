import path from "node:path";
import type {LogFormat, LogLevel, LogOutput} from "@/types/config.types";

export const loggerConfig = {
    minLevel: (process.env.LOG_LEVEL || "log") as LogLevel,
    format: (process.env.LOG_FORMAT || (process.env.NODE_ENV === "production" ? "json" : "text")) as LogFormat,
    output: (process.env.LOG_OUTPUT || "both") as LogOutput,
    logDir: process.env.LOG_DIR || path.join(process.cwd(), "logs"),
    includeTimestamp: process.env.LOG_TIMESTAMP !== "false",
};