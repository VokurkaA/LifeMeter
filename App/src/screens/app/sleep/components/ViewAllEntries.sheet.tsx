import { Accordion, BottomSheet, Card, PressableFeedback, useThemeColor } from "heroui-native";
import { ChevronRight } from "lucide-react-native";
import { SleepSession } from "@/types/types";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Text } from "@/components/Text";
import SleepEntry from "./SleepEntry";
import { useCallback } from "react";

interface ViewAllEntriesProps {
    sleepSessions: SleepSession[];
    deleteSleepSession: (id: string) => Promise<void>;
    createSleepSession: (startAt: string, endAt?: string, note?: string) => Promise<void>;
    editSleepSession: (id: string, patch: { startAt?: string; endAt?: string | null; note?: string | null }) => Promise<void>;
}

export default function ViewAllEntries({ sleepSessions, deleteSleepSession, createSleepSession, editSleepSession }: ViewAllEntriesProps) {
    const mutedColor = useThemeColor('muted');

    const keyExtractor = useCallback((item: SleepSession) => item.id, []);

    const renderItem = useCallback(
        ({ item }: { item: SleepSession }) => (
            <SleepEntry
                item={item}
                deleteSleepSession={deleteSleepSession}
                createSleepSession={createSleepSession}
                editSleepSession={editSleepSession}
            />
        ),
        [deleteSleepSession, createSleepSession, editSleepSession]
    );

    return (
        <BottomSheet>
            <BottomSheet.Trigger asChild>
                <PressableFeedback>
                    <Card className="gap-2">
                        <Card.Body className="flex-row justify-between items-center">
                            <Card.Title>View all entries</Card.Title>
                            <ChevronRight size={20} color={mutedColor} />
                        </Card.Body>
                    </Card>
                </PressableFeedback>
            </BottomSheet.Trigger>

            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content
                    enablePanDownToClose
                    index={1}
                    snapPoints={['60%', '90%']}
                    contentContainerClassName="h-full flex-1"
                >
                    <Accordion className="flex-1" selectionMode="multiple" hideSeparator>
                        <BottomSheet.Title className="mb-4">Sleep History</BottomSheet.Title>

                        <BottomSheetFlatList
                            showVerticalScrollIndicator={false}
                            className="flex-1"
                            data={sleepSessions}
                            keyExtractor={keyExtractor}
                            renderItem={renderItem}
                            removeClippedSubviews
                            ListEmptyComponent={
                                <Text className="text-center mt-8 text-muted">No sleep data available.</Text>
                            }
                        />
                    </Accordion>
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
}