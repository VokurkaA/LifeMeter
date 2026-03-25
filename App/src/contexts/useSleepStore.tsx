import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { SleepSession } from '@/types/types';
import { sleepService } from '@/services/sleep.service';
import { useStorage } from '@/lib/storage';
import { useAuth } from './useAuth';
import { onReconnect } from '@/lib/network-state';

export interface SleepStoreContextType {
  sleepSessions: SleepSession[];
  ongoingSleepSession: SleepSession | null | undefined;
  startSleep: (startAt?: string, note?: string) => Promise<void>;
  endSleep: (endAt?: string) => Promise<void>;
  createSleepSession: (startAt: string, endAt?: string, note?: string) => Promise<void>;
  editSleepSession: (
    id: string,
    patch: {
      startAt?: string;
      endAt?: string | null | undefined;
      note?: string | null | undefined;
    },
  ) => Promise<void>;
  deleteSleepSession: (id: string) => Promise<void>;
  refreshSleepSessions: () => Promise<void>;
  isLoading: boolean;
}

const SleepStoreContext = createContext<SleepStoreContextType | undefined>(undefined);

export const SleepStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sleepSessions, setSleepSessions] = useStorage.array<SleepSession>('sleepSessions');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    return onReconnect(() => setRefreshCount((c) => c + 1));
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setSleepSessions(undefined);
      setIsLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        if (!sleepSessions) setIsLoading(true);
        const sessions = await sleepService.getAllSleepSessions();
        if (active) setSleepSessions(sessions);
      } catch (e) {
        console.error('Failed to fetch sleep sessions', e);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [authLoading, user, refreshCount]);

  const startSleep = useCallback(async (startAt?: string, note?: string) => {
    try {
      const newSession = await sleepService.startSleepSession(startAt, note);
      setSleepSessions([newSession, ...(sleepSessions ?? [])]);
    } catch (e) {
      console.error('Failed to start sleep session', e);
    }
  }, [sleepSessions]);

  const endSleep = useCallback(async (endAt?: string) => {
    try {
      const endedSession = await sleepService.endSleepSession(endAt);
      setSleepSessions(
        (sleepSessions ?? []).map((session) =>
          session.id === endedSession.id ? endedSession : session,
        ),
      );
    } catch (e) {
      console.error('Failed to end sleep session', e);
    }
  }, [sleepSessions]);

  const createSleepSession = useCallback(
    async (startAt: string, endAt?: string, note?: string) => {
      const created = await sleepService.addSleepSession(startAt, endAt, note);
      setSleepSessions([created, ...(sleepSessions ?? [])]);
    },
    [sleepSessions],
  );

  const editSleepSession = useCallback(
    async (id: string, patch: any) => {
      const updated = await sleepService.editSleepSession(id, patch);
      setSleepSessions((sleepSessions ?? []).map((s) => (s.id === id ? updated : s)));
    },
    [sleepSessions],
  );

  const deleteSleepSession = useCallback(
    async (id: string) => {
      await sleepService.deleteSleepSession(id);
      setSleepSessions((sleepSessions ?? []).filter((s) => s.id !== id));
    },
    [sleepSessions],
  );

  const refreshSleepSessions = useCallback(async () => {
    const sessions = await sleepService.getAllSleepSessions();
    setSleepSessions(sessions);
  }, []);

  const ongoingSleepSession = useMemo(() => {
    return (sleepSessions ?? []).find((session) => !session.endAt) || undefined;
  }, [sleepSessions]);

  const value = useMemo(() => ({
    sleepSessions: sleepSessions ?? [],
    ongoingSleepSession,
    startSleep,
    endSleep,
    createSleepSession,
    editSleepSession,
    deleteSleepSession,
    refreshSleepSessions,
    isLoading
  }), [sleepSessions, ongoingSleepSession, startSleep, endSleep, createSleepSession, editSleepSession, deleteSleepSession, refreshSleepSessions, isLoading]);

  return <SleepStoreContext.Provider value={value}>{children}</SleepStoreContext.Provider>;
};

export const useSleepStore = () => {
  const context = useContext(SleepStoreContext);
  if (!context) throw new Error('useSleepStore must be used within SleepStoreProvider');
  return context;
};
