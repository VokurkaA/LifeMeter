const HEALTH_SYNC_ENABLED_KEY_PREFIX = "health-sync:enabled";
const HEALTH_SYNC_STATUS_KEY_PREFIX = "health-sync:status";
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
