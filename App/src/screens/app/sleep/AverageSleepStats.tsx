import {useMemo} from "react";
import {SleepSession} from "@/types/types";
import {Card, PressableFeedback} from "heroui-native";

interface AverageStatsProps {
    sleepSessions: SleepSession[];
    dayAmount: number;
    state: 'wakeup' | 'bedtime';
    className?: string;
}

export const AverageStats = ({sleepSessions, dayAmount, state, className}: AverageStatsProps) => {
    const averageTime = useMemo(() => {
        const now = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - dayAmount);

        const validSessions = sleepSessions.filter(s => {
            const sessionDate = new Date(s.endAt || s.startAt);
            return sessionDate >= cutoffDate && s.endAt;
        });

        if (validSessions.length === 0) return "--:--";
        let totalMinutes = 0;
        validSessions.forEach(session => {
            const dateStr = state === 'bedtime' ? session.startAt : session.endAt;
            if (!dateStr) return;

            const date = new Date(dateStr);
            const hours = date.getHours();
            const minutes = date.getMinutes();

            let minutesFromMidnight = hours * 60 + minutes;
            if (state === 'bedtime' && hours < 12) {
                minutesFromMidnight += 24 * 60;
            }
            totalMinutes += minutesFromMidnight;
        });

        let avgTotalMinutes = totalMinutes / validSessions.length;
        if (avgTotalMinutes >= 24 * 60) {
            avgTotalMinutes -= 24 * 60;
        }

        const avgHours = Math.floor(avgTotalMinutes / 60);
        const avgMinutes = Math.round(avgTotalMinutes % 60);

        return `${String(avgHours).padStart(2, '0')}:${String(avgMinutes).padStart(2, '0')}`;

    }, [sleepSessions, dayAmount, state]);

    const isBedtime = state === 'bedtime';

    return (<PressableFeedback className={className}>
        <Card className='gap-2'>
            <Card.Header>
                <Card.Title>
                    Average {isBedtime ? 'Bedtime' : 'Wakeup'}
                </Card.Title>
            </Card.Header>
            <Card.Body>
                <Card.Title className="text-3xl font-bold">
                    {averageTime}
                </Card.Title>
            </Card.Body>
            <Card.Footer>
                <Card.Description className="text-xs">
                    Avg. {isBedtime ? 'bedtime' : 'wakeup'} (7d)
                </Card.Description>
            </Card.Footer>
        </Card>
    </PressableFeedback>);
}