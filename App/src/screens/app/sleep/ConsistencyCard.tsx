import { SleepSession } from "@/types/types";
import { UserGoal } from "@/types/user.profile.types";
import { Card, PressableFeedback, useThemeColor } from "heroui-native";
import { useMemo } from "react";
import { View } from "react-native";
import { Muted } from "@/components/Text";
import { ChevronRight } from "lucide-react-native";
import { navigate } from "@/navigation/navigate";

interface ConsistencyCardProps {
    sleepSessions: SleepSession[];
    userGoals: UserGoal | null;
    dayAmount?: number;
    onPress?: () => void;
}

const TOLERANCE_MINUTES = 15;

export function ConsistencyCard({ sleepSessions, userGoals, dayAmount = 7, onPress }: ConsistencyCardProps) {
    const mutedColor = useThemeColor('muted');

    const { consistentDays, totalDays } = useMemo(() => {
        if (!userGoals?.bedtimeGoal || !userGoals?.wakeupGoal) {
            return { consistentDays: 0, totalDays: 0 };
        }

        const now = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - dayAmount);

        const validSessions = sleepSessions.filter(s => {
            if (!s.startAt || !s.endAt) return false;
            const sessionDate = new Date(s.endAt); 
            return sessionDate >= cutoffDate;
        });

        if (validSessions.length === 0) return { consistentDays: 0, totalDays: 0 };

        let hitCount = 0;

        validSessions.forEach(session => {
            if (!session.startAt || !session.endAt) return;

            const startAt = new Date(session.startAt);
            const endAt = new Date(session.endAt);

            const bedtimeHit = isTimeWithinTolerance(startAt, userGoals.bedtimeGoal!, TOLERANCE_MINUTES);
            const wakeupHit = isTimeWithinTolerance(endAt, userGoals.wakeupGoal!, TOLERANCE_MINUTES);

            if (bedtimeHit && wakeupHit) {
                hitCount++;
            }
        });

        return { consistentDays: hitCount, totalDays: validSessions.length };

    }, [sleepSessions, userGoals, dayAmount]);

    const percentage = totalDays > 0 ? Math.round((consistentDays / totalDays) * 100) : 0;

    return (
        <PressableFeedback onPress={onPress}>
            <Card className="gap-2">
                <Card.Header className="flex-row justify-between items-center">
                    <Card.Title>
                        Sleep Consistency
                    </Card.Title>
                    <ChevronRight size={20} color={mutedColor}/>
                </Card.Header>
                <Card.Body className="gap-1">
                    <View className="flex-row items-center gap-2">
                        <Card.Title className="text-3xl font-bold">
                            {percentage}%
                        </Card.Title>
                    </View>
                </Card.Body>
                <Card.Footer>
                     <Card.Description>
                        <Muted>{consistentDays}/{totalDays} goals met (last {dayAmount} days)</Muted>
                    </Card.Description>
                </Card.Footer>
            </Card>
        </PressableFeedback>
    )
}

function isTimeWithinTolerance(date: Date, goalTimeStr: string, toleranceMinutes: number): boolean {
    const [goalH, goalM] = goalTimeStr.split(':').map(Number);
    
    const goalDate = new Date(date);
    goalDate.setHours(goalH, goalM, 0, 0);

    let diffMs = date.getTime() - goalDate.getTime();
    let diffMins = diffMs / (1000 * 60);

    if (diffMins > 720) {
        diffMins -= 1440;
    } else if (diffMins < -720) {
        diffMins += 1440;
    }

    return Math.abs(diffMins) <= toleranceMinutes;
}
