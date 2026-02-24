import MainLayout from "@/layouts/Main.layout";
import DatePicker from "./components/DatePicker";
import { memo, useEffect, useMemo, useState } from "react";
import { Text } from "@/components/Text";
import { DAYS, formatTime, MONTHS } from "@/lib/dateTime";
import { FlatList, View } from "react-native";
import { useStore } from "@/contexts/useStore";
import { Card, Chip } from "heroui-native";
import { FullWorkout, FullWorkoutTemplate, WorkoutTemplate } from "@/types/workout.types";
import { workoutService } from "@/services/workout.service";

export default function TrainingScreen() {
    const { userWorkouts, refreshUserWorkouts, createUserWorkout, editUserWorkout, deleteUserWorkout } = useStore();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const getWorkoutKey = (date: Date) => { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

    const workoutsByDay = useMemo(() => {
        const map = new Map<string, FullWorkout[]>();
        userWorkouts.forEach(workout => {
            const date = new Date(workout.startDate);
            const key = getWorkoutKey(date);
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)!.push(workout);
        });
        return map;
    }, [userWorkouts]);

    const workoutsForSelectedDay = useMemo(() => {
        return workoutsByDay.get(getWorkoutKey(selectedDate)) || [];
    }, [workoutsByDay, selectedDate]);

    const ongoingWorkout = useMemo(() => {
        return userWorkouts.find(w => !w.endDate);
    }, [userWorkouts])

    return (
        <MainLayout>
            <View className="flex flex-row items-baseline">
                <Text className="font-bold text-3xl">{DAYS[selectedDate.getDay()]}, </Text>
                <Text className="text-muted text-xl">{MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}.</Text>
            </View>
            <DatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
            <FlatList
                contentContainerClassName="flex flex-col gap-4 flex-1"
                data={workoutsForSelectedDay}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <RenderItem item={item} />}
                ListEmptyComponent={<Text>No workouts for this day.</Text>}
                showsHorizontalScrollIndicator={false}
            />
        </MainLayout>
    )
}

const RenderItem = memo(({ item }: { item: FullWorkout }) => {
    const [template, setTemplate] = useState<FullWorkoutTemplate | null>();
    useEffect(() => {
        if (item.workoutTemplateId) {
            workoutService.getUserWorkoutTemplateById(item.workoutTemplateId).then(setTemplate);
        }
    }, [item.workoutTemplateId]);
    const startDate = new Date(item.startDate);
    const endDate = item.endDate ? new Date(item.endDate) : undefined;

    const createdAt = item.createdAt ? new Date(item.createdAt) : undefined;
    const updatedAt = item.updatedAt ? new Date(item.updatedAt) : undefined;

    return (
        <Card>
            <Text>{item.label}</Text>
            <Text>{formatTime(startDate)} - {endDate ? formatTime(endDate) : "Ongoing"}</Text>
            {template && <Chip>{template.name}</Chip>}
        </Card>)
})