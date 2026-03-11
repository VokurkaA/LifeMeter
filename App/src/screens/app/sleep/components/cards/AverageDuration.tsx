import { useMemo, useState } from "react";
import { SleepSession } from "@/types/types";
import { BottomSheet, Card, PressableFeedback, Tabs, useThemeColor } from "heroui-native";
import { ChevronRight } from "lucide-react-native";
import { View } from "react-native";
import { H3, Muted, Text } from "@/components/Text";
import { LineChart } from "@/components/graphs/Chart";
import { timeToDate } from "@/lib/dateTime";

interface AverageDurationProps {
    sleepSessions: SleepSession[];
    onPress?: () => void;
    dayAmount?: number;
    className?: string;
}

const formatDuration = (totalHours: number) => {
    if (isNaN(totalHours) || totalHours === 0) return "--h --m";
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
};

export const AverageDuration = ({ sleepSessions, onPress, dayAmount = 7, className }: AverageDurationProps) => {
    const mutedColor = useThemeColor('muted');
    const [selectedDayAmount, setSelectedDayAmount] = useState(dayAmount);

    const { averageHours, dayCount, chartData } = useMemo(() => {
        const dayMap = new Map<string, number>();

        const sorted = [...sleepSessions].sort(
            (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        );

        for (const session of sorted) {
            if (!session.endAt) continue;
            const start = new Date(session.startAt);
            const end = new Date(session.endAt);
            const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            if (durationHours <= 0) continue;
            const key = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
            dayMap.set(key, (dayMap.get(key) ?? 0) + durationHours);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days = Array.from({ length: selectedDayAmount }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (selectedDayAmount - 1 - i));
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return { date: d, key };
        });

        const rawValues: (number | null)[] = days.map(d => dayMap.get(d.key) ?? null);

        const daysWithData = rawValues.filter((v): v is number => v !== null);
        const dayCount = daysWithData.length;
        const averageHours = dayCount > 0
            ? daysWithData.reduce((sum, v) => sum + v, 0) / dayCount
            : 0;

        const interpolated = [...rawValues];
        const firstDataIdx = interpolated.findIndex(v => v !== null);

        let i = 0;
        while (i < interpolated.length) {
            if (interpolated[i] === null) {
                const gapStart = i;
                while (i < interpolated.length && interpolated[i] === null) i++;
                const gapEnd = i;

                const leftVal = gapStart > 0 ? (interpolated[gapStart - 1] as number) : null;
                const rightVal = gapEnd < interpolated.length ? (interpolated[gapEnd] as number) : null;
                const segLen = gapEnd - gapStart;
                const isLeadingGap = firstDataIdx === -1 || gapStart < firstDataIdx;

                for (let j = gapStart; j < gapEnd; j++) {
                    if (isLeadingGap) {
                        interpolated[j] = 0;
                    } else if (leftVal !== null && rightVal !== null) {
                        const t = (j - gapStart + 1) / (segLen + 1);
                        interpolated[j] = leftVal + (rightVal - leftVal) * t;
                    } else if (leftVal !== null) {
                        interpolated[j] = leftVal;
                    } else {
                        interpolated[j] = 0;
                    }
                }
            } else {
                i++;
            }
        }

        const getLabel = (d: Date, idx: number): string => {
            if (selectedDayAmount === 7) {
                return d.toLocaleDateString('en-US', { weekday: 'short' });
            }
            if (selectedDayAmount === 365) {
                if (d.getDate() === 1 || idx === 0) {
                    return d.toLocaleDateString('en-US', { month: 'short' });
                }
                return '';
            }
            const targetCount = selectedDayAmount === 30 ? 6 : 7;
            const step = Math.round(selectedDayAmount / targetCount);
            if (idx % step === 0 || idx === selectedDayAmount - 1) {
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return '';
        };

        const chartData = days.map((d, idx) => {
            const label = getLabel(d.date, idx);
            return {
                value: interpolated[idx] as number,
                label,
            };
        });

        return { averageHours, dayCount, chartData };
    }, [sleepSessions, selectedDayAmount]);

    const TabTrigger = ({ value }: { value: number }) => {
        return (
            <Tabs.Trigger value={value.toString()} className="flex-1">
                <Tabs.Label className={`${selectedDayAmount === value ? 'text-accent' : ''}`}>{value} Days</Tabs.Label>
            </Tabs.Trigger>
        );
    }

    return (
        <BottomSheet>
            <BottomSheet.Trigger asChild>
                <PressableFeedback onPress={onPress} className={className}>
                    <Card className='gap-2'>
                        <Card.Header className="flex-row justify-between items-center">
                            <Card.Title>Average Duration</Card.Title>
                            <ChevronRight size={20} color={mutedColor} />
                        </Card.Header>
                        <Card.Body className="gap-1">
                            <View className="flex-row items-center gap-2">
                                <Card.Title className="text-3xl font-bold">
                                    {formatDuration(averageHours)}
                                </Card.Title>
                            </View>
                        </Card.Body>
                        <Card.Footer>
                            <Card.Description>
                                <Muted>Based on {dayCount} days with data (last {selectedDayAmount}d)</Muted>
                            </Card.Description>
                        </Card.Footer>
                    </Card>
                </PressableFeedback>
            </BottomSheet.Trigger>

            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content enableContentPanningGesture={false}>
                    <Tabs value={selectedDayAmount.toString()} onValueChange={(val) => setSelectedDayAmount(Number(val))} className="w-full">
                        <Tabs.List className="w-full">
                            <Tabs.Indicator />
                            <TabTrigger value={7} />
                            <TabTrigger value={30} />
                            <TabTrigger value={90} />
                            <TabTrigger value={360} />
                        </Tabs.List>

                        <Tabs.Content value={selectedDayAmount.toString()} className="flex justify-center">
                            <View className="my-4">
                                <H3 className="text-foreground text-center">{formatDuration(averageHours)}</H3>
                                <Text className="text-center">Average Daily Sleep</Text>
                            </View>
                            <LineChart
                                data={chartData}
                                curveType="curved"
                            />
                        </Tabs.Content>
                    </Tabs>
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
}