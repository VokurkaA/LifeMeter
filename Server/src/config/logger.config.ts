import {z} from "zod";
import path from "node:path";

export const LogLevelSchema = z.enum(["debug", "log", "warn", "error", "critical"]);
export const LogFormatSchema = z.enum(["text", "json"]);
export const LogOutputSchema = z.enum(["console", "file", "both"]);

export type LogLevel = z.infer<typeof LogLevelSchema>;
export type LogFormat = z.infer<typeof LogFormatSchema>;
export type LogOutput = z.infer<typeof LogOutputSchema>;

export const loggerConfig = {
    // Level: debug < log < warn < error < critical
    minLevel: (process.env.LOG_LEVEL as LogLevel) || "log",

    // Format: 'text' (readable) or 'json' (structured)
    format: (process.env.LOG_FORMAT as LogFormat) || (process.env.NODE_ENV === "production" ? "json" : "text"),

    // Output: Where to send logs
    output: (process.env.LOG_OUTPUT as LogOutput) || "both",

    // Directory to store log files
    logDir: process.env.LOG_DIR || path.join(process.cwd(), "logs"),

    // Whether to include ISO timestamp
    includeTimestamp: process.env.LOG_TIMESTAMP !== "false",
};