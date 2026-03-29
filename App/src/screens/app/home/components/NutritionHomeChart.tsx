import React, { useMemo, useEffect, useState } from "react";
import { View } from "react-native";
import { useNutritionStore } from "@/contexts/useNutritionStore";
import { useNutritionGoals } from "@/screens/app/nutrition/hooks/useNutritionGoals";
import { foodService } from "@/services/food.service";
import { ChartCard } from "@/components/graphs/ChartsCard";
import { BarChart } from "@/components/graphs/Chart";
import { ChartDataPoint } from "@/components/graphs/useChartData";
import { FoodDetail } from "@/types/food.types";
import { timestampToDate } from "@/lib/dateTime";

function toLocalDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const NutritionHomeChart = ({ onPress }: { onPress?: () => void }) => {
  const { userMeals } = useNutritionStore();
  const { goals } = useNutritionGoals();
  const [foodDetails, setFoodDetails] = useState<Record<number, FoodDetail>>({});

  useEffect(() => {
    const fetchNeededFoodDetails = async () => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return toLocalDateKey(d);
      });

      const relevantMeals = userMeals.filter((m) => {
        if (!m.userMeal) return false;
        const mealDate = timestampToDate(m.userMeal.eaten_at);
        return mealDate && last7Days.includes(toLocalDateKey(mealDate));
      });

      const foodIds = new Set<number>();
      relevantMeals.forEach((m) => {
        m.userFoods.forEach((f) => {
          if (f) foodIds.add(f.food_id);
        });
      });

      const idsToFetch = Array.from(foodIds).filter((id) => !foodDetails[id]);

      if (idsToFetch.length > 0) {
        const details = await Promise.all(
          idsToFetch.map((id) => foodService.getFoodById(id))
        );
        const newDetails = { ...foodDetails };
        details.forEach((d) => {
          newDetails[d.food.id] = d;
        });
        setFoodDetails(newDetails);
      }
    };

    fetchNeededFoodDetails();
  }, [userMeals]);

  const weeklyCalories = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    return days.map((date) => {
      const dateKey = toLocalDateKey(date);
      let totalCalories = 0;

      userMeals.forEach((m) => {
        if (!m.userMeal) return;
        const mealDate = timestampToDate(m.userMeal.eaten_at);
        if (mealDate && toLocalDateKey(mealDate) === dateKey) {
          m.userFoods.forEach((f) => {
            if (!f) return;
            const detail = foodDetails[f.food_id];
            if (detail) {
              const calNutrient = detail.nutrients.find((n) => n.nutrient_nbr === 208);
              if (calNutrient) {
                totalCalories += (calNutrient.amount * f.total_grams) / 100;
              }
            }
          });
        }
      });

      return {
        value: Math.round(totalCalories),
        label: date.toLocaleDateString("en-US", { weekday: "narrow" }),
      } as ChartDataPoint;
    });
  }, [userMeals, foodDetails]);

  const avgCalories = useMemo(() => {
    const sum = weeklyCalories.reduce((acc, d) => acc + d.value, 0);
    return Math.round(sum / 7);
  }, [weeklyCalories]);

  return (
    <ChartCard
      title="Nutrition"
      description="Calories - Last 7 days"
      averageValue={`${avgCalories} kcal`}
      averageLabel="Daily Avg"
      onPress={onPress}
    >
      <BarChart 
        data={weeklyCalories} 
        height={80} 
        showAverageLine 
        averageValue={goals.calories} 
      />
    </ChartCard>
  );
};
