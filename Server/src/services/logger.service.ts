import {loggerConfig} from "@/config/logger.config";
import type {LogLevel} from "@/types/config.types";
import {appendFile, mkdir} from "node:fs/promises";
import path from "node:path";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0, log: 1, warn: 2, error: 3, critical: 4,
};

const COLORS = {
    reset: "\x1b[0m", dim: "\x1b[2m", debug: "\x1b[36m", // Cyan
    log: "\x1b[32m",   // Green
    warn: "\x1b[33m",  // Yellow
    error: "\x1b[31m", // Red
    critical: "\x1b[1m\x1b[41m\x1b[37m", // Bold White on Red Bg
};

class LoggerService {
    private config = loggerConfig;
    private readonly minPriority: number;

    constructor() {
        this.minPriority = LEVEL_PRIORITY[this.config.minLevel];
        this.ensureLogDir();
    }

    debug(message: string, meta?: any) {
        this.write("debug", message, meta);
    }

    log(message: string, meta?: any) {
        this.write("log", message, meta);
    }

    info(message: string, meta?: any) {
        this.write("log", message, meta);
    }

    warn(message: string, meta?: any) {
        this.write("warn", message, meta);
    }

    error(message: string, meta?: any) {
        this.write("error", message, meta);
    }

    critical(message: string, meta?: any) {
        this.write("critical", message, meta);
    }

    private async ensureLogDir() {
        if (this.config.output === "file" || this.config.output === "both") {
            try {
                await mkdir(this.config.logDir, {recursive: true});
            } catch (err) {
                console.error("Failed to create log directory:", err);
            }
        }
    }

    private getTimestamp(): string {
        return new Date().toISOString();
    }

    private getLogFileName(): string {
        const date = new Date().toISOString().split("T")[0];
        return path.join(this.config.logDir, `${date}.log`);
    }

    private formatMessage(level: LogLevel, message: string, meta?: any): string {
        const timestamp = this.config.includeTimestamp ? `[${this.getTimestamp()}]` : "";
        const levelUpper = level.toUpperCase().padEnd(5);

        if (this.config.format === "json") {
            return JSON.stringify({
                timestamp: this.config.includeTimestamp ? this.getTimestamp() : undefined, level, message, ...meta,
            });
        }

        const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
        return `${timestamp} ${levelUpper} ${message}${metaStr}`;
    }

    private formatConsoleMessage(level: LogLevel, message: string, meta?: any): string {
        if (this.config.format === "json") return this.formatMessage(level, message, meta);

        const timestamp = this.config.includeTimestamp ? `${COLORS.dim}${this.getTimestamp()}${COLORS.reset}` : "";
        const color = COLORS[level] || COLORS.reset;
        const levelStr = `${color}[${level.toUpperCase()}]${COLORS.reset}`;

        const metaStr = meta ? ` \n${COLORS.dim}${JSON.stringify(meta, null, 2)}${COLORS.reset}` : "";

        return `${timestamp} ${levelStr} ${message}${metaStr}`;
    }

    private async write(level: LogLevel, message: string, meta?: any) {
        if (LEVEL_PRIORITY[level] < this.minPriority) return;

        if (this.config.output === "console" || this.config.output === "both") {
            const consoleMsg = this.formatConsoleMessage(level, message, meta);
            console.log(consoleMsg);
        }
        if (this.config.output === "file" || this.config.output === "both") {
            const fileMsg = this.formatMessage(level, message, meta);
            const filePath = this.getLogFileName();

            try {
                await appendFile(filePath, fileMsg + "\n", "utf8");
            } catch (err) {
                console.error("FAILED TO WRITE TO LOG FILE:", err);
            }
        }
    }
}

export const logger = new LoggerService();