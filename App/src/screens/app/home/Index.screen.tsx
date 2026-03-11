import MainLayout from "@/layouts/Main.layout";
import { useAuth } from "@/contexts/useAuth";
import { View } from "react-native";
import { Text } from "@/components/Text";
import { NutritionHomeChart } from "@/screens/app/home/components/NutritionHomeChart";
import { SleepHomeChart } from "@/screens/app/home/components/SleepHomeChart";
import { StepsHomeChart } from "@/screens/app/home/components/StepsHomeChart";
import { WeightHomeChart } from "@/screens/app/home/components/WeightHomeChart";
import TrainingCharts from "@/screens/app/training/components/index/TrainingCharts";
import { navigate } from "@/navigation/navigate";

export default function Home() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <MainLayout>
      <View className="mb-2">
        <Text className="text-3xl font-bold">Hello, {firstName}!</Text>
        <Text className="text-muted-foreground text-lg">Here's your overview for the last 7 days.</Text>
      </View>

      <View className="gap-6">
        <StepsHomeChart />
        <NutritionHomeChart onPress={() => navigate("Nutrition")} />
        <SleepHomeChart onPress={() => navigate("Sleep")} />
        <TrainingCharts onPress={() => navigate("Training")} />
        <WeightHomeChart />
      </View>
    </MainLayout>
  );
}