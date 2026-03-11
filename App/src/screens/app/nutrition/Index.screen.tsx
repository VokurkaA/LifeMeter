import MainLayout from '@/layouts/Main.layout';
import AddMeal from './components/AddMeal.sheet';
import MicrosOverview from './components/MicrosOverview.sheet';
import { useDailyNutrition } from './hooks/useDailyNutrition';
import { useNutritionGoals } from './hooks/useNutritionGoals';
import { MacroOverview } from './components/MacroOverview';
import MealOverview from './components/MealOverview';
import { useNutritionStore } from '@/contexts/useNutritionStore';
import { View } from 'react-native';

export default function NutritionScreen() {
    const { nutrients, micros, todaysMeals, foodDetails } = useDailyNutrition();
    const { goals } = useNutritionGoals();
    const { createUserMeal, userMeals } = useNutritionStore();

    return (
        <MainLayout>
            <MacroOverview nutrients={nutrients} goals={goals} />
            <AddMeal createUserMeal={createUserMeal} userMeals={userMeals} />
            <MicrosOverview micros={micros} />
            <MealOverview meals={todaysMeals} foodDetails={foodDetails} />
        </MainLayout>
    );
}
