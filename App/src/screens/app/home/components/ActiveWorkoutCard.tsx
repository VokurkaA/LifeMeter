import React, { useMemo } from "react";
import { View } from "react-native";
import { Card, Button, useThemeColor } from "heroui-native";
import { Text } from "@/components/Text";
import { useWorkoutStore } from "@/contexts/useWorkoutStore";
import { useWorkoutTimer } from "@/screens/app/training/hooks/useWorkoutTimer";
import { navigate } from "@/navigation/navigate";
import { Play } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export const ActiveWorkoutCard = () => {
  const { userWorkouts } = useWorkoutStore();
  const themeColorAccentForeground = useThemeColor("accent-foreground");

  const activeWorkout = useMemo(
    () => userWorkouts.find((w) => !w.endDate),
    [userWorkouts]
  );

  const { formattedTime } = useWorkoutTimer(activeWorkout?.startDate || new Date().toISOString());

  if (!activeWorkout) return null;

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(100)}>
      <Card variant="secondary" className="border-2 border-accent/30 bg-accent/5">
        <Card.Body className="p-5 flex-row justify-between items-center">
          <View className="gap-1 flex-1">
            <Text className="text-accent font-bold text-[10px] uppercase tracking-widest">Active Session</Text>
            <Card.Title className="text-2xl font-bold">
              {activeWorkout.label?.[0] || "My Workout"}
            </Card.Title>
            <Text className="text-lg font-mono tabular-nums opacity-80">{formattedTime}</Text>
          </View>
          <Button
            size="lg"
            variant="primary"
            className="rounded-2xl w-14 h-14"
            onPress={() => navigate("ActiveWorkout", { workoutId: activeWorkout.id })}
            isIconOnly
          >
            <Play size={24} color={themeColorAccentForeground} fill={themeColorAccentForeground} />
          </Button>
        </Card.Body>
      </Card>
    </Animated.View>
  );
};
