import MainLayout from "@/layouts/Main.layout";
import { View } from "react-native";
import { Text } from "@/components/Text";
import { NutritionHomeChart } from "@/screens/app/home/components/NutritionHomeChart";
import { SleepHomeChart } from "@/screens/app/home/components/SleepHomeChart";
import { StepsHomeChart } from "@/screens/app/home/components/StepsHomeChart";
import { WeightHomeChart } from "@/screens/app/home/components/WeightHomeChart";
import TrainingCharts from "@/screens/app/training/components/index/TrainingCharts";
import { navigate } from "@/navigation/navigate";
import { DailyOverview } from "./components/DailyOverview";
import { ActiveWorkoutCard } from "./components/ActiveWorkoutCard";
import { QuickActions } from "./components/QuickActions";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function Home() {
  return (
    <MainLayout>
        <ActiveWorkoutCard />
        <View className="gap-3">
          <DailyOverview />
        </View>

        <QuickActions />

        <View className="gap-6">
          <Animated.View entering={FadeInDown.duration(600).delay(700)}>
            <StepsHomeChart />
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(600).delay(800)}>
            <NutritionHomeChart onPress={() => navigate("Nutrition")} />
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(600).delay(900)}>
            <SleepHomeChart onPress={() => navigate("Sleep")} />
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(600).delay(1000)}>
            <TrainingCharts onPress={() => navigate("Training")} />
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(600).delay(1100)}>
            <WeightHomeChart />
          </Animated.View>
        </View>
    </MainLayout>
  );
}