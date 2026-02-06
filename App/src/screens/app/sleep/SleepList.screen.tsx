import React from 'react';
import { useStore } from '@/contexts/useStore';
import SleepList from './components/SleepList';

export default function SleepListScreen() {
    const { 
        sleepSessions, 
        deleteSleepSession, 
        createSleepSession, 
        editSleepSession 
    } = useStore();

    return (
        <SleepList 
            sleepSessions={sleepSessions}
            deleteSleepSession={deleteSleepSession}
            createSleepSession={createSleepSession}
            editSleepSession={editSleepSession}
        />
    );
}
