import * as Notifications from "expo-notifications";
import { useToast } from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { Linking, Platform } from "react-native";
import { Storage } from "@/lib/storage";

const NOTIFICATIONS_ENABLED_KEY = "notifications_enabled";
const NOTIFICATION_KEYS_KEY = "notification_keys";
const NOTIFICATION_REPEATING_TIMES_KEY = "notification_repeating_times";
const REPEATING_TIME_PREFIX = "notification_repeating_time:";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const getStoredKeys = (): Set<string> => {
  const raw = Storage.getString(NOTIFICATION_KEYS_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
};

const persistKeys = (keys: Set<string>): void => {
  Storage.setString(NOTIFICATION_KEYS_KEY, JSON.stringify([...keys]));
};

type RepeatingTimesMap = Record<string, string>;

const getStoredRepeatingTimes = (): RepeatingTimesMap => {
  const raw = Storage.getString(NOTIFICATION_REPEATING_TIMES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as RepeatingTimesMap;
  } catch {
    return {};
  }
};

const persistRepeatingTimes = (map: RepeatingTimesMap): void => {
  Storage.setString(NOTIFICATION_REPEATING_TIMES_KEY, JSON.stringify(map));
};

const setRepeatingTime = (
  identifier: string,
  hour: number,
  minute: number,
  second: number,
): void => {
  Storage.setString(
    REPEATING_TIME_PREFIX + identifier,
    new Date(1970, 0, 1, hour, minute, second).toISOString(),
  );
};

const removeRepeatingTime = (identifier: string): void => {
  Storage.delete(REPEATING_TIME_PREFIX + identifier);
};

export const useNotifications = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [notificationKeys, setNotificationKeys] =
    useState<Set<string>>(getStoredKeys);
  const { toast } = useToast();

  useEffect(() => {
    const checkNotificationStatus = async () => {
      const userPreference = Storage.getBoolean(NOTIFICATIONS_ENABLED_KEY);
      if (!userPreference) {
        setIsEnabled(false);
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      const enabled = status === "granted";
      setIsEnabled(enabled);

      if (!enabled) {
        Storage.setBoolean(NOTIFICATIONS_ENABLED_KEY, false);
      }
    };

    checkNotificationStatus();
  }, []);

  useEffect(() => {
    const syncKeys = async () => {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const liveKeys = new Set(scheduled.map((n) => n.identifier));
      setNotificationKeys(liveKeys);
      persistKeys(liveKeys);

      Storage.getAllKeys()
        .filter((k) => k.startsWith(REPEATING_TIME_PREFIX))
        .map((k) => k.slice(REPEATING_TIME_PREFIX.length))
        .filter((id) => !liveKeys.has(id))
        .forEach((id) => removeRepeatingTime(id));
    };

    syncKeys();
  }, []);

  const addKey = useCallback((key: string) => {
    setNotificationKeys((prev) => {
      const next = new Set(prev).add(key);
      persistKeys(next);
      return next;
    });
  }, []);

  const removeKey = useCallback((key: string) => {
    setNotificationKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      persistKeys(next);
      return next;
    });
  }, []);

  const enableNotifications = useCallback(
    async (enable: boolean): Promise<void> => {
      if (!enable) {
        setIsEnabled(false);
        Storage.setBoolean(NOTIFICATIONS_ENABLED_KEY, false);
        return;
      }

      const { status, canAskAgain } = await Notifications.getPermissionsAsync();

      if (status === "granted") {
        setIsEnabled(true);
        Storage.setBoolean(NOTIFICATIONS_ENABLED_KEY, true);

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
          });
        }
        return;
      }

      if (canAskAgain) {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        const granted = newStatus === "granted";
        setIsEnabled(granted);
        Storage.setBoolean(NOTIFICATIONS_ENABLED_KEY, granted);

        if (granted && Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
          });
        }
      } else {
        setIsEnabled(false);
        Storage.setBoolean(NOTIFICATIONS_ENABLED_KEY, false);

        toast.show({
          label: "Permissions Required",
          description:
            "Please enable notifications in your device settings to use this feature.",
          variant: "danger",
        });

        Linking.openSettings();
      }
    },
    [toast],
  );

  const scheduleNotification = useCallback(
    async (data: {
      title: string;
      body: string;
      date: Date;
      identifier?: string;
      extraData?: Record<string, any>;
    }): Promise<string | null> => {
      if (!isEnabled) return null;

      const id = await Notifications.scheduleNotificationAsync({
        identifier: data.identifier,
        content: {
          title: data.title,
          body: data.body,
          data: data.extraData,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: data.date,
        },
      });

      addKey(id);
      return id;
    },
    [isEnabled, addKey],
  );

  const removeScheduledNotification = useCallback(
    async (key: string): Promise<void> => {
      await Notifications.cancelScheduledNotificationAsync(key);
      removeKey(key);
      removeRepeatingTime(key);
    },
    [removeKey],
  );

  const scheduleRepeatingNotification = useCallback(
    async (data: {
      title: string;
      body: string;
      hour: number;
      minute: number;
      second: number;
      identifier?: string;
      extraData?: Record<string, any>;
    }): Promise<string | null> => {
      if (!isEnabled) return null;

      const id = await Notifications.scheduleNotificationAsync({
        identifier: data.identifier,
        content: {
          title: data.title,
          body: data.body,
          data: data.extraData,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: data.hour,
          minute: data.minute,
        },
      });

      addKey(id);
      setRepeatingTime(id, data.hour, data.minute, data.second);
      return id;
    },
    [isEnabled, addKey],
  );

  const editScheduledNotification = useCallback(
    async (data: {
      identifier: string;
      title: string;
      body: string;
      date: Date;
      extraData?: Record<string, any>;
    }): Promise<string | null> => {
      if (!isEnabled) return null;

      await Notifications.cancelScheduledNotificationAsync(data.identifier);

      const id = await Notifications.scheduleNotificationAsync({
        identifier: data.identifier,
        content: {
          title: data.title,
          body: data.body,
          data: data.extraData,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: data.date,
        },
      });

      addKey(id);
      return id;
    },
    [isEnabled, addKey],
  );

  const editRepeatingNotification = useCallback(
    async (data: {
      identifier: string;
      title: string;
      body: string;
      hour: number;
      minute: number;
      second: number;
      extraData?: Record<string, any>;
    }): Promise<string | null> => {
      if (!isEnabled) return null;

      await Notifications.cancelScheduledNotificationAsync(data.identifier);

      const id = await Notifications.scheduleNotificationAsync({
        identifier: data.identifier,
        content: {
          title: data.title,
          body: data.body,
          data: data.extraData,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: data.hour,
          minute: data.minute,
        },
      });

      addKey(id);
      setRepeatingTime(id, data.hour, data.minute, data.second);
      return id;
    },
    [isEnabled, addKey],
  );

  const getStoredRepeatingTime = useCallback(
    (identifier: string): Date | null => {
      const iso = Storage.getString(REPEATING_TIME_PREFIX + identifier);
      if (!iso) return null;
      const parsed = new Date(iso);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    },
    [],
  );

  const listScheduledNotifications = useCallback(async (): Promise<
    Notifications.NotificationRequest[]
  > => {
    return await Notifications.getAllScheduledNotificationsAsync();
  }, []);

  const hasNotification = useCallback(
    (key: string): boolean => {
      return notificationKeys.has(key);
    },
    [notificationKeys],
  );

  return {
    isEnabled,
    enableNotifications,
    scheduleNotification,
    removeScheduledNotification,
    scheduleRepeatingNotification,
    editScheduledNotification,
    editRepeatingNotification,
    getStoredRepeatingTime,
    listScheduledNotifications,
    hasNotification,
  };
};
