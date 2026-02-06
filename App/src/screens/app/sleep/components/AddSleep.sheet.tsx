import { BottomSheet, Button, useThemeColor } from "heroui-native";
import { PlusIcon } from "lucide-react-native";
import { useState } from "react";
import { AddSleepForm } from "./AddSleepForm";
import { SleepSession } from "@/types/types";

interface AddSleepProps {
    createSleepSession: (startAt: string, endAt?: string, note?: string) => Promise<void>;
    editSleepSession: (id: string, patch: { startAt?: string; endAt?: string | null; note?: string | null }) => Promise<void>;
    ongoingSleepSession: SleepSession | null;
}

export default function AddSleep({ createSleepSession, editSleepSession, ongoingSleepSession }: AddSleepProps) {
    const foregroundColor = useThemeColor('foreground');
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

    return (
        <BottomSheet isOpen={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
            <BottomSheet.Trigger asChild>
                <Button variant="tertiary">
                    <PlusIcon color={foregroundColor} size={20} />
                    <Button.Label>Add a sleep entry</Button.Label>
                </Button>
            </BottomSheet.Trigger>
            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content
                    snapPoints={['90%']}
                    keyboardBehavior="extend"
                >
                    <BottomSheet.Title>Sleep</BottomSheet.Title>
                    <BottomSheet.Description className="mb-2">Add a sleep entry</BottomSheet.Description>
                    <AddSleepForm
                        session={ongoingSleepSession}
                        createSleepSession={createSleepSession}
                        editSleepSession={editSleepSession}
                        closeSheet={() => setIsAddSheetOpen(false)}
                    />
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
}