import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { Avatar, Chip, Description, Dialog, ListGroup, Separator, Surface, Switch, useThemeColor, useToast } from "heroui-native";
import { BellIcon, LogOutIcon, MoonIcon, SunIcon, UserIcon } from "lucide-react-native";
import { useAuth } from "@/contexts/useAuth";
import { useStore } from "@/contexts/useStore";
import { H2 } from "@/components/Text";
import { Uniwind, useUniwind } from 'uniwind';
import { formatTime, timeToDate } from "@/lib/dateTime";
import RnDateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { openHealthSettings } from '@/lib/health';


export default function Header() {
    const { user, session, signOut } = useAuth();
    const { userProfile, userGoals } = useStore();
    const { theme } = useUniwind();
    const { toast } = useToast();

    const mutedColor = useThemeColor('muted');
    const foregroundColor = useThemeColor('foreground');

    const bedtimeDate = timeToDate(userGoals?.bedtimeGoal || '') || new Date(1970, 0, 1, 22, 0);
    const wakeupDate = timeToDate(userGoals?.wakeupGoal || '') || new Date(1970, 0, 1, 7, 0);
    

    const [isExerciseClockOpen, setIsExerciseClockOpen] = useState(false);



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
                                                    // isSelected={isEnabled}
                                                    // onSelectedChange={enableNotifications}
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
                                                    // isSelected={isWakeupEnabled}
                                                    // onSelectedChange={toggleWakeupReminder}
                                                    // isDisabled={!isEnabled}
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
                                                    // isSelected={isBedtimeEnabled}
                                                    // onSelectedChange={toggleBedtimeReminder}
                                                    // isDisabled={!isEnabled}
                                                />
                                            </ListGroup.ItemSuffix>
                                        </ListGroup.Item>

                                        <Pressable onPress={() => setIsExerciseClockOpen(true)}>
                                            <ListGroup.Item disabled>
                                                <ListGroup.ItemContent>
                                                    <ListGroup.ItemTitle>Exercise reminder</ListGroup.ItemTitle>
                                                    <ListGroup.ItemDescription>
                                                        {/* {formatTime(exerciseDate)} */}
                                                    </ListGroup.ItemDescription>
                                                </ListGroup.ItemContent>
                                                <ListGroup.ItemSuffix>
                                                    <Switch
                                                        // isSelected={isExerciseEnabled}
                                                        // onSelectedChange={toggleExerciseReminder}
                                                        // isDisabled={!isEnabled}
                                                    />
                                                </ListGroup.ItemSuffix>
                                            </ListGroup.Item>
                                            {/* {isExerciseClockOpen && <RnDateTimePicker
                                                display="clock"
                                                value={exerciseDate}
                                                mode='time'
                                                onChange={(event: DateTimePickerEvent, date?: Date) => {
                                                    handleExerciseTimeChange(date);
                                                    if (Platform.OS === 'android') {
                                                        setIsExerciseClockOpen(false);
                                                    }
                                                }}
                                            />} */}
                                        </Pressable>
                                    </ListGroup>

                                    <Description className="ml-2 mt-2 mr-auto">Synchronization</Description>
                                    <ListGroup variant="secondary" className="w-full">
                                        <ListGroup.Item onPress={openHealthSettings}>
                                            <ListGroup.ItemContent>
                                                <ListGroup.ItemTitle>{Platform.OS === 'android' ? 'Health connect' : 'Apple Health'}</ListGroup.ItemTitle>
                                                <ListGroup.ItemDescription>Control what data you share</ListGroup.ItemDescription>
                                            </ListGroup.ItemContent>
                                            <ListGroup.ItemSuffix />
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            <ListGroup.ItemContent>
                                                <ListGroup.ItemTitle>Syncing all available health data</ListGroup.ItemTitle>
                                                <ListGroup.ItemDescription>
                                                    Your weight, height, sleep and  logs will be automatically synced from {Platform.OS === 'android' ? 'Health Connect' : 'Apple Health'}.
                                                </ListGroup.ItemDescription>
                                            </ListGroup.ItemContent>
                                            <ListGroup.ItemSuffix />
                                        </ListGroup.Item>
                                    </ListGroup>
                                </ScrollView>
                            </View>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog>
            </Surface>
        </View>
    )
}