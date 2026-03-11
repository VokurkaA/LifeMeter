import { useState, useEffect, useMemo } from "react";
import { useNutritionStore } from "@/contexts/useNutritionStore";
import { foodService } from "@/services/food.service";
import { timestampToDate } from "@/lib/dateTime";
import { FoodDetail, CompleteNutrient } from "@/types/food.types";

export interface DailyNutrition {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

function toLocalDateKey(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function eatenAtToDateKey(eatenAt: unknown): string | null {
    if (typeof eatenAt === "string" && eatenAt.length >= 10) {
        const key = eatenAt.slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
    }

    const d = timestampToDate(eatenAt as any);
    return d ? toLocalDateKey(d) : null;
}

export function useDailyNutrition() {
    const { userMeals } = useNutritionStore();
    const [foodDetails, setFoodDetails] = useState<Record<number, FoodDetail>>({});
    const [isLoading, setIsLoading] = useState(true);

    const todaysMeals = useMemo(() => {
        const todayKey = toLocalDateKey(new Date());

        return userMeals.filter((m) => {
            const mealKey = eatenAtToDateKey(m.userMeal.eaten_at);
            return mealKey === todayKey;
        });
    }, [userMeals]);

    const { nutrients, micros } = useMemo(() => {
        const totals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
        };

        const microTotals: Record<number, CompleteNutrient> = {};

        todaysMeals.forEach((m) => {
            m.userFoods.forEach((f) => {
                const detail = foodDetails[f.food_id];
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
                            food_id: 0,
                            nutrient_nbr: n.nutrient_nbr,
                            name: n.name,
                            unit: n.unit,
                            amount: 0,
                        };
                    }

                    microTotals[n.nutrient_nbr].amount += amount;
                });
            });
        });

        return { nutrients: totals, micros: microTotals };
    }, [todaysMeals, foodDetails]);

    useEffect(() => {
        let isMounted = true;

        const calculateNutrition = async () => {
            try {
                const foodIds = new Set<number>();
                todaysMeals.forEach((m) => {
                    m.userFoods.forEach((f) => foodIds.add(f.food_id));
                });

                const newDetailsById: Record<number, FoodDetail> = { ...foodDetails };
                const idsToFetch = Array.from(foodIds).filter(id => !newDetailsById[id]);

                if (idsToFetch.length > 0) {
                    setIsLoading(true);
                    await Promise.all(
                        idsToFetch.map(async (id) => {
                            try {
                                const detail = await foodService.getFoodById(id);
                                newDetailsById[id] = detail;
                            } catch (err) {
                                console.error(`Failed to fetch food detail for id ${id}`, err);
                            }
                        })
                    );
                }

                if (!isMounted) return;

                setFoodDetails(newDetailsById);
            } catch (error) {
                console.error("Failed to calculate daily nutrition", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        if (todaysMeals.length > 0) {
            calculateNutrition();
        } else {
            setIsLoading(false);
        }

        return () => {
            isMounted = false;
        };
    }, [todaysMeals]);

    return { nutrients, micros, isLoading, todaysMeals, foodDetails };
}
