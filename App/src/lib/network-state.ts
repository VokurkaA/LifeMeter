/**
 * Shared mutable flag indicating whether the device is currently offline.
 * Written by NetworkProvider (useNetwork.tsx), read by net.ts (and anywhere else).
 * Lives in its own module to avoid a require cycle between net.ts ↔ useNetwork.tsx.
 */
export let isOffline = false;

export function setIsOffline(value: boolean): void {
  isOffline = value;
}

type ReconnectListener = () => void;
const reconnectListeners = new Set<ReconnectListener>();

export function onReconnect(listener: ReconnectListener): () => void {
  reconnectListeners.add(listener);
  return () => reconnectListeners.delete(listener);
}

export function emitReconnect(): void {
  reconnectListeners.forEach((fn) => fn());
}
