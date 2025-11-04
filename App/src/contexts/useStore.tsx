import sleepService from "@/services/sleep.service";
import { SleepSession, StoreContextType } from "@/types";
import { useContext, createContext, useEffect, useState } from "react";

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<any> = ({ children }) => {
  const [sleepSessions, setSleepSessions] = useState<SleepSession[]>([]);

  useEffect(() => {
    const initializeStore = async () => {
      const sessions = await sleepService.getAllSleepSessions();
      setSleepSessions(sessions);
    };
    initializeStore();
  }, []);

  const refreshSleepSessions = async () => {
    const sessions = await sleepService.getAllSleepSessions();
    setSleepSessions(sessions);
  };

  const startSleep = async (startISO = new Date().toISOString()) => {
    const started = await sleepService.startSleepSession(startISO);
    setSleepSessions(prev => [started, ...prev.filter(s => s.id !== started.id)]);
    return started;
  };

  const endSleep = async (endISO = new Date().toISOString()) => {
    const ended = await sleepService.endSleepSession(endISO);
    setSleepSessions(prev => [ended, ...prev.filter(s => s.id !== ended.id)]);
    return ended;
  };

  const storeValue: StoreContextType = {
    sleepSessions,
    startSleep,
    endSleep,
    refreshSleepSessions,
  };

  return (
    <StoreContext.Provider value={storeValue}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
