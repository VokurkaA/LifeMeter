"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { RadioTower, RefreshCw } from "lucide-react";
import { TableLayout, Virtualizer } from "@heroui/react";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
  Button,
  Chip,
  EmptyState,
  ListBox,
  ListBoxItem,
  Select,
  Table,
} from "@/components/ui/heroui";
import type { LogEntry, PaginatedResponse } from "@/lib/types";
type LiveLogsProps = {
  apiBaseUrl: string;
  initialLogs: LogEntry[];
  initialPage: number;
  initialTotal: number;
  initialTotalPages: number;
  context?: string;
  level?: string;
  queryString: string;
};

type LogDateFormat = "compact" | "detailed" | "iso";
type LogTone = "accent" | "danger" | "warning";

type LogRow = {
  id: string;
  kind: "live" | "snapshot";
  index: number;
  context: string;
  createdAtTitle: string;
  dates: Record<LogDateFormat, string>;
  details: string;
  level: string;
  levelTone: LogTone;
  message: string;
};

const DATE_FORMAT_STORAGE_KEY = "lifemeter-admin-log-date-format";
const LOAD_MORE_ROOT_MARGIN = 320;
const DATE_FORMAT_OPTIONS = [
  { key: "compact", label: "Compact" },
  { key: "detailed", label: "Detailed" },
  { key: "iso", label: "ISO" },
] as const;
const HEADER_COLUMN_CLASS_NAME = "admin-table-header";
const COMPACT_DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const DETAILED_DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "UTC",
});
const TITLE_DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function toneForStatus(status: "idle" | "connecting" | "live" | "error") {
  if (status === "live") return "success";
  if (status === "error") return "danger";
  return "accent";
}

function toneForLevel(level: string): LogTone {
  if (level === "error" || level === "critical") return "danger";
  if (level === "warn") return "warning";
  return "accent";
}

function getMetaRecord(meta?: LogEntry["meta"]) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  return meta;
}

function getMetaText(meta: LogEntry["meta"], key: string) {
  const record = getMetaRecord(meta);
  if (!record || !(key in record) || record[key] == null) return null;
  return String(record[key]);
}

function getMetaRemainder(meta: LogEntry["meta"]) {
  const record = getMetaRecord(meta);
  if (!record) return null;

  const { status, duration, ip, ...rest } = record;
  return Object.keys(rest).length > 0 ? JSON.stringify(rest) : null;
}

function getMetaSummary(meta: LogEntry["meta"]) {
  const parts = [
    getMetaText(meta, "status") ? `status ${getMetaText(meta, "status")}` : null,
    getMetaText(meta, "duration") ? `duration ${getMetaText(meta, "duration")}` : null,
    getMetaText(meta, "ip") ? `ip ${getMetaText(meta, "ip")}` : null,
    getMetaRemainder(meta),
  ].filter(Boolean);

  return parts.join(" · ");
}

function getLogKey(entry: LogEntry) {
  return `${entry.id}-${entry.created_at}`;
}

function getFormattedDates(value: string): Record<LogDateFormat, string> {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      compact: value,
      detailed: value,
      iso: value,
    };
  }

  return {
    compact: COMPACT_DATE_FORMATTER.format(date),
    detailed: DETAILED_DATE_FORMATTER.format(date),
    iso: date.toISOString(),
  };
}

function getTitleDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return TITLE_DATE_FORMATTER.format(date);
}

function createLogRow(
  entry: LogEntry,
  index: number,
  kind: LogRow["kind"],
): LogRow {
  return {
    id: getLogKey(entry),
    kind,
    index,
    context: entry.context,
    createdAtTitle: getTitleDate(entry.created_at),
    dates: getFormattedDates(entry.created_at),
    details: getMetaSummary(entry.meta) || "—",
    level: entry.level,
    levelTone: toneForLevel(entry.level),
    message: entry.message,
  };
}

function buildSnapshotRows(entries: LogEntry[]) {
  return entries.map((entry, index) => createLogRow(entry, index + 1, "snapshot"));
}

export function LiveLogs({
  apiBaseUrl,
  initialLogs,
  initialPage,
  initialTotal,
  initialTotalPages,
  context,
  level,
  queryString,
}: LiveLogsProps) {
  const [liveRows, setLiveRows] = useState<LogRow[]>([]);
  const [snapshotRows, setSnapshotRows] = useState<LogRow[]>(() =>
    buildSnapshotRows(initialLogs),
  );
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalMatches, setTotalMatches] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">(
    "idle",
  );
  const [canConnectLive, setCanConnectLive] = useState(false);
  const [dateFormat, setDateFormat] = useState<LogDateFormat>("compact");
  const socketRef = useRef<WebSocket | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);
  const seenKeysRef = useRef<Set<string>>(
    new Set(initialLogs.map((entry) => getLogKey(entry))),
  );

  const wsUrl = useMemo(() => {
    const base = apiBaseUrl.replace(/^http/, "ws");
    const params = new URLSearchParams();
    if (context) params.set("context", context);
    if (level) params.set("level", level);
    const suffix = params.toString();
    return `${base}/api/logs${suffix ? `?${suffix}` : ""}`;
  }, [apiBaseUrl, context, level]);

  function disconnect(nextStatus: "idle" | "error" = "idle") {
    const socket = socketRef.current;

    socketRef.current = null;

    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      if (
        socket.readyState === WebSocket.CONNECTING ||
        socket.readyState === WebSocket.OPEN
      ) {
        socket.close();
      }
    }

    setStatus(nextStatus);
  }

  useEffect(() => {
    disconnect();
    const nextSnapshotRows = buildSnapshotRows(initialLogs);
    seenKeysRef.current = new Set(nextSnapshotRows.map((row) => row.id));
    setLiveRows([]);
    setSnapshotRows(nextSnapshotRows);
    setCurrentPage(initialPage);
    setTotalMatches(initialTotal);
    setTotalPages(initialTotalPages);
    setLoadMoreError(null);
    setIsLoadingMore(false);
    isLoadingMoreRef.current = false;
  }, [initialLogs, initialPage, initialTotal, initialTotalPages, wsUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCanConnectLive(window.location.origin === apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedValue = window.localStorage.getItem(DATE_FORMAT_STORAGE_KEY);
    if (
      savedValue === "compact" ||
      savedValue === "detailed" ||
      savedValue === "iso"
    ) {
      setDateFormat(savedValue);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DATE_FORMAT_STORAGE_KEY, dateFormat);
  }, [dateFormat]);

  useEffect(() => {
    if (!canConnectLive) {
      disconnect();
      return;
    }

    connect(true);
  }, [canConnectLive, wsUrl]);

  const rows = useMemo<LogRow[]>(
    () => (liveRows.length > 0 ? [...liveRows, ...snapshotRows] : snapshotRows),
    [liveRows, snapshotRows],
  );

  const tableLayout = useMemo(
    () =>
      new TableLayout({
        rowHeight: 56,
        headingHeight: 44,
        loaderHeight: 40,
      }),
    [],
  );

  const hasMorePages = currentPage < totalPages;

  async function loadMore() {
    if (isLoadingMoreRef.current || !hasMorePages) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams(queryString);
      params.set("page", String(nextPage));

      const response = await fetch(`/api/logs?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to load more logs.");
      }

      const payload = (await response.json()) as PaginatedResponse<LogEntry>;

      startTransition(() => {
        setSnapshotRows((current) => {
          let nextIndex = current.length + 1;
          const nextRows: LogRow[] = [];

          for (const entry of payload.rows) {
            const key = getLogKey(entry);

            if (seenKeysRef.current.has(key)) {
              continue;
            }

            seenKeysRef.current.add(key);
            nextRows.push(createLogRow(entry, nextIndex, "snapshot"));
            nextIndex += 1;
          }

          return nextRows.length > 0 ? [...current, ...nextRows] : current;
        });
        setCurrentPage(payload.pagination.page);
        setTotalMatches(payload.total);
        setTotalPages(payload.pagination.totalPages);
      });
    } catch (error: any) {
      setLoadMoreError(error?.message || "Failed to load more logs.");
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = loadMoreSentinelRef.current;

    if (!root || !sentinel || !hasMorePages) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void loadMore();
            break;
          }
        }
      },
      {
        root,
        rootMargin: `0px 0px ${LOAD_MORE_ROOT_MARGIN}px 0px`,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMorePages, currentPage, totalPages, queryString]);

  function connect(force = false) {
    if (!canConnectLive) {
      return;
    }

    if (!force && (status === "connecting" || status === "live")) {
      return;
    }

    disconnect();
    setStatus("connecting");
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      if (socketRef.current !== socket) return;
      setStatus("live");
    };

    socket.onmessage = (event) => {
      if (socketRef.current !== socket) return;

      try {
        const payload = JSON.parse(event.data);
        if (payload?.type !== "log") return;

        const nextEntry = payload.data as LogEntry;
        const nextKey = getLogKey(nextEntry);

        if (seenKeysRef.current.has(nextKey)) {
          return;
        }

        seenKeysRef.current.add(nextKey);

        startTransition(() => {
          setLiveRows((current) => {
            return [
              createLogRow(nextEntry, 1, "live"),
              ...current.map((row) => ({
                ...row,
                index: row.index + 1,
              })),
            ];
          });
          setTotalMatches((current) => current + 1);
        });
      } catch {
        disconnect("error");
      }
    };

    socket.onerror = () => {
      if (socketRef.current !== socket) return;
      disconnect("error");
    };

    socket.onclose = () => {
      if (socketRef.current !== socket) return;

      socketRef.current = null;
      setStatus((current) => (current === "error" ? "error" : "idle"));
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Chip color={toneForStatus(status)} variant="soft">
            {status === "live"
              ? "Live"
              : status === "connecting"
                ? "Connecting"
                : status === "error"
                  ? "Stream error"
                  : "Snapshot"}
          </Chip>
          <Chip color="accent" variant="soft">
            {rows.length} loaded
          </Chip>
          <Chip color="accent" variant="soft">
            {totalMatches} matches
          </Chip>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Date format"
            className="min-w-40"
            selectedKey={dateFormat}
            onSelectionChange={(key) => {
              if (
                key === "compact" ||
                key === "detailed" ||
                key === "iso"
              ) {
                setDateFormat(key);
              }
            }}
            variant="secondary"
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox items={DATE_FORMAT_OPTIONS}>
                {(item) => (
                  <ListBoxItem id={item.key} key={item.key} textValue={item.label}>
                    {item.label}
                  </ListBoxItem>
                )}
              </ListBox>
            </Select.Popover>
          </Select>

          <Button
            onPress={() => {
              disconnect();
              const nextSnapshotRows = buildSnapshotRows(initialLogs);
              seenKeysRef.current = new Set(
                nextSnapshotRows.map((row) => row.id),
              );
              setLiveRows([]);
              setSnapshotRows(nextSnapshotRows);
              setCurrentPage(initialPage);
              setTotalMatches(initialTotal);
              setTotalPages(initialTotalPages);
              setLoadMoreError(null);
              setIsLoadingMore(false);
              isLoadingMoreRef.current = false;

              if (canConnectLive) {
                connect(true);
              }
            }}
            variant="tertiary"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            isDisabled={!canConnectLive || status === "connecting" || status === "live"}
            onPress={() => connect()}
            variant="primary"
          >
            <RadioTower className="h-4 w-4" />
            Connect live
          </Button>
        </div>
      </div>

      {!canConnectLive ? (
        <Alert status="warning">
          <AlertContent>
            <AlertTitle>Live streaming is unavailable here</AlertTitle>
            <AlertDescription>
              The live socket only works when the web app and API share the same origin.
            </AlertDescription>
          </AlertContent>
        </Alert>
      ) : null}

      {loadMoreError ? (
        <Alert status="warning">
          <AlertContent>
            <AlertTitle>Older logs could not be loaded</AlertTitle>
            <AlertDescription>{loadMoreError}</AlertDescription>
          </AlertContent>
        </Alert>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState className="p-6">
          <p className="admin-muted-copy text-sm">No logs matched the current filters.</p>
        </EmptyState>
      ) : (
        <Table variant="secondary">
          <Table.ScrollContainer
            className="admin-log-scroll max-h-[72vh] overflow-auto rounded-lg"
            ref={scrollContainerRef}
          >
            <Virtualizer layout={tableLayout}>
              <Table.Content aria-label="Logs table">
                <Table.Header>
                  <Table.Column
                    className={HEADER_COLUMN_CLASS_NAME}
                    id="index"
                    isRowHeader
                    width={80}
                  >
                    Index
                  </Table.Column>
                  <Table.Column
                    className={HEADER_COLUMN_CLASS_NAME}
                    id="date"
                    minWidth={180}
                    width={220}
                  >
                    Date
                  </Table.Column>
                  <Table.Column
                    className={HEADER_COLUMN_CLASS_NAME}
                    id="level"
                    minWidth={100}
                    width={110}
                  >
                    Level
                  </Table.Column>
                  <Table.Column
                    className={HEADER_COLUMN_CLASS_NAME}
                    id="context"
                    minWidth={140}
                    width={160}
                  >
                    Context
                  </Table.Column>
                  <Table.Column
                    className={HEADER_COLUMN_CLASS_NAME}
                    id="message"
                    minWidth={320}
                    width="2fr"
                  >
                    Message
                  </Table.Column>
                  <Table.Column
                    className={HEADER_COLUMN_CLASS_NAME}
                    id="details"
                    minWidth={240}
                    width="1.4fr"
                  >
                    Details
                  </Table.Column>
                </Table.Header>
                <Table.Body items={rows}>
                  {(row) => (
                    <Table.Row id={row.id}>
                      <Table.Cell className="admin-table-meta">
                        {row.kind === "snapshot" ? liveRows.length + row.index : row.index}
                      </Table.Cell>
                      <Table.Cell className="admin-table-meta">
                        <span title={row.createdAtTitle}>
                          {row.dates[dateFormat]}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip color={row.levelTone} size="sm" variant="soft">
                          {row.level}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip color="accent" size="sm" variant="soft">
                          {row.context}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <p className="truncate text-sm text-foreground" title={row.message}>
                          {row.message}
                        </p>
                      </Table.Cell>
                      <Table.Cell className="admin-table-meta">
                        <span className="block truncate" title={row.details}>
                          {row.details}
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Virtualizer>
            {hasMorePages ? <div className="h-px w-full" ref={loadMoreSentinelRef} /> : null}
          </Table.ScrollContainer>
        </Table>
      )}

      <div className="admin-muted-copy flex flex-wrap items-center justify-between gap-2 text-sm">
        <p>Loaded {rows.length} rows.</p>
        <p>
          {hasMorePages
            ? isLoadingMore
              ? "Loading more logs…"
              : "Scroll near the bottom to load more."
            : "No more logs to load."}
        </p>
      </div>
    </div>
  );
}
