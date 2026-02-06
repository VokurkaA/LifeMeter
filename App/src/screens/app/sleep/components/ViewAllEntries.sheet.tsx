import { BottomSheet, Card, PressableFeedback, useThemeColor } from "heroui-native";
import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import SleepList from "./SleepList";
import { SleepSession } from "@/types/types";

interface ViewAllEntriesProps {
    sleepSessions: SleepSession[];
    deleteSleepSession: (id: string) => Promise<void>;
    createSleepSession: (startAt: string, endAt?: string, note?: string) => Promise<void>;
    editSleepSession: (id: string, patch: { startAt?: string; endAt?: string | null; note?: string | null }) => Promise<void>;
}

export default function ViewAllEntries({ sleepSessions, deleteSleepSession, createSleepSession, editSleepSession }: ViewAllEntriesProps) {
    const mutedColor = useThemeColor('muted');
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <PressableFeedback onPress={() => setIsOpen(true)}>
                <Card className="gap-2">
                    <Card.Body className="flex-row justify-between items-center">
                        <Card.Title>View all entries</Card.Title>
                        <ChevronRight size={20} color={mutedColor} />
                    </Card.Body>
                </Card>
            </PressableFeedback>

            <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
                <BottomSheet.Portal>
                    <BottomSheet.Overlay />
                    <BottomSheet.Content snapPoints={['90%']}>
                        <BottomSheet.Title className="mb-4">Sleep History</BottomSheet.Title>
                        <SleepList 
                            sleepSessions={sleepSessions} 
                            deleteSleepSession={deleteSleepSession}
                            createSleepSession={createSleepSession}
                            editSleepSession={editSleepSession}
                        />
                    </BottomSheet.Content>
                </BottomSheet.Portal>
            </BottomSheet>
        </>
    );
}