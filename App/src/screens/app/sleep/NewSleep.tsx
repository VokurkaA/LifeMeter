import {Button, TextField, useThemeColor, useToast} from "heroui-native";
import {SleepSession} from "@/types/types";
import {useState} from "react";
import {BottomSheetScrollView} from "@gorhom/bottom-sheet";
import DateTimePicker from "@/components/DateTimePicker";
import {PlusIcon, X} from "lucide-react-native";
import { BottomSheetTextInput } from "@/components/BottomSheetTextInput";
import {formatTime, timeToDate} from "@/lib/dateTime";

interface NewSleepScreenProps {
    ongoingSleepSession: SleepSession | null,
    createSleepSession: (startAt: string, endAt?: string, note?: string) => Promise<void>,
    editSleepSession: (id: string, patch: {
        startAt?: string
        endAt?: string | null
        note?: string | null
    }) => Promise<void>,
    closeSheet: () => void
}

export const NewSleepScreen = ({
                                   ongoingSleepSession, createSleepSession, editSleepSession, closeSheet
                               }: NewSleepScreenProps) => {
    const {toast} = useToast();

    const mutedColor = useThemeColor("muted");
    const placeholderColor = useThemeColor("field-placeholder")
    const foregroundColor = useThemeColor("foreground");

    const isNew = !ongoingSleepSession;

    const [startAt, setStartAt] = useState<Date | undefined>(timeToDate(ongoingSleepSession?.startAt) ?? new Date());
    const [endAt, setEndAt] = useState<Date | undefined>(timeToDate(ongoingSleepSession?.endAt));
    const [note, setNote] = useState<string | undefined>(ongoingSleepSession?.note ?? undefined);

    const isDisabled = !startAt || startAt.toISOString() === endAt?.toISOString() || (!isNew && ongoingSleepSession && startAt?.toISOString() === ongoingSleepSession.startAt && (endAt?.toISOString() ?? null) === (ongoingSleepSession.endAt ?? null) && (note ?? null) === (ongoingSleepSession.note ?? null));

    return (<BottomSheetScrollView
        contentContainerClassName="gap-4 pb-24"
        keyboardShouldPersistTaps="handled"
    >
        <DateTimePicker
            value={startAt}
            onValueChange={setStartAt}
            label="Slept from"
            placeholder="Select start time"
            mode="time"
            formatValue={formatTime}
            rightIcon={startAt && <X color={mutedColor} size={18}/>}
            rightIconOnPress={() => setStartAt(undefined)}
        />
        <DateTimePicker
            value={endAt}
            onValueChange={setEndAt}
            label="Slept to"
            placeholder="Select end time"
            mode="time"
            formatValue={formatTime}
            rightIcon={endAt && <X color={mutedColor} size={18}/>}
            rightIconOnPress={() => setEndAt(undefined)}
        />
        <TextField>
            <TextField.Label>Description</TextField.Label>
            <BottomSheetTextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add sleep notes"
                placeholderTextColor={placeholderColor}
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
                if (isNew) {
                    try {
                        await createSleepSession(startAtStr, endAtStr, note);
                        toast.show({
                            variant: "success",
                            label: 'Sleep entry added',
                            description: 'Your sleep session has been saved.',
                            icon: <PlusIcon color={foregroundColor} size={20}/>,
                            actionLabel: 'Close',
                            onActionPress: ({hide}) => hide(),
                        });
                        if (endAt) closeSheet();
                    } catch (error) {
                        toast.show({
                            variant: 'danger',
                            label: 'Failed to add sleep entry',
                            description: error instanceof Error ? error.message : 'An error occurred.',
                            actionLabel: 'Close',
                            onActionPress: ({hide}) => hide(),
                        });
                    }
                    if (endAt) closeSheet();
                } else {
                    await editSleepSession(ongoingSleepSession?.id, {
                        startAt: startAtStr, endAt: endAtStr, note
                    });
                    closeSheet();
                }
            }}
        >
            <Button.Label>{isNew ? endAt ? "Add" : "Start" : "Edit"}</Button.Label>
        </Button>
    </BottomSheetScrollView>)
}

