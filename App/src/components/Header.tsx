import { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { Avatar, Chip, Description, Dialog, ListGroup, Separator, Surface, Switch, useThemeColor, useToast } from "heroui-native";
import { BellIcon, List, LogOutIcon, MoonIcon, SunIcon, UserIcon } from "lucide-react-native";
import { useAuth } from "@/contexts/useAuth";
import { useStore } from "@/contexts/useStore";
import { H2 } from "@/components/Text";
import { Uniwind, useUniwind } from 'uniwind';
import { formatTime, timeToDate } from "@/lib/dateTime";
import RnDateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNotifications } from '@/lib/notifications';
import { storage, useStorage } from '@/lib/storage';
import { UserGoal } from '@/types/user.profile.types';
import { toast } from '@/lib/toast';
import { describeHealthError, getCalories, getHeight, getMostRecentWeight, getSleep, getSteps, getWeight, openHealthDashboard, requestHealthPermissions } from '@/lib/health/index';
import { File, Paths } from 'expo-file-system';
export default function Header() {
    const { user, session, signOut } = useAuth();
    const { userGoals } = useStore();

    const { theme } = useUniwind();

    const mutedColor = useThemeColor('muted');
    const foregroundColor = useThemeColor('foreground');

    return (
        <View className="bg-background">
            <Surface className='flex flex-row items-center justify-between w-full px-6 rounded-t-none'>
                <View className='flex flex-row items-center gap-4'>
                    <H2>LifeMeter</H2>
                </View>
                <Dialog>
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
                                    <NotificationsSettings userGoals={userGoals} />

                                    <Description className='ml-2 mt-2 mr-auto'>Offline</Description>
                                    <OfflineToggle />

                                    <Description className="ml-2 mt-2 mr-auto">Connections</Description>
                                    <ConnectionsSettings />
                                </ScrollView>
                            </View>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog>
            </Surface>
        </View>
    )
}

const ConnectionsSettings = () => {
    const [enableSync, setEnableSync] = useStorage.boolean("enable-sync");
    return (
        <ListGroup variant="secondary" className="w-full">
            <ListGroup.Item>
                <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Enable sync</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>
                        Automatically sync your data with the server when you have an internet connection.
                    </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                    <Switch
                        isSelected={enableSync === true}
                        onSelectedChange={(val) => {
                            setEnableSync(val)
                            if (val) requestHealthPermissions().then(result => {
                                console.log(JSON.stringify(result))
                                if (!result.ok) {
                                    setEnableSync(false);
                                    toast.show({
                                        variant: "warning",
                                        label: "Permission denied",
                                        description: describeHealthError(result.error),
                                    });
                                }
                            })
                        }}
                    />
                </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <ListGroup.Item onPress={() => openHealthDashboard()}>
                <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>{Platform.OS === 'android' ? 'Health connect' : 'Apple Health'}</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>Control what data you share</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <ListGroup.Item disabled={!enableSync} onPress={() => {}}>
                <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Syncing all available health data</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>
                        Your weight, height, sleep and  logs will be automatically synced from {Platform.OS === 'android' ? 'Health Connect' : 'Apple Health'}.
                    </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix />
            </ListGroup.Item>
        </ListGroup>
    )
}

const OfflineToggle = () => {
    const [offlineEnabled, setOfflineEnabled] = useStorage.boolean("offline-enabled");

    return (
        <ListGroup variant="secondary" className="w-full">
            <ListGroup.Item>
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