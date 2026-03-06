import MainLayout from "@/layouts/Main.layout";
import { memo, useMemo } from "react";
import { Text, H2 } from "@/components/Text";
import { formatTime } from "@/lib/dateTime";
import { View } from "react-native";
import { useWorkoutStore } from "@/contexts/useWorkoutStore";
import { Card, useThemeColor } from "heroui-native";
import LatestWorkout from "./components/LatestWorkout";
import TemplateList from "./components/TemplateList";
import TrainingCharts from "./components/TrainingCharts";
import AddWorkoutSheet from "./components/AddWorkout.sheet";
import { navigate } from "@/navigation/navigate";
import { Button } from "heroui-native";
import { Dumbbell } from "lucide-react-native";

export default function TrainingScreen() {
    const foregroundColor = useThemeColor('foreground')
    const { userWorkouts } = useWorkoutStore();

    const ongoingWorkout = useMemo(() => {
        return userWorkouts.find(w => !w.endDate);
    }, [userWorkouts]);

    return (
        <MainLayout>
            <H2 className="font-bold text-3xl">Training</H2>

            {ongoingWorkout ? (
                <Card className="gap-2">
                    <Card.Header className="flex-row gap-4 items-center">
                        <Dumbbell size={20} color={foregroundColor} />
                        <View>
                            <Card.Title>Workout in progress - {ongoingWorkout.label?.[0]}</Card.Title>
                            <Card.Description>Started at {formatTime(new Date(ongoingWorkout.startDate))}</Card.Description>
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
        </MainLayout>
    );
}
