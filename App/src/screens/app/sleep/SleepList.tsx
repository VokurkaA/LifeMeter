import React, {useCallback} from "react";
import {FlatList, ListRenderItem, Text, View} from "react-native";
import {Accordion, Divider} from "heroui-native";
import {useStore} from "@/contexts/useStore";
import {SleepSession} from "@/types/types";
import {formatTime, timeToDate} from "@/lib/dateTime";

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function SleepList() {
    const {sleepSessions} = useStore();

    const renderItem: ListRenderItem<SleepSession> = useCallback(({item, index}) => {
        const startDate = timeToDate(item.startAt);
        const endDate = timeToDate(item.endAt);
        if (!startDate || !endDate) return null;

        const diffMs = endDate.getTime() - startDate.getTime();

        const sleepDuration = new Date(0, 0, 0, 0, 0, 0, diffMs);
        const sleepDurationText = () => {
            const h = sleepDuration.getHours();
            const m = sleepDuration.getMinutes();
            const s = sleepDuration.getSeconds();
            return [h > 0 && `${h}h`, m > 0 && `${m}m`, s > 0 && `${s}s`,].filter(Boolean).join(' ') || '0s';
        }

        const dayName = DAYS[startDate.getDay()];
        const dayNumber = startDate.getDate();

        return (<Accordion.Item
            key={item.id}
            value={item.id}
        >
            <Accordion.Trigger>
                <View className="flex-row items-center flex-1 gap-3 py-2">
                    <View className="h-14 aspect-square rounded-2xl bg-field flex items-center justify-center">
                        <Text className="text-muted text-xs text-center">{dayNumber}</Text>
                        <Text className="text-foreground text-center text-sm font-bold">
                            {dayName}
                        </Text>
                    </View>

                    <Text className="text-foreground text-base flex-1 font-medium">
                        {formatTime(startDate)} - {formatTime(endDate)}
                    </Text>

                    <Accordion.Indicator/>
                </View>
            </Accordion.Trigger>
            <Accordion.Content>
                <View className="flex flex-row gap-1">
                    <Text className="text-muted">Duration:</Text>
                    <Text className="text-foreground font-base">{sleepDurationText()}</Text>
                </View>
                {item.note ? (<View className="flex flex-row gap-1">
                    <Text className="text-muted">Notes: </Text>
                    <Text className="text-foreground">{item.note}</Text>
                </View>) : (<Text className="text-muted">No notes</Text>)}
            </Accordion.Content>
        </Accordion.Item>);
    }, [sleepSessions.length]);

    return (<View className="flex-1 bg-background p-4">
        <Accordion
            selectionMode="multiple"
            variant="surface"
        >
            <FlatList
                data={sleepSessions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <Divider/>}
                showsVerticalScrollIndicator={false}
            />
        </Accordion>
    </View>);
}