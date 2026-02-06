import MainLayout from "@/layouts/Main.layout";
import { View } from "react-native";
import { useStore } from "@/contexts/useStore";
import { timeToDate } from "@/lib/dateTime";
import AddSleep from "./components/AddSleep.sheet";
import { AverageStats } from "./components/AverageStats";
import ViewAllEntries from "./components/ViewAllEntries.sheet";
import { ConsistencyCard } from "./components/ConsistencyCard";
import { SleepCard } from "./components/SleepCard";
import { AverageDuration } from "./components/AverageDuration";

export default function SleepScreen() {
    const { 
        sleepSessions, 
        userGoals, 
        startSleep, 
        endSleep, 
        createSleepSession, 
        editSleepSession, 
        deleteSleepSession, 
        ongoingSleepSession 
    } = useStore();

    return (
        <MainLayout>
            <SleepCard
                bedTime={timeToDate(userGoals?.bedtimeGoal)}
                wakeUpTime={timeToDate(userGoals?.wakeupGoal)}
                ongoingSleepSession={ongoingSleepSession}
                startSleep={startSleep}
                endSleep={endSleep}
            />

            <AddSleep 
                createSleepSession={createSleepSession}
                editSleepSession={editSleepSession}
                ongoingSleepSession={ongoingSleepSession}
            />

            <AverageDuration
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

            <ViewAllEntries 
                sleepSessions={sleepSessions}
                createSleepSession={createSleepSession}
                editSleepSession={editSleepSession}
                deleteSleepSession={deleteSleepSession}
            />
        </MainLayout>
    );
}
