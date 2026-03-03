import NetInfo from '@react-native-community/netinfo';
import { OfflineManager } from './offline';

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

export async function request<T>(path: string, init?: RequestInit & { skipInterceptor?: boolean }): Promise<T> {
  const method = init?.method?.toUpperCase() || 'GET';
  const { skipInterceptor, ...restInit } = init || {};

  if (skipInterceptor) {
    return performFetch<T>(path, restInit);
  }

  const state = await NetInfo.fetch();
  const isOnline = state.isConnected && state.isInternetReachable !== false;

  if (method === 'GET') {
    if (!isOnline) {
      const cached = OfflineManager.getCache<T>(path);
      if (cached) return cached;
      throw new Error('Offline and no cached data available');
    }

    const data = await performFetch<T>(path, restInit);
    OfflineManager.setCache(path, data);
    return data;
  }

  // Non-GET requests
  if (!isOnline) {
    OfflineManager.enqueue(path, restInit);
    return {} as T; // Return empty to prevent UI crashes, handled by Toast
  }

  return performFetch<T>(path, restInit);
}

async function performFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
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
      console.error('Error parsing response:', error);
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as unknown as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

