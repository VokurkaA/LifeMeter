import MainLayout from "@/layouts/Main.layout";
import { BottomSheet, Button, useThemeColor } from "heroui-native";
import { PlusIcon } from "lucide-react-native";
import { useStore } from "@/contexts/useStore";
import { View } from "react-native";
import { TimeCard } from "@/screens/app/sleep/TimeCard";
import { useState } from "react";
import { AverageStats } from "@/screens/app/sleep/AverageSleepStats";
import { NewSleepScreen } from "@/screens/app/sleep/NewSleep";
import { AverageDurationCard } from "@/screens/app/sleep/AverageDurationCard";
import { timeToDate } from "@/lib/dateTime";
import { ConsistencyCard } from "@/screens/app/sleep/ConsistencyCard";
import { HistoryCard } from "@/screens/app/sleep/HistoryCard";
import { navigate } from "@/navigation/navigate";

export default function SleepScreen() {
    const foregroundColor = useThemeColor('foreground');
    const { sleepSessions, createSleepSession, editSleepSession, ongoingSleepSession, userGoals } = useStore();

    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

    return (<MainLayout>
        <View className="gap-4 mb-8">
            <TimeCard
                bedTime={timeToDate(userGoals?.bedtimeGoal)}
                wakeUpTime={timeToDate(userGoals?.wakeupGoal)}
            />

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
                        <NewSleepScreen
                            session={ongoingSleepSession}
                            createSleepSession={createSleepSession}
                            editSleepSession={editSleepSession}
                            closeSheet={() => setIsAddSheetOpen(false)}
                        />
                    </BottomSheet.Content>
                </BottomSheet.Portal>
            </BottomSheet>

            <AverageDurationCard
                sleepSessions={sleepSessions}
                dayAmount={7}
            />
            <View className="flex-row gap-4">
                <AverageStats
                    className="flex-1"
                    sleepSessions={sleepSessions}
                    dayAmount={7}
                    state='bedtime'
                />
                <AverageStats
                    className="flex-1"
                    sleepSessions={sleepSessions}
                    dayAmount={7}
                    state='wakeup'
                />
            </View>

            <ConsistencyCard
                sleepSessions={sleepSessions}
                userGoals={userGoals}
                dayAmount={7}
            />

            <HistoryCard
                totalCount={sleepSessions.length}
                onPress={() => navigate('SleepList')}
            />

        </View>
    </MainLayout>);
}
