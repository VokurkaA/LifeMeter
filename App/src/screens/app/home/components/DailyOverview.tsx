import React, { useEffect, useState, useMemo } from "react";
import { View } from "react-native";
import { Card, useThemeColor } from "heroui-native";
import { Text, Muted } from "@/components/Text";
import { useDailyNutrition } from "@/screens/app/nutrition/hooks/useDailyNutrition";
import { useNutritionGoals } from "@/screens/app/nutrition/hooks/useNutritionGoals";
import { useAuth } from "@/contexts/useAuth";
import { getSteps } from "@/lib/health/index";
import { useHealthSyncEnabled } from "@/lib/healthSyncStorage";
import { useUserStore } from "@/contexts/useUserStore";
import { useWorkoutStore } from "@/contexts/useWorkoutStore";
import { Flame, Footprints, Clock } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export const DailyOverview = () => {
  const { user } = useAuth();
  const [enableSync] = useHealthSyncEnabled(user?.id ?? null);
  const { userGoals } = useUserStore();
  const { nutrients } = useDailyNutrition();
  const { goals } = useNutritionGoals();
  const { userWorkouts } = useWorkoutStore();

  const [todaySteps, setTodaySteps] = useState(0);
  const accentColor = useThemeColor("accent");
  const firstName = user?.name?.split(" ")[0] || "there";

  useEffect(() => {
    if (!enableSync) return;

    const fetchTodaySteps = async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const result = await getSteps({ startDate, endDate });
      if (result.ok) {
        const total = result.data.reduce((acc, s) => acc + s.count, 0);
        setTodaySteps(total);
      }
    };

    fetchTodaySteps();
    const interval = setInterval(fetchTodaySteps, 60000);
    return () => clearInterval(interval);
  }, [enableSync]);

  const activeMinutes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return userWorkouts.reduce((acc, w) => {
      const start = new Date(w.startDate);
      if (start < today) return acc;

      const end = w.endDate ? new Date(w.endDate) : new Date();
      const durationMs = end.getTime() - start.getTime();
      return acc + Math.round(durationMs / (1000 * 60));
    }, 0);
  }, [userWorkouts]);

  const caloriesRemaining = Math.max(0, goals.calories - nutrients.calories);

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(200)}>
      <Card variant="secondary" className="border border-muted/10">
        <Card.Header>
          <Text className="text-3xl font-bold tracking-tight mb-4">Hello, {firstName}!</Text>
        </Card.Header>
        <Card.Body className="p-5">
          <View className="flex-row justify-between items-center">
            <View className="items-center flex-1 border-r border-muted/10">
              <View className="bg-accent/10 p-2 rounded-full mb-2">
                <Flame size={18} color={accentColor} />
              </View>
              <Text className="font-bold text-xl tabular-nums">{Math.round(caloriesRemaining)}</Text>
              <Muted className="text-[10px] uppercase font-bold tracking-wider">Remaining</Muted>
            </View>

            <View className="items-center flex-1 border-r border-muted/10">
              <View className="bg-accent/10 p-2 rounded-full mb-2">
                <Footprints size={18} color={accentColor} />
              </View>
              <Text className="font-bold text-xl tabular-nums">{todaySteps.toLocaleString()}</Text>
              <Muted className="text-[10px] uppercase font-bold tracking-wider">Steps</Muted>
            </View>

            <View className="items-center flex-1">
              <View className="bg-accent/10 p-2 rounded-full mb-2">
                <Clock size={18} color={accentColor} />
              </View>
              <Text className="font-bold text-xl tabular-nums">{activeMinutes}m</Text>
              <Muted className="text-[10px] uppercase font-bold tracking-wider">Active</Muted>
            </View>
          </View>
        </Card.Body>
      </Card>
    </Animated.View>
  );
};
