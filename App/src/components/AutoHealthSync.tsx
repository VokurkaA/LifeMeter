import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { useIsOffline } from '@/contexts/useNetwork';
import { useSleepStore } from '@/contexts/useSleepStore';
import { useUserStore } from '@/contexts/useUserStore';
import { hasHealthSyncPermissions } from '@/lib/health';
import {
  getHealthSyncEnabledStorageKey,
  getHealthSyncStatusStorageKey,
} from '@/lib/healthSyncStorage';
import { useStorage } from '@/lib/storage';
import { healthSyncService } from '@/services/health.sync.service';

type StoredSyncStatus = {
  status: 'success' | 'error';
  syncedAt: string;
  message: string;
};

function buildSyncSummaryMessage(totalUploadedRecords: number) {
  return totalUploadedRecords > 0
    ? `Uploaded ${totalUploadedRecords} records.`
    : 'No new health records were uploaded.';
}

export default function AutoHealthSync() {
  const { user, loading } = useAuth();
  const { refreshProfile } = useUserStore();
  const { refreshSleepSessions } = useSleepStore();
  const isOffline = useIsOffline();

  const [enableSync] = useStorage.boolean(
    getHealthSyncEnabledStorageKey(user?.id ?? null),
  );
  const [, setStoredSyncStatus] =
    useStorage.object<StoredSyncStatus>(
      getHealthSyncStatusStorageKey(user?.id ?? null),
    );

  const attemptedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      attemptedUserIdRef.current = null;
    }
  }, [user]);

  useEffect(() => {
    if (loading || !user || enableSync !== true || isOffline) {
      return;
    }

    if (attemptedUserIdRef.current === user.id) {
      return;
    }

    attemptedUserIdRef.current = user.id;

    let cancelled = false;

    (async () => {
      const hasPermissions = await hasHealthSyncPermissions();
      if (cancelled) return;

      if (!hasPermissions) {
        setStoredSyncStatus({
          status: 'error',
          syncedAt: new Date().toISOString(),
          message:
            'Health sync is enabled, but the required health permissions are not currently granted.',
        });
        return;
      }

      try {
        const result = await healthSyncService.sync();
        if (cancelled) return;

        await Promise.allSettled([refreshProfile(), refreshSleepSessions()]);
        if (cancelled) return;

        setStoredSyncStatus({
          status: 'success',
          syncedAt: result.syncedAt,
          message: buildSyncSummaryMessage(result.totalUploadedRecords),
        });
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof Error ? error.message : 'Health sync failed.';

        setStoredSyncStatus({
          status: 'error',
          syncedAt: new Date().toISOString(),
          message,
        });
        console.error('Automatic health sync failed', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    enableSync,
    isOffline,
    loading,
    refreshProfile,
    refreshSleepSessions,
    setStoredSyncStatus,
    user,
  ]);

  return null;
}
