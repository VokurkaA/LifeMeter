import { useEffect } from 'react';
import { storage, useStorage } from '@/lib/storage';

const HEALTH_SYNC_ENABLED_KEY_PREFIX = "health-sync:enabled";
const HEALTH_SYNC_STATUS_KEY_PREFIX = "health-sync:status";
const LEGACY_HEALTH_SYNC_ENABLED_KEY = 'enable-sync';
const SIGNED_OUT_SCOPE = "signed-out";

const buildScopedHealthSyncKey = (
  keyPrefix: string,
  userId: string | null | undefined,
) => `${keyPrefix}:${userId ?? SIGNED_OUT_SCOPE}`;

export const getHealthSyncEnabledStorageKey = (
  userId: string | null | undefined,
) => buildScopedHealthSyncKey(HEALTH_SYNC_ENABLED_KEY_PREFIX, userId);

export const getHealthSyncStatusStorageKey = (
  userId: string | null | undefined,
) => buildScopedHealthSyncKey(HEALTH_SYNC_STATUS_KEY_PREFIX, userId);

const migrateLegacyHealthSyncEnabled = (
  userId: string | null | undefined,
) => {
  if (!userId) {
    return;
  }

  const scopedKey = getHealthSyncEnabledStorageKey(userId);

  if (storage.has(scopedKey)) {
    if (storage.has(LEGACY_HEALTH_SYNC_ENABLED_KEY)) {
      storage.delete(LEGACY_HEALTH_SYNC_ENABLED_KEY);
    }
    return;
  }

  if (!storage.has(LEGACY_HEALTH_SYNC_ENABLED_KEY)) {
    return;
  }

  const legacyValue = storage.boolean.get(LEGACY_HEALTH_SYNC_ENABLED_KEY);
  if (typeof legacyValue !== 'boolean') {
    return;
  }

  storage.boolean.set(scopedKey, legacyValue);
  storage.delete(LEGACY_HEALTH_SYNC_ENABLED_KEY);
};

export const useHealthSyncEnabled = (
  userId: string | null | undefined,
) => {
  const [isEnabled, setIsEnabled] = useStorage.boolean(
    getHealthSyncEnabledStorageKey(userId),
  );

  useEffect(() => {
    migrateLegacyHealthSyncEnabled(userId);
  }, [userId]);

  return [isEnabled, setIsEnabled] as const;
};
