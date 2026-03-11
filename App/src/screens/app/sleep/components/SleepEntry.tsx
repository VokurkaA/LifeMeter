import DateTimePicker from "@/components/DateTimePicker";
import { Muted, Text } from "@/components/Text";
import { DAYS, DAYS_SHORT, formatDate, formatTime, MONTHS, timeToDate } from "@/lib/dateTime";
import { SleepSession } from "@/types/types";
import { Accordion, BottomSheet, Button, Dialog, Label, Separator, TextField, Toast, useThemeColor, useToast } from "heroui-native";
import { Edit2Icon, Trash2Icon, XIcon } from "lucide-react-native";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { BottomSheetTextInput } from "@/components/BottomSheetTextInput";

interface SleepEntryProps {
    item: SleepSession;
    deleteSleepSession: (id: string) => Promise<void>;
    createSleepSession: (startAt: string, endAt?: string, note?: string) => Promise<void>;
    editSleepSession: (id: string, patch: { startAt?: string; endAt?: string | null; note?: string | null }) => Promise<void>;
}
interface EditSleepProps {
    sleepEntry: SleepSession;
    startDate: Date;
    endDate: Date;
    editSleepSession: (id: string, patch: { startAt?: string; endAt?: string | null; note?: string | null }) => Promise<void>;
}
interface DeleteSleepProps {
    sleepEntry: SleepSession;
    startDate: Date;
    endDate: Date;
    deleteSleepSession: (id: string) => Promise<void>;
}

export default function SleepEntry({ item, deleteSleepSession, editSleepSession }: SleepEntryProps) {
    const startDate = timeToDate(item.startAt);
    const endDate = timeToDate(item.endAt);
    if (!startDate || !endDate) return null;

    const diffMs = endDate.getTime() - startDate.getTime();

    const sleepDurationText = useMemo(() => {
        const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return [h > 0 && `${h}h`, m > 0 && `${m}m`, s > 0 && `${s}s`].filter(Boolean).join(' ') || '0s';
    }, [diffMs]);

    return (
        <Accordion.Item value={item.id} className="mx-2 mb-2">
            <Accordion.Trigger>
                <View className="h-14 aspect-square rounded-2xl bg-border flex items-center justify-center">
                    <Muted>{startDate.getDate()}</Muted>
                    <Text className="font-bold">{DAYS_SHORT[startDate.getDay()]}</Text>
                </View>

                <Text className="flex-1">
                    {formatTime(startDate)} - {formatTime(endDate)}
                </Text>
                <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="flex flex-col gap-3">
                <View className="flex flex-row justify-between">
                    <View className="flex flex-row gap-1">
                        <Text className="text-muted">Duration:</Text>
                        <Text>{sleepDurationText}</Text>
                    </View>
                    <EditSleep sleepEntry={item} startDate={startDate} endDate={endDate} editSleepSession={editSleepSession} />
                </View>
                <View className="flex flex-row justify-between">
                    {!item.note ?
                        <Text className="text-muted">No notes</Text> :
                        <Text>{item.note}</Text>}
                    <DeleteSleep sleepEntry={item} startDate={startDate} endDate={endDate} deleteSleepSession={deleteSleepSession} />
                </View>
            </Accordion.Content>
            <Separator />
        </Accordion.Item>
    );
}

const EditSleep = ({ sleepEntry, startDate, endDate, editSleepSession }: EditSleepProps) => {
    const { toast } = useToast();
    const foregroundColor = useThemeColor('foreground');
    const mutedColor = useThemeColor('muted');

    const [isOpen, setIsOpen] = useState(false);

    const [sleepDate, setSleepDate] = useState<Date | undefined>(startDate);
    const [sleptFrom, setSleptFrom] = useState<Date | undefined>(startDate);
    const [sleptTo, setSleptTo] = useState<Date | undefined>(endDate);
    const [note, setNote] = useState(sleepEntry.note ?? '');

    const SubmitButton = () => {
        if (canSubmit) {
            return <Button className="mt-2" onPress={() => handleSubmit()}><Button.Label>Update</Button.Label></Button>
        }
        return <Button className="mt-2" variant="secondary" onPress={() => closeForm()}><Button.Label>Close</Button.Label></Button>
    }
    const canSubmit = useMemo(() => {
        if (!sleepDate || !sleptFrom || !sleptTo) return false;
        if (
            sleepDate.getTime() === startDate.getTime() &&
            sleptFrom.getTime() === startDate.getTime() &&
            sleptTo.getTime() === endDate.getTime() &&
            (note ?? "") === (sleepEntry.note ?? "")
        ) return false;
        return true;
    }, [sleepDate, sleptFrom, sleptTo, note]);

    const closeForm = () => {
        setIsOpen(false);
        setSleepDate(startDate);
        setSleptFrom(startDate);
        setSleptTo(endDate);
        setNote(sleepEntry.note ?? '');
    }

    const handleSubmit = async () => {
        if (!canSubmit) return;

        const startAt = new Date(sleepDate!);
        startAt.setHours(
            sleptFrom!.getHours(),
            sleptFrom!.getMinutes(),
            sleptFrom!.getSeconds(),
            sleptFrom!.getMilliseconds()
        );

        const endAt = new Date(sleepDate!);
        endAt.setHours(
            sleptTo!.getHours(),
            sleptTo!.getMinutes(),
            sleptTo!.getSeconds(),
            sleptTo!.getMilliseconds()
        );

        if (endAt.getTime() <= startAt.getTime()) {
            endAt.setDate(endAt.getDate() + 1);
        }

        editSleepSession(sleepEntry.id, {
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            note: note ?? null,
        }).then(() => {
            toast.show({
                label: 'Updated.',
                description: `Sleep entry from ${formatDate(startAt)} has been updated.`,
                variant: 'success',
            });
        }).catch(() => {
            toast.show({
                label: 'Error',
                description: 'Failed to update sleep entry. Please try again.',
                variant: 'danger',
            });
        }).finally(() => {
            closeForm();
        });

    };

    const now = new Date();
    return (
        <BottomSheet isOpen={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : closeForm()}>
            <BottomSheet.Trigger className="flex flex-row items-center gap-1">
                <Text>Edit</Text>
                <Edit2Icon color={foregroundColor} size={14} />
            </BottomSheet.Trigger>
            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content contentContainerClassName="flex flex-col gap-4">
                    <View>
                        <BottomSheet.Title>Edit Sleep</BottomSheet.Title>
                        <BottomSheet.Description>Update your sleep session details</BottomSheet.Description>
                    </View>
                    <DateTimePicker
                        value={sleepDate}
                        placeholder="Select a date"
                        onValueChange={setSleepDate}
                        label="Day"
                        maximumDate={now}
                        mode="date"
                        display="spinner"
                        formatValue={(date) => formatDate(date)}
                        variant="secondary"
                        rightIcon={sleepDate && <XIcon color={mutedColor} size={16} />}
                        rightIconOnPress={() => { setSleepDate(undefined) }}
                    />
                    <DateTimePicker
                        value={sleptFrom}
                        placeholder="Select start time"
                        onValueChange={setSleptFrom}
                        label="Slept From"
                        maximumDate={now}
                        mode="time"
                        formatValue={(date) => formatTime(date)}
                        variant="secondary"
                        rightIcon={sleptFrom?.getDate() && <XIcon color={mutedColor} size={16} />}
                        rightIconOnPress={() => { setSleptFrom(undefined) }}
                    />
                    <DateTimePicker
                        value={sleptTo}
                        placeholder="Select end time"
                        onValueChange={setSleptTo}
                        label="Slept To"
                        maximumDate={now}
                        mode="time"
                        formatValue={(date) => formatTime(date)}
                        variant="secondary"
                        rightIcon={sleptTo && <XIcon color={mutedColor} size={16} />}
                        rightIconOnPress={() => { setSleptTo(undefined) }}
                    />
                    <TextField>
                        <Label>Sleep Note</Label>
                        <BottomSheetTextInput
                            value={note}
                            onChangeText={(text) => setNote(text.trim())}
                            variant="secondary"
                            placeholder="Add a sleep note"
                        />
                    </TextField>
                    <SubmitButton />
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    )
}
const DeleteSleep = ({ sleepEntry, startDate, endDate, deleteSleepSession }: DeleteSleepProps) => {
    const { toast } = useToast();
    const dangerColor = useThemeColor('danger');
    const [isOpen, setIsOpen] = useState(false)
    const handleDelete = async () => {
        deleteSleepSession(sleepEntry.id).then(() => {
            toast.show({
                label: 'Deleted.',
                description: `Sleep entry from ${formatDate(startDate)}. has been removed.`,
                variant: 'success',
            });
        }).catch((e) => {
            toast.show({
                label: 'Error',
                description: 'Failed to delete sleep entry. Please try again.',
                variant: 'danger',
            });
        }).finally(() => {
            setIsOpen(false);
        });
    }

    return (
        <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger className="flex flex-row items-center gap-1">
                <Text className="text-danger">Delete</Text>
                <Trash2Icon color={dangerColor} size={14} />
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content className="flex flex-col gap-4">
                    <View>
                        <View className="flex flex-row-reverse justify-between items-center">
                            <Dialog.Close variant="ghost" />
                            <Dialog.Title>Are you sure?</Dialog.Title>
                        </View>
                        <Dialog.Description>Do you want to remove this sleep entry?</Dialog.Description>
                    </View>
                    <View>
                        <Text className="font-semibold">{DAYS[startDate.getDay()]}, {MONTHS[startDate.getMonth()]} {startDate.getDate()}</Text>
                        <Text>{formatTime(startDate)} - {formatTime(endDate)}</Text>
                    </View>
                    <View className="flex flex-col gap-2">
                        <Button variant="danger" onPress={handleDelete}><Button.Label>Delete</Button.Label></Button>
                        <Button variant="tertiary" onPress={() => setIsOpen(false)}><Button.Label>Cancel</Button.Label></Button>
                    </View>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    )
}