import { useMemo, useState } from "react";
import { SleepSession } from "@/types/types";
import { BottomSheet, Card, PressableFeedback, Tabs, useThemeColor } from "heroui-native";
import { ChevronRight } from "lucide-react-native";
import { View } from "react-native";
import { Muted } from "@/components/Text";
import { timestampToDate } from "@/lib/dateTime";
import { ChartData, LineChart } from "@/components/graphs/Chart";

interface AverageDurationProps {
    sleepSessions: SleepSession[];
    onPress?: () => void;
    dayAmount?: number;
    className?: string;
}

export const AverageDuration = ({ sleepSessions, onPress, dayAmount = 7, className }: AverageDurationProps) => {
    const mutedColor = useThemeColor('muted');
    const [selectedDayAmount, setSelectedDayAmount] = useState(dayAmount);

    const { averageDailyDuration, dayCount, chartData } = useMemo(() => {
        let totalLengthMs = 0;
        let count = 0;
        const chartData: ChartData[] = [];

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - selectedDayAmount);

        let date = new Date();

        sleepSessions.forEach(session => {
            const startDate = timestampToDate(session.startAt);
            const endDate = session.endAt ? timestampToDate(session.endAt) : new Date();
            if (!startDate || !endDate || startDate < cutoffDate) return;

            const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
            totalLengthMs += durationHours * 60 * 60 * 1000;

            const isSameDay =
                date.getFullYear() === startDate.getFullYear() &&
                date.getMonth() === startDate.getMonth() &&
                date.getDate() === startDate.getDate();

            if (isSameDay) {
                chartData[chartData.length - 1].value += durationHours;
            } else {
                // const daysDelta = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                // const prevValue = chartData.length > 0 ? chartData[chartData.length - 1].value : durationHours;

                // for (let i = 1; i < daysDelta; i++) {
                //     const interpolatedValue = prevValue + ((durationHours - prevValue) * (i / daysDelta));
                //     const missingDate = new Date(date);
                //     missingDate.setDate(date.getDate() - i);

                //     chartData.push({
                //         value: interpolatedValue,
                //         label: missingDate.getDate().toString()
                //     });
                // }

                chartData.push({
                    value: durationHours,
                    label: startDate.getDate().toString()
                });

                count++;
                date = startDate;
            }
        });

        return {
            averageDailyDuration: count === 0 ? undefined : new Date(totalLengthMs / count),
            dayCount: count,
            chartData: chartData.reverse()
        };
    }, [sleepSessions, selectedDayAmount]);



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
                                    {averageDailyDuration?.getHours() ?? '--'}h {averageDailyDuration?.getMinutes() ?? '--'}m
                                </Card.Title>
                            </View>
                        </Card.Body>
                        <Card.Footer>
                            <Card.Description>
                                <Muted>Based on {dayCount} total sessions {selectedDayAmount ? `(last ${selectedDayAmount}d)` : ''}</Muted>
                            </Card.Description>
                        </Card.Footer>
                    </Card>
                </PressableFeedback>
            </BottomSheet.Trigger>
            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content>
                    <Tabs value={selectedDayAmount.toString()} onValueChange={(val) => setSelectedDayAmount(Number(val))}>
                        <Tabs.List>
                            <Tabs.ScrollView contentContainerClassName="flex-1 justify-around">
                                <Tabs.Indicator />
                                <Tabs.Trigger value="7">
                                    <Tabs.Label>7 Days</Tabs.Label>
                                </Tabs.Trigger>
                                <Tabs.Trigger value="30">
                                    <Tabs.Label>30 Days</Tabs.Label>
                                </Tabs.Trigger>
                                <Tabs.Trigger value="90">
                                    <Tabs.Label>90 Days</Tabs.Label>
                                </Tabs.Trigger>
                            </Tabs.ScrollView>
                        </Tabs.List>
                        <Tabs.Content value={selectedDayAmount.toString()}>
                            <LineChart
                                data={chartData}
                                showAverage
                                curveType="curved"
                            />
                        </Tabs.Content>
                    </Tabs>
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
}