import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useSleepStore } from '@/contexts/useSleepStore';
import { useUserStore } from '@/contexts/useUserStore';
import { SleepCard } from './components/SleepCard';
import AddSleep from './components/AddSleep.sheet';
import { AverageDuration } from './components/cards/AverageDuration';
import { AverageStats } from './components/cards/AverageStats';
import { ConsistencyCard } from './components/cards/ConsistencyCard';
import ViewAllEntries from './components/ViewAllEntries.sheet';
import MainLayout from '@/layouts/Main.layout';

const timeToDate = (timeStr?: string | null) => {
    if (!timeStr) return undefined;
    const [hours, minutes] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return d;
};

export default function SleepScreen() {
    const {
        sleepSessions,
        startSleep,
        endSleep,
        createSleepSession,
        editSleepSession,
        deleteSleepSession,
        ongoingSleepSession,
    } = useSleepStore();

    const { userGoals } = useUserStore();

    return (
        <MainLayout>
            <SleepCard
                bedTime={timeToDate(userGoals?.bedtimeGoal)}
                wakeUpTime={timeToDate(userGoals?.wakeupGoal)}
                ongoingSleepSession={ongoingSleepSession ?? null}
                startSleep={startSleep}
                endSleep={endSleep}
            />

            <AddSleep
                createSleepSession={createSleepSession}
                editSleepSession={editSleepSession}
                ongoingSleepSession={ongoingSleepSession ?? null}
            />

            <AverageDuration
                sleepSessions={sleepSessions}
                dayAmount={1000}
            />

            <View className='flex-row gap-4'>
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
                userGoals={userGoals ?? null}
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
