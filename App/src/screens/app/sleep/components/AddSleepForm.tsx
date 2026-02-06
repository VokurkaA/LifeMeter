import {Button, TextField, Label, useThemeColor, useToast} from "heroui-native";
import {SleepSession} from "@/types/types";
import {useState} from "react";
import {BottomSheetScrollView} from "@gorhom/bottom-sheet";
import DateTimePicker from "@/components/DateTimePicker";
import {X} from "lucide-react-native";
import {BottomSheetTextInput} from "@/components/BottomSheetTextInput";
import {formatDate, formatTime, timeToDate} from "@/lib/dateTime";

interface NewSleepScreenProps {
    session: SleepSession | null,
    createSleepSession: (startAt: string, endAt?: string, note?: string) => Promise<void>,
    editSleepSession: (id: string, patch: {
        startAt?: string
        endAt?: string | null
        note?: string | null
    }) => Promise<void>,
    closeSheet: () => void
}

export const AddSleepForm = ({
                                   session, createSleepSession, editSleepSession, closeSheet
                               }: NewSleepScreenProps) => {
    const {toast} = useToast();

    const mutedColor = useThemeColor("muted");
    const placeholderColor = useThemeColor("field-placeholder")

    const isEditing = !!session;

    const [date, setDate] = useState<Date>(timeToDate(session?.startAt) ?? new Date());
    const [startAt, setStartAt] = useState<Date | undefined>(timeToDate(session?.startAt) ?? new Date());
    const [endAt, setEndAt] = useState<Date | undefined>(timeToDate(session?.endAt));
    const [note, setNote] = useState<string | undefined>(session?.note ?? undefined);

    const isTimeInvalid = startAt && endAt && startAt.getTime() > endAt.getTime();

    const isDisabled = !startAt || startAt.toISOString() === endAt?.toISOString() || isTimeInvalid || (isEditing && session && startAt.toISOString() === session.startAt && (endAt?.toISOString() ?? null) === (session.endAt ?? null) && (note ?? null) === (session.note ?? null));

    const handleDateChange = (newDate?: Date) => {
        if (!newDate) return;
        setDate(newDate);

        if (startAt) {
            const newStart = new Date(startAt);
            newStart.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
            setStartAt(newStart);
        }

        if (endAt) {
            const newEnd = new Date(endAt);
            const diffDays = startAt ? Math.floor((endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            newEnd.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate() + diffDays);
            setEndAt(newEnd);
        }
    };

    const handleStartAtChange = (newTime?: Date) => {
        if (!newTime) return;
        const newStart = new Date(date);
        newStart.setHours(newTime.getHours(), newTime.getMinutes(), 0, 0);
        setStartAt(newStart);

        if (endAt) {
            const newEnd = new Date(newStart);
            newEnd.setHours(endAt.getHours(), endAt.getMinutes(), 0, 0);
            if (newEnd <= newStart) {
                newEnd.setDate(newEnd.getDate() + 1);
            }
            setEndAt(newEnd);
        }
    };

    const handleEndAtChange = (newTime?: Date) => {
        if (!newTime) return;
        const newEnd = new Date(startAt ?? date);
        newEnd.setHours(newTime.getHours(), newTime.getMinutes(), 0, 0);

        if (startAt && newEnd <= startAt) {
            newEnd.setDate(newEnd.getDate() + 1);
        }
        setEndAt(newEnd);
    };

    return (<BottomSheetScrollView
        contentContainerClassName="gap-4 pb-24"
        keyboardShouldPersistTaps="handled"
    >
        <DateTimePicker
            value={date}
            onValueChange={handleDateChange}
            label="Day"
            placeholder="Select day"
            mode="date"
            formatValue={formatDate}
            variant="secondary"
        />
        <DateTimePicker
            value={startAt}
            onValueChange={handleStartAtChange}
            label="Slept from"
            placeholder="Select start time"
            mode="time"
            formatValue={formatTime}
            rightIcon={startAt && <X color={mutedColor} size={18}/>}
            rightIconOnPress={() => setStartAt(undefined)}
            variant="secondary"
        />
        <DateTimePicker
            value={endAt}
            onValueChange={handleEndAtChange}
            label="Slept to"
            placeholder="Select end time"
            mode="time"
            formatValue={formatTime}
            isInvalid={isTimeInvalid}
            errorMessage="Wake up time must be after bed time"
            rightIcon={endAt && <X color={mutedColor} size={18}/>}
            rightIconOnPress={() => setEndAt(undefined)}
            variant="secondary"
        />
        <TextField>
            <Label>Description</Label>
            <BottomSheetTextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add sleep notes"
                placeholderTextColor={placeholderColor}
                variant="secondary"
            />
        </TextField>
        <Button
            className="mt-4"
            variant="primary"
            isDisabled={isDisabled}
            onPress={async () => {
                const startAtStr = startAt?.toISOString();
                const endAtStr = endAt?.toISOString();
                if (!startAtStr) return;

                try {
                    if (!isEditing) {
                        await createSleepSession(startAtStr, endAtStr, note);
                        toast.show({
                            variant: "success",
                            label: 'Sleep entry added',
                            description: 'Your sleep session has been saved.',
                        });
                    } else if (session) {
                        await editSleepSession(session.id, {
                            startAt: startAtStr, endAt: endAtStr, note
                        });
                        toast.show({
                            variant: "success",
                            label: 'Sleep entry updated',
                            description: 'Your sleep session has been updated.',
                        });
                    }
                    closeSheet();
                } catch (error) {
                    toast.show({
                        variant: 'danger',
                        label: `Failed to ${isEditing ? 'update' : 'add'} sleep entry`,
                        description: error instanceof Error ? error.message : 'An error occurred.',
                    });
                }
            }}
        >
            <Button.Label>{isEditing ? "Update" : endAt ? "Add" : "Start"}</Button.Label>
        </Button>
    </BottomSheetScrollView>)
}

