import { isOffline } from "@/lib/network-state";
import { storage } from "@/lib/storage";
import { toast } from "@/lib/toast";

const QUEUE_KEY = "offline-queue";
type QueuedRequest = { path: string; init: RequestInit };

export async function flushQueue(): Promise<void> {
  const queue = storage.array.get<QueuedRequest>(QUEUE_KEY) ?? [];
  if (!queue.length) return;

  storage.array.set(QUEUE_KEY, []);

  const failed: QueuedRequest[] = [];

  for (const item of queue) {
    try {
      await request(item.path, item.init);
    } catch (err) {
      console.warn(`[offline-queue] Failed to replay ${item.path}:`, err);
      failed.push(item);
    }
  }

  if (failed.length) {
    storage.array.set(QUEUE_KEY, [
      ...(storage.array.get<QueuedRequest>(QUEUE_KEY) ?? []),
      ...failed,
    ]);
  }
}

export async function fetchWithTimeout(
  resource: RequestInfo | URL,
  options: RequestInit & { timeout?: number } = {},
) {
  const { timeout = 5000, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(resource, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const isReadOnly = method === "GET" || method === "HEAD";

  if (
    isOffline &&
    !isReadOnly &&
    storage.boolean.get("offline-enabled") &&
    process.env.EXPO_PUBLIC_USE_OFFLINE === "true"
  ) {
    toast.show({
      label: "Saved!",
      description:
        "Request is queued and will be sent when you're back online.",
      variant: "default",
    });

    const existing = storage.array.get<QueuedRequest>(QUEUE_KEY) ?? [];
    const isDuplicate = existing.some(
      (r) => r.path === path && JSON.stringify(r.init) === JSON.stringify(init),
    );
    if (!isDuplicate) {
      storage.array.push(QUEUE_KEY, { path, init });
    }
    return undefined as unknown as T;
  }

  const response = await fetch(path, {
    method: "GET",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const text = await response.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          message = json?.error || json?.message || text || message;
        } catch {
          message = text || message;
        }
      }
    } catch (error) {
      console.error("Error parsing response:", error);
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as unknown as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
