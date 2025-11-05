import { SleepSession, StoreContextType } from '@/types';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { sleepService } from '@/services/sleep.service';

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<any> = ({ children }) => {
  const [sleepSessions, setSleepSessions] = useState<SleepSession[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const sessions: SleepSession[] = await sleepService.getAllSleepSessions();
        if (active) setSleepSessions(sessions);
      } catch (e) {
        console.error('Failed to initialize sleep sessions', e);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const startSleep = useCallback(async () => {
    try {
      const newSession = await sleepService.startSleepSession();
      setSleepSessions((prev) => [newSession, ...prev]);
    } catch (e) {
      console.error('Failed to start sleep session', e);
    }
  }, []);

  const endSleep = useCallback(async () => {
    try {
      const endedSession = await sleepService.endSleepSession();
      setSleepSessions((prev) =>
        prev.map((session) => (session.id === endedSession.id ? endedSession : session)),
      );
    } catch (e) {
      console.error('Failed to end sleep session', e);
    }
  }, []);

  const createSleepSession = useCallback(async (startAt: string, endAt?: string, note?: string) => {
    try {
      const created = await sleepService.addSleepSession(startAt, endAt, note);
      setSleepSessions((prev) => [created, ...prev]);
    } catch (e) {
      console.error('Failed to create sleep session', e);
    }
  }, []);

  const editSleepSession = useCallback(
    async (
      id: string,
      patch: {
        startAt?: string;
        endAt?: string | null;
        note?: string | null;
      },
    ) => {
      try {
        const updated = await sleepService.editSleepSession(id, patch);
        setSleepSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      } catch (e) {
        console.error('Failed to edit sleep session', e);
      }
    },
    [],
  );

  const deleteSleepSession = useCallback(async (id: string) => {
    try {
      await sleepService.deleteSleepSession(id);
      setSleepSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error('Failed to delete sleep session', e);
    }
  }, []);

  const ongoingSleepSession = useMemo(() => {
    return sleepSessions.find((session) => !session.endAt) || null;
  }, [sleepSessions]);

  const refreshSleepSessions = useCallback(async () => {
    try {
      const sessions: SleepSession[] = await sleepService.getAllSleepSessions();
      setSleepSessions(sessions);
    } catch (e) {
      console.error('Failed to refresh sleep sessions', e);
    }
  }, []);

  const storeValue: StoreContextType = useMemo(
    () => ({
      sleepSessions,
      startSleep,
      endSleep,
      createSleepSession,
      editSleepSession,
      deleteSleepSession,
      ongoingSleepSession,
      refreshSleepSessions,
    }),
    [
      sleepSessions,
      startSleep,
      endSleep,
      createSleepSession,
      editSleepSession,
      deleteSleepSession,
      ongoingSleepSession,
      refreshSleepSessions,
    ],
  );

  return <StoreContext.Provider value={storeValue}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
