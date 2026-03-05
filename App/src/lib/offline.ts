import * as Network from "expo-network";
import { useEffect, useRef } from "react";
import { storage } from "./storage";

let _isOffline = false;

type QueuedRequest = { path: string; init?: RequestInit & { timeout?: number } };

async function replayQueue() {
  const queue = storage.array.get<QueuedRequest>("offline-request-cache") ?? [];
  if (queue.length === 0) return;

  storage.delete("offline-request-cache");

  for (const { path, init } of queue) {
    const { timeout: _timeout, ...rest } = init ?? {};
    try {
      await fetch(path, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        ...rest,
      });
    } catch (error) {
      console.error("[offline] Failed to replay queued request:", path, error);
    }
  }
}

Network.getNetworkStateAsync().then((state) => {
  _isOffline = !state.isConnected || !state.isInternetReachable;
});

Network.addNetworkStateListener((state) => {
  const offline = !state.isConnected || !state.isInternetReachable;
  if (offline !== _isOffline) {
    _isOffline = offline;
    if (!offline) {
      replayQueue();
    }
  }
});

export const isOffline = () => _isOffline;

export const useNetworkChange = (onChange: (isOffline: boolean) => void) => {
  const callbackRef = useRef(onChange);

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state) => {
      const offline = !state.isConnected || !state.isInternetReachable;
      callbackRef.current(offline);
    });
    return () => subscription.remove();
  }, []);
};
