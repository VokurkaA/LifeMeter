import { useUserStore } from "@/contexts/useUserStore";
import { useMemo } from "react";

type MacroGoals = {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
};

export function useNutritionGoals() {
    const { userGoals, userProfile } = useUserStore();

    const goals = useMemo<MacroGoals>(() => {
        const dailyCalorieTarget = userProfile?.currentBmrCalories ?? 0;

        const explicitProtein = userGoals?.dailyProteinGoalGrams ?? 0;
        const explicitCarbs = userGoals?.dailyCarbsGoalGrams ?? 0;
        const explicitFat = userGoals?.dailyFatGoalGrams ?? 0;

        const defaultProtein = Math.round((dailyCalorieTarget * 0.30) / 4);
        const defaultCarbs = Math.round((dailyCalorieTarget * 0.40) / 4);
        const defaultFat = Math.round((dailyCalorieTarget * 0.30) / 9);

        const protein = explicitProtein > 0 ? explicitProtein : defaultProtein;
        const carbs = explicitCarbs > 0 ? explicitCarbs : defaultCarbs;
        const fat = explicitFat > 0 ? explicitFat : defaultFat;

        const allMacrosExplicit = explicitProtein > 0 && explicitCarbs > 0 && explicitFat > 0;

        return {
            protein,
            carbs,
            fat,
            calories: allMacrosExplicit ? protein * 4 + carbs * 4 + fat * 9 : dailyCalorieTarget
        };
    }, [userProfile, userGoals]);

    return { goals };
}
