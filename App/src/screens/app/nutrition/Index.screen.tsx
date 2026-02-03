import MainLayout from '@/layouts/Main.layout';
import AddNewMeal from './components/AddNewMeal.sheet';
import NutritionWheel from './components/NutritionWheel';
import MacroProgress from './components/MacroProgress';
import MicronutrientsSheet from './components/MicronutrientsSheet';
import { useDailyNutrition } from './hooks/useDailyNutrition';
import { useStore } from '@/contexts/useStore';
import { View } from 'react-native';
import { Text } from '@/components/Text';

export default function NutritionScreen() {
    const { nutrition, micros } = useDailyNutrition();
    const { userGoals, userProfile } = useStore();

    const bmr = userProfile?.currentBmrCalories ?? 0;
    const activityFactor = userProfile?.currentActivityFactor ?? 1.2;
    const tdee = Math.round(bmr * activityFactor);

    const explicitProtein = userGoals?.dailyProteinGoalGrams ?? 0;
    const explicitCarbs = userGoals?.dailyCarbsGoalGrams ?? 0;
    const explicitFat = userGoals?.dailyFatGoalGrams ?? 0;

    const hasExplicitGoals = explicitProtein > 0 || explicitCarbs > 0 || explicitFat > 0;

    let goals: {
        protein: number;
        carbs: number;
        fat: number;
        calories: number;
    };

    if (hasExplicitGoals) {
        const macroSum = (explicitProtein * 4) + (explicitCarbs * 4) + (explicitFat * 9);
        goals = {
            protein: explicitProtein,
            carbs: explicitCarbs,
            fat: explicitFat,
            calories: macroSum
        };
    } else {
        goals = {
            protein: Math.round((tdee * 0.30) / 4),
            carbs: Math.round((tdee * 0.40) / 4),
            fat: Math.round((tdee * 0.30) / 9),
            calories: tdee
        };
    }

    return (
        <MainLayout>
            <NutritionWheel consumed={nutrition.calories} goal={goals.calories} />
            <View className="gap-4">
                <Text className="text-xl font-bold">Today's Macros</Text>
                <MacroProgress nutrition={nutrition} goals={goals} />
            </View>
            <MicronutrientsSheet micros={micros} />
            <AddNewMeal />
        </MainLayout>
    );
}