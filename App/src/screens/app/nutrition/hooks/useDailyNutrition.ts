import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/contexts/useStore";
import { foodService } from "@/services/food.service";
import { timestampToDate } from "@/lib/dateTime";
import { FoodDetail } from "@/types/food.types";

export interface DailyNutrition {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface NutrientTotal {
    name: string;
    amount: number;
    unit: string;
    id: number;
}

export function useDailyNutrition() {
    const { userMeals } = useStore();
    const [nutrition, setNutrition] = useState<DailyNutrition>({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
    });
    const [micros, setMicros] = useState<Record<number, NutrientTotal>>({});
    const [isLoading, setIsLoading] = useState(true);

    const todaysMeals = useMemo(() => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        return userMeals.filter((m) => {
            const date = timestampToDate(m.userMeal.eaten_at);
            return date && date >= startOfDay && date < endOfDay;
        });
    }, [userMeals]);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        const calculateNutrition = async () => {
            try {
                const foodIds = new Set<number>();
                todaysMeals.forEach((m) => {
                    m.userFoods.forEach((f) => foodIds.add(f.food_id));
                });

                const detailsMap = new Map<number, FoodDetail>();
                await Promise.all(
                    Array.from(foodIds).map(async (id) => {
                        try {
                            const detail = await foodService.getFoodById(id);
                            detailsMap.set(id, detail);
                        } catch (err) {
                            console.error(`Failed to fetch food detail for id ${id}`, err);
                        }
                    })
                );

                if (!isMounted) return;

                const totals = {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                };
                
                const microTotals: Record<number, NutrientTotal> = {};

                todaysMeals.forEach((m) => {
                    m.userFoods.forEach((f) => {
                        const detail = detailsMap.get(f.food_id);
                        if (!detail) return;

                        const factor = f.total_grams / 100;
                        detail.nutrients.forEach((n) => {
                            const amount = (n.amount || 0) * factor;
                            
                            if (n.nutrient_nbr === 208) totals.calories += amount;
                            else if (n.nutrient_nbr === 203) totals.protein += amount;
                            else if (n.nutrient_nbr === 205) totals.carbs += amount;
                            else if (n.nutrient_nbr === 204) totals.fat += amount;

                            if (!microTotals[n.nutrient_nbr]) {
                                microTotals[n.nutrient_nbr] = {
                                    id: n.nutrient_nbr,
                                    name: n.name,
                                    unit: n.unit,
                                    amount: 0
                                };
                            }
                            microTotals[n.nutrient_nbr].amount += amount;
                        });
                    });
                });

                setNutrition(totals);
                setMicros(microTotals);
            } catch (error) {
                console.error("Failed to calculate daily nutrition", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        if (todaysMeals.length > 0) {
            calculateNutrition();
        } else {
            setNutrition({ calories: 0, protein: 0, carbs: 0, fat: 0 });
            setMicros({});
            setIsLoading(false);
        }

        return () => {
            isMounted = false;
        };
    }, [todaysMeals]);

    return { nutrition, micros, isLoading };
}
