import React, {useState} from "react";
import {FlatList, Pressable, View} from "react-native";
import {Accordion, BottomSheet, Button, Dialog, Separator, useThemeColor, useToast} from "heroui-native";
import {useStore} from "@/contexts/useStore";
import {SleepSession} from "@/types/types";
import {formatTime, timeToDate} from "@/lib/dateTime";
import {Edit2Icon, Trash2Icon} from "lucide-react-native";
import {NewSleepScreen} from "@/screens/app/sleep/components/NewSleep";
import {Muted, Text} from "@/components/Text";

const DAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function RenderItem({item, deleteSleepSession, onEdit}: {
    item: SleepSession; deleteSleepSession: (id: string) => Promise<void>; onEdit: (item: SleepSession) => void;
}) {

    const foregroundColor = useThemeColor('foreground');
    const dangerColor = useThemeColor('danger');
    const startDate = timeToDate(item.startAt);
    const endDate = timeToDate(item.endAt);
    if (!startDate || !endDate) return null;

    const diffMs = endDate.getTime() - startDate.getTime();

    const sleepDuration = new Date(0, 0, 0, 0, 0, 0, diffMs);
    const sleepDurationText = () => {
        const h = sleepDuration.getHours();
        const m = sleepDuration.getMinutes();
        const s = sleepDuration.getSeconds();
        return [h > 0 && `${h}h`, m > 0 && `${m}m`, s > 0 && `${s}s`,].filter(Boolean).join(' ') || '0s';
    }

    const dayName = DAYS_SHORT[startDate.getDay()];
    const dayNumber = startDate.getDate();

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const {toast} = useToast();

    return (<Accordion.Item
        key={item.id}
        value={item.id}
    >
        <Accordion.Trigger>
            <View className="flex-row items-center flex-1 gap-3 py-2">
                <View className="h-14 aspect-square rounded-2xl bg-field flex items-center justify-center">
                    <Muted>{dayNumber}</Muted>
                    <Text className="font-bold">{dayName}</Text>
                </View>

                <Text className="flex-1">
                    {formatTime(startDate)} - {formatTime(endDate)}
                </Text>

                <Accordion.Indicator/>
            </View>
        </Accordion.Trigger>
        <Accordion.Content>
            <View className="flex flex-row justify-between">
                <View className="flex flex-col gap-3">
                    <View className="flex flex-row gap-1">
                        <Muted className="text-sm">Duration:</Muted>
                        <Text className="text-sm">{sleepDurationText()}</Text>
                    </View>
                    {item.note ? (<View className="flex flex-row gap-1">
                        <Muted className="text-sm">Notes: </Muted>
                        <Text className="text-sm">{item.note}</Text>
                    </View>) : (<Muted className="text-sm">No notes</Muted>)}
                </View>
                <View className="flex items-end gap-3">
                    <Pressable className="flex items-center flex-row gap-1" onPress={() => onEdit(item)}>
                        <Text className="text-sm">Edit</Text>
                        <Edit2Icon color={foregroundColor} size={14}/>
                    </Pressable>
                    <Dialog isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                        <Dialog.Trigger asChild>
                            <Pressable className="flex items-center flex-row gap-1">
                                <Text className="text-sm text-danger">Delete</Text>
                                <Trash2Icon color={dangerColor} size={14}/>
                            </Pressable>
                        </Dialog.Trigger>
                        <Dialog.Portal>
                            <Dialog.Overlay/>
                            <Dialog.Content>
                                <View className="flex flex-col gap-4">
                                    <View className="flex flex-row justify-between">
                                        <Dialog.Title>Are you sure?</Dialog.Title>
                                        <Dialog.Close/>
                                    </View>
                                    <Dialog.Description><Muted className="text-sm">Do you really want to remove the following sleep entry?</Muted></Dialog.Description>
                                    <View>
                                        <Text>
                                            {DAYS[startDate.getDay()]}, {MONTHS[startDate.getMonth()]} {startDate.getDate()}
                                        </Text>
                                        <Text>
                                            {formatTime(startDate)} - {formatTime(endDate)}
                                        </Text>
                                    </View>
                                    <View className="flex flex-row gap-2">
                                        <Button variant="tertiary" className="flex-1" onPress={() => setIsDeleteOpen(false)}>Cancel</Button>
                                        <Button variant="danger" className="flex-1"
                                                onPress={async () => {
                                                    try {
                                                        await deleteSleepSession(item.id);
                                                        toast.show({
                                                            variant: "success",
                                                            label: 'Sleep entry deleted',
                                                            description: 'The sleep session has been removed.',
                                                        });
                                                    } catch (error) {
                                                        toast.show({
                                                            variant: 'danger',
                                                            label: 'Failed to delete sleep entry',
                                                            description: error instanceof Error ? error.message : 'An error occurred.',
                                                        });
                                                    }
                                                    setIsDeleteOpen(false);
                                                }}>Delete</Button>
                                    </View>
                                </View>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog>
                </View>
            </View>
        </Accordion.Content>
    </Accordion.Item>);
}

export default function SleepList() {
    const {sleepSessions, deleteSleepSession, createSleepSession, editSleepSession} = useStore();
    const [selectedSession, setSelectedSession] = useState<SleepSession | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleEdit = (session: SleepSession) => {
        setSelectedSession(session);
        setIsSheetOpen(true);
    };

    return (<View className="flex-1 bg-background p-4">
        <Accordion
            selectionMode="multiple"
            variant="surface"
        >
            <FlatList
                data={sleepSessions}
                renderItem={({item}) => (<RenderItem
                    item={item}
                    deleteSleepSession={deleteSleepSession}
                    onEdit={handleEdit}
                />)}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <Separator/>}
                showsVerticalScrollIndicator={false}
            />
        </Accordion>

        <BottomSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <BottomSheet.Portal>
                <BottomSheet.Overlay/>
                <BottomSheet.Content snapPoints={['90%']} keyboardBehavior="extend">
                    <BottomSheet.Title className="text-2xl font-semibold">Edit Sleep</BottomSheet.Title>
                    <BottomSheet.Description>Update your sleep session details</BottomSheet.Description>
                    <NewSleepScreen
                        session={selectedSession}
                        createSleepSession={createSleepSession}
                        editSleepSession={editSleepSession}
                        closeSheet={() => setIsSheetOpen(false)}
                    />
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    </View>);
}