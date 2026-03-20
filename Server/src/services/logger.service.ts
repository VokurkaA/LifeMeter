import { loggerConfig } from "@/config/logger.config";
import type { LogLevel } from "@/types/config.types";
import { appendFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";
import { EventEmitter } from "node:events";

try {
  mkdirSync(loggerConfig.logDir, { recursive: true });
} catch (err) {
}

const db = new Database(path.join(loggerConfig.logDir, "system_logs.sqlite"), { create: true });
db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT,
    message TEXT,
    context TEXT,
    created_at TEXT,
    meta TEXT
  )
`);

const logTableColumns = db
  .query("PRAGMA table_info(logs)")
  .all() as Array<{ name: string }>;

if (!logTableColumns.some((column) => column.name === "meta")) {
  db.exec("ALTER TABLE logs ADD COLUMN meta TEXT");
}

const insertLogStmt = db.prepare(
  "INSERT INTO logs (level, message, context, created_at, meta) VALUES (?, ?, ?, ?, ?)",
);

export const logEmitter = new EventEmitter();

type StoredLogRow = {
  id: number | string;
  level: string;
  message: string;
  context: string;
  created_at: string;
  meta?: string | null;
};

function parseStoredMeta(meta?: string | null) {
  if (!meta) return null;

  try {
    return JSON.parse(meta);
  } catch {
    return { raw: meta };
  }
}

function normalizeStoredLogRow(row: StoredLogRow) {
  return {
    ...row,
    meta: parseStoredMeta(row.meta),
  };
}

export function getRecentLogs(limit: number) {
  return (
    db.query("SELECT * FROM logs ORDER BY created_at DESC LIMIT ?").all(limit) as StoredLogRow[]
  ).map(normalizeStoredLogRow);
}

export function getLogs(filters: {
  dateStart?: string;
  dateEnd?: string;
  context?: string;
  level?: string;
  limit: number;
  offset: number;
}) {
  let query = "SELECT * FROM logs WHERE 1=1";
  let countQuery = "SELECT COUNT(*) as total FROM logs WHERE 1=1";
  const params: any[] = [];

  if (filters.dateStart) {
    query += " AND created_at >= ?";
    countQuery += " AND created_at >= ?";
    params.push(filters.dateStart);
  }
  if (filters.dateEnd) {
    query += " AND created_at <= ?";
    countQuery += " AND created_at <= ?";
    params.push(filters.dateEnd);
  }
  if (filters.context) {
    query += " AND context = ?";
    countQuery += " AND context = ?";
    params.push(filters.context);
  }
  if (filters.level) {
    query += " AND level = ?";
    countQuery += " AND level = ?";
    params.push(filters.level);
  }

  const total = (db.prepare(countQuery).get(...params) as { total: number }).total;

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(filters.limit, filters.offset);

  const rows = (db.prepare(query).all(...params) as StoredLogRow[]).map(
    normalizeStoredLogRow,
  );

  return { rows, total };
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  log: 1,
  warn: 2,
  error: 3,
  critical: 4,
};

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  debug: "\x1b[36m",
  log: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  critical: "\x1b[1m\x1b[41m\x1b[37m",
  context: "\x1b[35m",
};

export interface LogMeta {
  context?: string;
  [key: string]: any;
}

const errorReplacer = (_: string, v: any) => {
  if (v instanceof Error) {
    return Object.assign(
      {
        message: v.message,
        stack: v.stack,
      },
      v,
    );
  }
  return v;
};

function sanitizeMetaValue(meta?: LogMeta) {
  const { context = "App", ...restMeta } = meta ?? {};
  const payload =
    Object.keys(restMeta).length > 0
      ? JSON.parse(JSON.stringify(restMeta, errorReplacer))
      : null;

  return {
    context,
    payload,
    serialized: payload ? JSON.stringify(payload) : null,
  };
}

class LoggerService {
  private config = loggerConfig;
  private readonly minPriority: number;

  constructor() {
    this.minPriority = LEVEL_PRIORITY[this.config.minLevel];
    this.ensureLogDir();
  }

  debug(message: string, meta?: LogMeta) {
    this.write("debug", message, meta);
  }
  log(message: string, meta?: LogMeta) {
    this.write("log", message, meta);
  }
  info(message: string, meta?: LogMeta) {
    this.write("log", message, meta);
  }
  warn(message: string, meta?: LogMeta) {
    this.write("warn", message, meta);
  }
  error(message: string, meta?: LogMeta) {
    this.write("error", message, meta);
  }
  critical(message: string, meta?: LogMeta) {
    this.write("critical", message, meta);
  }

  private ensureLogDir() {
    if (this.config.output === "file" || this.config.output === "both") {
      try {
        mkdirSync(this.config.logDir, { recursive: true });
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

  private formatMessage(
    level: LogLevel,
    message: string,
    meta: LogMeta = {},
  ): string {
    const { context, payload } = sanitizeMetaValue(meta);

    if (this.config.format === "json") {
      return JSON.stringify({
        timestamp: this.config.includeTimestamp
          ? this.getTimestamp()
          : undefined,
        level,
        context,
        message,
        meta: payload ?? undefined,
      });
    }

    const timestamp = this.config.includeTimestamp
      ? `[${this.getTimestamp()}]`
      : "";
    const levelUpper = level.toUpperCase().padEnd(5);
    const metaStr = payload ? ` ${JSON.stringify(payload)}` : "";

    return `${timestamp} ${levelUpper} [${context}] ${message}${metaStr}`;
  }

  private formatConsoleMessage(
    level: LogLevel,
    message: string,
    meta: LogMeta = {},
  ): string {
    if (this.config.format === "json")
      return this.formatMessage(level, message, meta);

    const { context, payload } = sanitizeMetaValue(meta);

    const timestamp = this.config.includeTimestamp
      ? `${COLORS.dim}${this.getTimestamp()}${COLORS.reset}`
      : "";
    const color = COLORS[level] || COLORS.reset;
    const levelStr = `${color}[${level.toUpperCase()}]${COLORS.reset}`;
    const contextStr = `${COLORS.context}[${context}]${COLORS.reset}`;

    const metaStr = payload
      ? ` \n${COLORS.dim}${JSON.stringify(payload, null, 2)}${COLORS.reset}`
      : "";

    return `${timestamp} ${levelStr} ${contextStr} ${message}${metaStr}`;
  }

  private async write(level: LogLevel, message: string, meta?: LogMeta) {
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

    const normalizedMeta = sanitizeMetaValue(meta);
    const timestamp = new Date().toISOString();
    try {
      const result = insertLogStmt.run(
        level,
        message,
        normalizedMeta.context,
        timestamp,
        normalizedMeta.serialized,
      );

      logEmitter.emit("new-log", {
        id: result.lastInsertRowid.toString(),
        level,
        message,
        context: normalizedMeta.context,
        created_at: timestamp,
        meta: normalizedMeta.payload,
      });
    } catch (err) {
      console.error("FAILED TO WRITE TO SQLITE LOGS:", err);
    }
  }
}


export const logger = new LoggerService();

export const createLogger = (context: string) => {
  return {
    debug: (message: string, meta: LogMeta = {}) =>
      logger.debug(message, { ...meta, context }),
    log: (message: string, meta: LogMeta = {}) =>
      logger.log(message, { ...meta, context }),
    info: (message: string, meta: LogMeta = {}) =>
      logger.info(message, { ...meta, context }),
    warn: (message: string, meta: LogMeta = {}) =>
      logger.warn(message, { ...meta, context }),
    error: (message: string, meta: LogMeta = {}) =>
      logger.error(message, { ...meta, context }),
    critical: (message: string, meta: LogMeta = {}) =>
      logger.critical(message, { ...meta, context }),
  };
};
