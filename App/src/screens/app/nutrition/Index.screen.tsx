import MainLayout from '@/layouts/Main.layout';
import AddNewMeal from './components/AddNewMeal.sheet';
import NutritionWheel from './components/NutritionWheel';
import MicronutrientsSheet from './components/MicronutrientsSheet';
import { useDailyNutrition } from './hooks/useDailyNutrition';
import { useStore } from '@/contexts/useStore';
import { Card } from 'heroui-native';
import { MacroCard } from './components/MacroCard';
import MealOverviewCard from './components/MealOverviewCard';

type MacroGoals = {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
};

function calculateGoals(params: {
    tdee: number;
    explicitProtein: number;
    explicitCarbs: number;
    explicitFat: number;
}): MacroGoals {
    const { tdee, explicitProtein, explicitCarbs, explicitFat } = params;

    const defaultProtein = Math.round((tdee * 0.30) / 4);
    const defaultCarbs = Math.round((tdee * 0.40) / 4);
    const defaultFat = Math.round((tdee * 0.30) / 9);

    const protein = explicitProtein > 0 ? explicitProtein : defaultProtein;
    const carbs = explicitCarbs > 0 ? explicitCarbs : defaultCarbs;
    const fat = explicitFat > 0 ? explicitFat : defaultFat;

    const allMacrosExplicit = explicitProtein > 0 && explicitCarbs > 0 && explicitFat > 0;

    return {
        protein,
        carbs,
        fat,
        calories: allMacrosExplicit ? protein * 4 + carbs * 4 + fat * 9 : tdee
    };
}

export default function NutritionScreen() {
    const { nutrients, micros, todaysMeals, foodDetails } = useDailyNutrition();
    const { userGoals, userProfile } = useStore();

    const bmr = userProfile?.currentBmrCalories ?? 0;
    const activityFactor = userProfile?.currentActivityFactor ?? 1.2;
    const tdee = Math.round(bmr * activityFactor);

    const explicitProtein = userGoals?.dailyProteinGoalGrams ?? 0;
    const explicitCarbs = userGoals?.dailyCarbsGoalGrams ?? 0;
    const explicitFat = userGoals?.dailyFatGoalGrams ?? 0;

    const goals = calculateGoals({
        tdee,
        explicitProtein,
        explicitCarbs,
        explicitFat
    });

    return (
        <MainLayout>
            <Card className="flex flex-col gap-4">
                <Card.Header>
                    <Card.Title className="text-center text-2xl">Nutrients</Card.Title>
                </Card.Header>

                <Card.Body className="items-center">
                    <NutritionWheel
                        consumed={nutrients.calories}
                        goal={goals.calories}
                        size={240}
                        strokeWidth={15}
                    />
                </Card.Body>

                <Card.Footer className="flex flex-row justify-center gap-8">
                    <MacroCard
                        name="Protein"
                        consumed={nutrients.protein}
                        goal={goals.protein}
                        underlineColor="#F43F5E"
                    />
                    <MacroCard
                        name="Carbs"
                        consumed={nutrients.carbs}
                        goal={goals.carbs}
                        underlineColor="#0EA5E9"
                    />
                    <MacroCard
                        name="Fat"
                        consumed={nutrients.fat}
                        goal={goals.fat}
                        underlineColor="#EAB308"
                    />
                </Card.Footer>
            </Card>

            <AddNewMeal />
            <MicronutrientsSheet micros={micros} />
            <MealOverviewCard meals={todaysMeals} foodDetails={foodDetails} />
        </MainLayout>
    );
}