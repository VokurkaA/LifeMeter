import { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { Avatar, Chip, Description, Dialog, ListGroup, Separator, Surface, Switch, useThemeColor } from "heroui-native";
import { BellIcon, LogOutIcon, MoonIcon, SunIcon, UserIcon, WifiSyncIcon } from "lucide-react-native";
import { useAuth } from "@/contexts/useAuth";
import { useUserStore } from "@/contexts/useUserStore";
import { H2 } from "@/components/Text";
import { Uniwind, useUniwind } from 'uniwind';
import { formatTime, timeToDate } from "@/lib/dateTime";
import RnDateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNotifications } from '@/lib/notifications';
import {
    getHealthSyncStatusStorageKey,
    useHealthSyncEnabled,
} from '@/lib/healthSyncStorage';
import { useStorage } from '@/lib/storage';
import { UserGoal } from '@/types/user.profile.types';
import { toast } from '@/lib/toast';
import { describeHealthError, openHealthDashboard, requestHealthPermissions } from '@/lib/health/index';
import { healthSyncService } from '@/services/health.sync.service';
import { useSleepStore } from '@/contexts/useSleepStore';
import { navigate } from '@/navigation/navigate';

type StoredSyncStatus = {
    status: "success" | "error";
    syncedAt: string;
    message: string;
};
export default function Header() {
    const { user, signOut } = useAuth();
    const { userGoals, refreshProfile } = useUserStore();
    const { refreshSleepSessions } = useSleepStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { theme } = useUniwind();

    const mutedColor = useThemeColor('muted');
    const foregroundColor = useThemeColor('foreground');

    return (
        <View className="bg-background">
            <Surface className='flex flex-row items-center justify-between w-full px-6 rounded-t-none'>
                <View className='flex flex-row items-center gap-4'>
                    <H2>LifeMeter</H2>
                </View>
                <Dialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Dialog.Trigger>
                        <Avatar animation="disable-all" size="sm" alt={user?.name ?? "User avatar"}>
                            {user?.image && (<Avatar.Image source={{ uri: user.image }} />)}
                            <Avatar.Fallback>
                                <UserIcon color={mutedColor} size={24} />
                            </Avatar.Fallback>
                        </Avatar>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content isSwipeable={false} className="h-11/12 my-auto">
                            <View className="relative flex-row items-center justify-center mb-2">
                                <Dialog.Title className="text-center text-base">{user?.email}</Dialog.Title>
                                <Dialog.Close className="absolute right-0" variant="ghost" />
                            </View>
                            <View className="flex-1">
                                <ScrollView contentContainerClassName="flex items-center" showsVerticalScrollIndicator={false}>
                                    <Avatar alt={user?.name ?? "User avatar"} className="h-22 aspect-square">
                                        <Avatar.Image source={{ uri: user?.image ?? undefined }} />
                                        <Avatar.Fallback>
                                            <UserIcon color={mutedColor} size={48} />
                                        </Avatar.Fallback>
                                    </Avatar>
                                    <Dialog.Title>Hello, {user?.name || "User"}</Dialog.Title>
                                    <Chip className="mx-auto" variant="soft" color={user?.role === "admin" ? "warning" : "accent"}>
                                        <Chip.Label>{user?.role}</Chip.Label>
                                    </Chip>

                                    <Description className="ml-2 mr-auto">General</Description>
                                    <ListGroup variant="secondary" className="w-full">
                                        <ListGroup.Item onPress={() => {
                                            setIsDialogOpen(false);
                                            navigate('UserSettings');
                                        }}>
                                            <ListGroup.ItemPrefix>
                                                <UserIcon color={foregroundColor} size={20} />
                                            </ListGroup.ItemPrefix>
                                            <ListGroup.ItemContent>
                                                <ListGroup.ItemTitle>Profile & goals</ListGroup.ItemTitle>
                                                <ListGroup.ItemDescription>Edit your onboarding preferences</ListGroup.ItemDescription>
                                            </ListGroup.ItemContent>
                                        </ListGroup.Item>
                                        <Separator />
                                        <ListGroup.Item onPress={() => Uniwind.setTheme(theme === 'light' ? 'dark' : 'light')}>
                                            <ListGroup.ItemPrefix>
                                                {theme === 'light' ? <MoonIcon size={20} color={foregroundColor} /> : <SunIcon size={20} color={foregroundColor} />}
                                            </ListGroup.ItemPrefix>
                                            <ListGroup.ItemContent>
                                                <ListGroup.ItemTitle>Switch to {theme === 'light' ? 'dark' : 'light'} mode</ListGroup.ItemTitle>
                                            </ListGroup.ItemContent>
                                        </ListGroup.Item>
                                        <Separator />
                                        <ListGroup.Item onPress={() => { signOut() }}>
                                            <ListGroup.ItemPrefix>
                                                <LogOutIcon color={foregroundColor} size={20} />
                                            </ListGroup.ItemPrefix>
                                            <ListGroup.ItemContent>
                                                <ListGroup.ItemTitle>Sign out</ListGroup.ItemTitle>
                                            </ListGroup.ItemContent>
                                        </ListGroup.Item>
                                    </ListGroup>

                                    <Description className="ml-2 mt-2 mr-auto">Notifications</Description>
                                    <NotificationsSettings userGoals={userGoals ?? undefined} />

                                    <Description className='ml-2 mt-2 mr-auto'>Offline</Description>
                                    <OfflineToggle />

                                    <Description className="ml-2 mt-2 mr-auto">Connections</Description>
                                    <ConnectionsSettings
                                        userId={user?.id ?? null}
                                        refreshProfile={refreshProfile}
                                        refreshSleepSessions={refreshSleepSessions}
                                    />
                                </ScrollView>
                            </View>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog>
            </Surface>
        </View>
    )
}

const ConnectionsSettings = ({
    userId,
    refreshProfile,
    refreshSleepSessions,
}: {
    userId: string | null;
    refreshProfile: () => Promise<void>;
    refreshSleepSessions: () => Promise<void>;
}) => {
    const [enableSync, setEnableSync] = useHealthSyncEnabled(userId);
    const [storedSyncStatus, setStoredSyncStatus] = useStorage.object<StoredSyncStatus>(
        getHealthSyncStatusStorageKey(userId),
    );
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    const lastSyncDescription = syncMessage
        ? syncMessage
        : storedSyncStatus
            ? `${storedSyncStatus.status === "success" ? "Last sync" : "Last failure"}: ${new Date(storedSyncStatus.syncedAt).toLocaleString()}${storedSyncStatus.message ? ` • ${storedSyncStatus.message}` : ""}`
            : `Automatically sync your weight, height, sleep, heart rate and blood pressure on app launch, or run a manual sync anytime.`;

    const handleOpenHealthDashboard = async () => {
        const result = await openHealthDashboard();
        if (result.ok) return;

        toast.show({
            variant: "warning",
            label: "Unable to open health app",
            description: describeHealthError(result.error),
        });
    };

    const handleManualSync = async () => {
        if (!enableSync || isSyncing) return;

        setIsSyncing(true);
        setSyncMessage("Preparing health sync...");

        try {
            const result = await healthSyncService.sync({
                onProgress: (progress) => {
                    setSyncMessage(progress.message);
                },
            });

            await Promise.all([refreshProfile(), refreshSleepSessions()]);

            const summaryMessage =
                result.totalUploadedRecords > 0
                    ? `Uploaded ${result.totalUploadedRecords} records.`
                    : "No new health records were uploaded.";

            setStoredSyncStatus({
                status: "success",
                syncedAt: result.syncedAt,
                message: summaryMessage,
            });

            toast.show({
                variant: "default",
                label: "Health sync complete",
                description: summaryMessage,
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Health sync failed.";

            setStoredSyncStatus({
                status: "error",
                syncedAt: new Date().toISOString(),
                message,
            });

            toast.show({
                variant: "warning",
                label: "Health sync failed",
                description: message,
            });
        } finally {
            setIsSyncing(false);
            setSyncMessage(null);
        }
    };

    return (
        <ListGroup variant="secondary" className="w-full">
            <ListGroup.Item>
                <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Enable sync</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>
                        Automatically sync health data on app launch and allow manual import from {Platform.OS === 'android' ? 'Health Connect' : 'Apple Health'}.
                    </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                    <Switch
                        isSelected={enableSync === true}
                        onSelectedChange={async (val) => {
                            setEnableSync(val)
                            if (!val) return;

                            const result = await requestHealthPermissions();
                            if (result.ok) return;

                            setEnableSync(false);
                            toast.show({
                                variant: "warning",
                                label: "Permission denied",
                                description: describeHealthError(result.error),
                            });
                        }}
                    />
                </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <ListGroup.Item onPress={handleOpenHealthDashboard}>
                <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>{Platform.OS === 'android' ? 'Health connect' : 'Apple Health'}</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>Control what data you share</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <ListGroup.Item disabled={!enableSync || isSyncing} onPress={handleManualSync}>
                <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>{isSyncing ? 'Syncing health data...' : 'Sync now'}</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>
                        {lastSyncDescription}
                    </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix />
            </ListGroup.Item>
        </ListGroup>
    )
}

const OfflineToggle = () => {
    const [offlineEnabled, setOfflineEnabled] = useStorage.boolean("offline-enabled");
    const foregroundColor = useThemeColor('foreground');
    return (
        <ListGroup variant="secondary" className="w-full">
            <ListGroup.Item>
                <ListGroup.ItemPrefix><WifiSyncIcon color={foregroundColor} size={20} /></ListGroup.ItemPrefix>
                <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Enable offline mode</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>
                        Automatically retry requests when you regain connectivity.
                    </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                    <Switch
                        isSelected={offlineEnabled === true}
                        onSelectedChange={setOfflineEnabled}
                    />
                </ListGroup.ItemSuffix>
            </ListGroup.Item>
        </ListGroup>
    );
};

const NotificationsSettings = ({ userGoals }: { userGoals: UserGoal | undefined }) => {
    const foregroundColor = useThemeColor('foreground');

    const { notificationExists, scheduleNotification, cancelNotification, getNotification, cancelAllNotifications } = useNotifications();
    const [notificationsEnabled, setNotificationsEnabled] = useStorage.boolean("notificationsEnabled");

    const bedtimeDate = timeToDate(userGoals?.bedtimeGoal || '') || new Date(1970, 0, 1, 22, 0);
    const wakeupDate = timeToDate(userGoals?.wakeupGoal || '') || new Date(1970, 0, 1, 7, 0);

    const [wakeupReminderEnabled, setWakeupReminderEnabled] = useState(() => notificationExists('wakeup-reminder'));
    const [bedtimeReminderEnabled, setBedtimeReminderEnabled] = useState(() => notificationExists('bedtime-reminder'));
    const [exerciseReminderEnabled, setExerciseReminderEnabled] = useState(() => notificationExists('exercise-reminder'));

    const [isExerciseClockOpen, setIsExerciseClockOpen] = useState(false);
    const [exerciseReminderTime, setExerciseReminderTime] = useState<Date>(() => {
        const trigger = getNotification('exercise-reminder')?.trigger as { hour?: number; minute?: number } | undefined;
        if (trigger?.hour !== undefined && trigger?.minute !== undefined) {
            return new Date(1970, 0, 1, trigger.hour, trigger.minute);
        }
        return new Date(1970, 0, 1, 18, 0);
    });

    const onWakeupChange = (enabled: boolean) => {
        setWakeupReminderEnabled(enabled);
        if (enabled) {
            scheduleNotification('wakeup-reminder', 'Wake-up Reminder', `It's time to wake up!`, wakeupDate, true);
        } else {
            cancelNotification('wakeup-reminder');
        }
    }
    const onBedtimeChange = (enabled: boolean) => {
        setBedtimeReminderEnabled(enabled);
        if (enabled) {
            scheduleNotification('bedtime-reminder', 'Bedtime Reminder', `It's time to go to bed!`, bedtimeDate, true);
        } else {
            cancelNotification('bedtime-reminder');
        }
    }
    const onExerciseChange = (enabled: boolean) => {
        setExerciseReminderEnabled(enabled);
        if (enabled) {
            scheduleNotification('exercise-reminder', 'Exercise Reminder', `Don't forget to do your exercises today!`, exerciseReminderTime, true);
        } else {
            cancelNotification('exercise-reminder');
        }
    }
    const onNotificationsEnabledChange = (enabled: boolean) => {
        setNotificationsEnabled(enabled);
        if (!enabled) {
            cancelAllNotifications();
            setWakeupReminderEnabled(false);
            setBedtimeReminderEnabled(false);
            setExerciseReminderEnabled(false);
        }
    }
    const onExerciseTimeChange = (event: DateTimePickerEvent, date?: Date) => {
        setIsExerciseClockOpen(false);
        if (event.type === 'set' && date) {
            setExerciseReminderTime(date);
            if (exerciseReminderEnabled) {
                cancelNotification('exercise-reminder').then(() => {
                    scheduleNotification('exercise-reminder', 'Exercise Reminder', `Don't forget to do your exercises today!`, date, true);
                });
            }
        }
    }

    return (
        <ListGroup variant="secondary" className="w-full">
            <ListGroup.Item>
                <ListGroup.ItemPrefix>
                    <BellIcon color={foregroundColor} size={20} />
                </ListGroup.ItemPrefix>
                <ListGroup.ItemContent className="flex justify-between items-center flex-row">
                    <ListGroup.ItemTitle>Enable notifications</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                    <Switch
                        isSelected={notificationsEnabled}
                        onSelectedChange={onNotificationsEnabledChange}
                    />
                </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator />

            <ListGroup.Item>
                <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Wake-up reminder</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>
                        {formatTime(wakeupDate)}
                    </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                    <Switch
                        isSelected={wakeupReminderEnabled}
                        onSelectedChange={onWakeupChange}
                        isDisabled={!notificationsEnabled}
                    />
                </ListGroup.ItemSuffix>
            </ListGroup.Item>

            <ListGroup.Item>
                <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Bedtime reminder</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>
                        {formatTime(bedtimeDate)}
                    </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                    <Switch
                        isSelected={bedtimeReminderEnabled}
                        onSelectedChange={onBedtimeChange}
                        isDisabled={!notificationsEnabled}
                    />
                </ListGroup.ItemSuffix>
            </ListGroup.Item>

            <Pressable onPress={() => setIsExerciseClockOpen(true)}>
                <ListGroup.Item disabled>
                    <ListGroup.ItemContent>
                        <ListGroup.ItemTitle>Exercise reminder</ListGroup.ItemTitle>
                        <ListGroup.ItemDescription>
                            {formatTime(exerciseReminderTime)}
                        </ListGroup.ItemDescription>
                    </ListGroup.ItemContent>
                    <ListGroup.ItemSuffix>
                        <Switch
                            isSelected={exerciseReminderEnabled}
                            onSelectedChange={onExerciseChange}
                            isDisabled={!notificationsEnabled}
                        />
                    </ListGroup.ItemSuffix>
                </ListGroup.Item>
                {isExerciseClockOpen && (
                    <RnDateTimePicker
                        display={Platform.OS === 'android' ? 'clock' : 'spinner'}
                        value={exerciseReminderTime}
                        mode='time'
                        onChange={onExerciseTimeChange}
                    />
                )}
            </Pressable>
        </ListGroup>
    )
}
