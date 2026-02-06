import {useMemo} from "react";
import {SleepSession} from "@/types/types";
import {Card, PressableFeedback, useThemeColor} from "heroui-native";
import {ChevronRight} from "lucide-react-native";
import {View} from "react-native";
import { Muted } from "@/components/Text";

interface AverageDurationProps {
    sleepSessions: SleepSession[];
    onPress?: () => void;
    dayAmount?: number; 
    className?: string;
}

export const AverageDuration = ({sleepSessions, onPress, dayAmount, className}: AverageDurationProps) => {
    const mutedColor = useThemeColor('muted');

    const {averageDuration, sessionCount} = useMemo(() => {
        if (!sleepSessions.length) return {averageDuration: "-- hr -- min", sessionCount: 0};

        let filteredSessions = sleepSessions;
        if (dayAmount) {
            const now = new Date();
            const cutoffDate = new Date();
            cutoffDate.setDate(now.getDate() - dayAmount);
            filteredSessions = sleepSessions.filter(s => {
                const sessionDate = new Date(s.endAt || s.startAt || 0);
                return sessionDate >= cutoffDate;
            });
        }

        let totalMs = 0;
        let count = 0;

        filteredSessions.forEach(s => {
            if (s.startAt && s.endAt) {
                const start = new Date(s.startAt).getTime();
                const end = new Date(s.endAt).getTime();
                const diff = end - start;
                if (diff > 0) {
                    totalMs += diff;
                    count++;
                }
            }
        });

        if (count === 0) return {averageDuration: "-- hr -- min", sessionCount: 0};

        const avgMs = totalMs / count;
        const hours = Math.floor(avgMs / (1000 * 60 * 60));
        const minutes = Math.round((avgMs % (1000 * 60 * 60)) / (1000 * 60));

        return {
            averageDuration: `${hours} hr ${minutes} min`, sessionCount: count
        };
    }, [sleepSessions, dayAmount]);

    return (<PressableFeedback onPress={onPress} className={className}>
        <Card className='gap-2'>
            <Card.Header className="flex-row justify-between items-center">
                <Card.Title>Average Duration</Card.Title>
                <ChevronRight size={20} color={mutedColor}/>
            </Card.Header>
            <Card.Body className="gap-1">
                <View className="flex-row items-center gap-2">
                    <Card.Title className="text-3xl font-bold">
                        {averageDuration}
                    </Card.Title>
                </View>
            </Card.Body>
            <Card.Footer>
                <Card.Description>
                    <Muted>Based on {sessionCount} total sessions {dayAmount ? `(last ${dayAmount}d)` : ''}</Muted>
                </Card.Description>
            </Card.Footer>
        </Card>
    </PressableFeedback>);
}