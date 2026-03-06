import MainLayout from "@/layouts/Main.layout";
import { memo, useMemo, useCallback } from "react";
import { Text } from "@/components/Text";
import { formatTime, MONTHS } from "@/lib/dateTime";
import { FlatList, View } from "react-native";
import { useWorkoutStore } from "@/contexts/useWorkoutStore";
import { Card, Chip } from "heroui-native";
import { FullWorkout } from "@/types/workout.types";
import LatestWorkout from "./components/LatestWorkout";
import TemplateList from "./components/TemplateList";
import TrainingCharts from "./components/TrainingCharts";
import AddWorkoutSheet from "./components/AddWorkout.sheet";
import { navigate } from "@/navigation/navigate";
import { Button } from "heroui-native";
import { Dumbbell } from "lucide-react-native";

const HistoricalWorkoutItem = memo(({ item, templates }: { item: FullWorkout, templates: any[] }) => {
    const template = templates.find(t => t.id === item.workoutTemplateId);
    const startDate = new Date(item.startDate);

    return (
        <View className="px-4 mb-3">
            <Card className="p-4 flex-row justify-between items-center">
                <Card.Body>
                    <Card.Title className="font-bold">{item.label?.[0] || template?.name || 'Workout'}</Card.Title>
                    <Card.Description>
                        {MONTHS[startDate.getMonth()]} {startDate.getDate()} • {formatTime(startDate)}
                    </Card.Description>
                </Card.Body>
                <View className="items-end gap-1">
                    {template && <Chip size="sm" variant="soft">{template.name}</Chip>}
                    <Text className="text-xs text-muted">{item.sets.length} sets</Text>
                </View>
            </Card>
        </View>
    )
});

export default function TrainingScreen() {
    const { userWorkouts, userWorkoutTemplates } = useWorkoutStore();

    const ongoingWorkout = useMemo(() => {
        return userWorkouts.find(w => !w.endDate);
    }, [userWorkouts]);

    const historicalWorkouts = useMemo(() => {
        const completed = userWorkouts.filter(w => w.endDate).sort((a, b) => 
            new Date(b.endDate!).getTime() - new Date(a.endDate!).getTime()
        );
        return completed.slice(1); // Skip the latest one shown at top
    }, [userWorkouts]);

    const renderHeader = useCallback(() => (
        <View className="gap-4 p-4">
            <View className="mb-2">
                <Text className="font-bold text-3xl">Training</Text>
            </View>

            {ongoingWorkout ? (
                <Card className="p-4 mb-2 border border-primary/20 bg-primary/5">
                    <Card.Header className="flex-row justify-between items-center mb-2">
                        <View className="flex-row items-center gap-3">
                            <View className="bg-primary p-2 rounded-full">
                                <Dumbbell size={20} color="white" />
                            </View>
                            <View>
                                <Card.Title>Workout in progress</Card.Title>
                                <Card.Description>Started at {formatTime(new Date(ongoingWorkout.startDate))}</Card.Description>
                            </View>
                        </View>
                    </Card.Header>
                    <Card.Footer>
                        <Button className="w-full" onPress={() => navigate('ActiveWorkout', { workoutId: ongoingWorkout.id })}>
                            <Button.Label>Resume Workout</Button.Label>
                        </Button>
                    </Card.Footer>
                </Card>
            ) : (
                <AddWorkoutSheet />
            )}
            
            <LatestWorkout />
            <TemplateList />
            <TrainingCharts />

            {historicalWorkouts.length > 0 && (
                <Text className="text-xl font-bold px-1 mt-2">History</Text>
            )}
        </View>
    ), [ongoingWorkout, historicalWorkouts.length]);

    const renderItem = useCallback(({ item }: { item: FullWorkout }) => (
        <HistoricalWorkoutItem item={item} templates={userWorkoutTemplates} />
    ), [userWorkoutTemplates]);

    return (
        <MainLayout scrollable={false}>
            <FlatList
                data={historicalWorkouts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListHeaderComponent={renderHeader}
                contentContainerClassName="pb-10"
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
            />
        </MainLayout>
    )
}
