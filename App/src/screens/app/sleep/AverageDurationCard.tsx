import {useMemo} from "react";
import {SleepSession} from "@/types/types";
import {Card, PressableFeedback, useThemeColor} from "heroui-native";
import {ChevronRight} from "lucide-react-native";
import {View} from "react-native";

interface AverageDurationCardProps {
    sleepSessions: SleepSession[];
    onPress: () => void;
    className?: string;
}

export const AverageDurationCard = ({sleepSessions, onPress, className}: AverageDurationCardProps) => {
    const mutedColor = useThemeColor('muted');

    const {averageDuration, sessionCount} = useMemo(() => {
        if (!sleepSessions.length) return {averageDuration: "-- hr -- min", sessionCount: 0};

        let totalMs = 0;
        let count = 0;

        sleepSessions.forEach(s => {
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
    }, [sleepSessions]);

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
                <Card.Description className="text-xs">
                    Based on {sessionCount} total sessions
                </Card.Description>
            </Card.Footer>
        </Card>
    </PressableFeedback>);
}