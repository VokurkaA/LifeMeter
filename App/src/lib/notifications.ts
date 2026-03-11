import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Linking } from "react-native";
import { useCallback, useEffect } from "react";
import { useToast } from "heroui-native";
import { useStorage } from "./storage";

export const useNotifications = () => {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useStorage.boolean("notificationsEnabled");
  const [notifications, setNotifications] =
    useStorage.array<Notifications.NotificationRequest>(
      "scheduledNotifications",
    ) || [];

  useEffect(() => {
    Notifications.getAllScheduledNotificationsAsync().then((scheduled) => {
      setNotifications(scheduled);
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existing, canAskAgain } =
      await Notifications.getPermissionsAsync();

    if (existing === "granted") {
      return true;
    }

    if (!canAskAgain) {
      toast.show({
        variant: "warning",
        label: "Permission denied",
        description: "Please enable notifications in your device settings.",
        actionLabel: "Open Settings",
        onActionPress: () => Linking.openSettings(),
      });
      return false;
    }

    const { status, canAskAgain: canAskAgainAfter } =
      await Notifications.requestPermissionsAsync();

    if (status !== "granted") {
      const description = canAskAgainAfter
        ? "Please enable notifications permission to receive alerts."
        : "Please enable notifications in your device settings.";

      toast.show({
        variant: "warning",
        label: "Permission denied",
        description,
        ...(canAskAgainAfter
          ? {}
          : {
              actionLabel: "Open Settings",
              onActionPress: () => Linking.openSettings(),
            }),
      });
      return false;
    }
    return true;
  }, [toast]);

  const scheduleNotification = useCallback(
    async (
      id: string,
      title: string,
      body: string,
      date: Date,
      repeating: boolean = false,
    ): Promise<boolean> => {
      if (!isEnabled) return false;

      const permitted = await requestPermission();
      if (!permitted) return false;
      setIsEnabled(true);

      if (notifications?.some((n) => n.identifier === id)) return false;

      const now = new Date();
      if (!repeating) {
        if (isNaN(date.getTime()) || date.getTime() <= now.getTime())
          return false;
      } else {
        if (isNaN(date.getTime())) return false;
      }

      const trigger: Notifications.NotificationTriggerInput = !repeating
        ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.floor((date.getTime() - now.getTime()) / 1000),
            repeats: false,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: date.getHours(),
            minute: date.getMinutes(),
          };

      try {
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: { title, body },
          trigger,
        });

        setNotifications((prev) => [
          ...(prev ?? []),
          {
            identifier: id,
            content: { title, body, data: {} },
            trigger,
          } as unknown as Notifications.NotificationRequest,
        ]);

        return true;
      } catch (e) {
        toast.show({
          variant: "danger",
          label: "Scheduling failed",
          description: "Could not schedule the notification. Please try again.",
        });
        return false;
      }
    },
    [isEnabled, setIsEnabled, requestPermission, notifications, toast],
  );

  const cancelNotification = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
        setNotifications(
          (prev) => prev?.filter((n) => n.identifier !== id) || [],
        );
        return true;
      } catch (e) {
        toast.show({
          variant: "danger",
          label: "Cancellation failed",
          description: "Could not cancel the notification. Please try again.",
        });
        return false;
      }
    },
    [toast],
  );

  const cancelAllNotifications = useCallback(async (): Promise<boolean> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotifications([]);
      return true;
    } catch (e) {
      toast.show({
        variant: "danger",
        label: "Cancellation failed",
        description: "Could not cancel all notifications. Please try again.",
      });
      return false;
    }
  }, [toast]);

  const logAllNotifications = useCallback(async (): Promise<void> => {
    if (__DEV__) {
      const notifications =
        await Notifications.getAllScheduledNotificationsAsync();
      console.log(notifications);
    }
  }, []);

  const getNotification = useCallback(
    (id: string): Notifications.NotificationRequest | undefined => {
      return notifications?.find((n) => n.identifier === id);
    },
    [notifications],
  );

  const notificationExists = useCallback(
    (id: string): boolean => {
      return !!notifications?.some((n) => n.identifier === id);
    },
    [notifications],
  );

  return {
    isEnabled,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    logAllNotifications,
    getNotification,
    notificationExists,
  };
};
