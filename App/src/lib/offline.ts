import { Storage } from './storage';

const QUEUE_KEY = 'offline_request_queue';
const CACHE_PREFIX = 'api_cache:';

export type QueuedRequest = {
  id: string;
  path: string;
  init?: RequestInit;
  timestamp: number;
};

// Simple event listener for Toasts outside of React
type ToastListener = (message: string) => void;
let toastListener: ToastListener | null = null;

export const OfflineManager = {
  setToastListener(listener: ToastListener) {
    toastListener = listener;
  },

  notify(message: string) {
    if (toastListener) toastListener(message);
  },

  // --- Queue Management (FIFO) ---

  getQueue(): QueuedRequest[] {
    return Storage.getObject<QueuedRequest[]>(QUEUE_KEY) || [];
  },

  enqueue(path: string, init?: RequestInit) {
    const queue = this.getQueue();
    const newRequest: QueuedRequest = {
      id: Math.random().toString(36).substring(7),
      path,
      init,
      timestamp: Date.now(),
    };
    Storage.setObject(QUEUE_KEY, [...queue, newRequest]);
    this.notify('Connection lost. Request stored for later.');
  },

  async processQueue(requestFn: <T>(path: string, init?: RequestInit) => Promise<T>) {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    this.notify(`Syncing ${queue.length} offline actions...`);

    const failed: QueuedRequest[] = [];

    for (const req of queue) {
      try {
        await requestFn(req.path, req.init);
      } catch (error) {
        console.error('Failed to sync request:', req.path, error);
        failed.push(req);
      }
    }

    Storage.setObject(QUEUE_KEY, failed);
    
    if (failed.length === 0) {
      this.notify('All requests synchronized!');
    } else {
      this.notify(`Sync partial. ${failed.length} requests remaining.`);
    }
  },

  // --- Cache Management (GET) ---

  setCache(path: string, data: any) {
    Storage.setObject(CACHE_PREFIX + path, {
      data,
      timestamp: Date.now(),
    });
  },

  getCache<T>(path: string): T | undefined {
    const cached = Storage.getObject<{ data: T; timestamp: number }>(CACHE_PREFIX + path);
    return cached?.data;
  },

  clearCache() {
    const allKeys = Storage.getAllKeys();
    allKeys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        Storage.delete(key);
      }
    });
  },
};
