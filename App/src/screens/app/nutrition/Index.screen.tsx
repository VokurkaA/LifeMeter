import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/contexts/useStore';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Time } from '@/lib/Time';
import AddUserMeal from '@/screens/app/nutrition/AddUserMeal.sheet';
import { H1, H3, Text } from '@/components/ui/Text';
import { MealDetailSheet } from '@/screens/app/nutrition/MealDetail.sheet';
import { ChevronIcon } from '@/components/icons/chevron';
import { foodService } from '@/services/food.service';
import { FullUserMeal } from '@/types/food.types';

export default function NutritionScreen() {
  const { userMeals } = useStore();
  const [selectedDate, setSelectedDate] = useState(Time.now());

  const [detailedMeals, setDetailedMeals] = useState<FullUserMeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const filteredMeals = useMemo(() => {
    return userMeals.filter((m) => {
      return Time.isSameDay(m.userMeal.eaten_at, selectedDate.toDate());
    });
  }, [userMeals, selectedDate]);

  useEffect(() => {
    let isMounted = true;

    const fetchFullMeals = async () => {
      setIsLoading(true);
      try {
        const fullData = await Promise.all(
          filteredMeals.map((m) => foodService.getUserMealById(m.userMeal.id)),
        );
        if (isMounted) {
          setDetailedMeals(fullData);
        }
      } catch (error) {
        console.error('Error fetching meals:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (filteredMeals.length > 0) {
      fetchFullMeals();
    } else {
      setDetailedMeals([]);
    }

    return () => {
      isMounted = false;
    };
  }, [filteredMeals]);

  const dailyTotals = useMemo(() => {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    detailedMeals.forEach((meal) => {
      if (!meal.userFoods) return;

      meal.userFoods.forEach((f) => {
        const nutrients = f.foodDetail?.nutrients || [];
        const getVal = (id: number) => nutrients.find((n) => n.nutrient_nbr === id)?.amount || 0;

        totals.calories += getVal(208);
        totals.protein += getVal(203);
        totals.fat += getVal(204);
        totals.carbs += getVal(205);
      });
    });

    return totals;
  }, [detailedMeals]);

  const nextDay = () => {
    setSelectedDate((prev) => prev.add({ days: 1 }));
  };

  const prevDay = () => {
    setSelectedDate((prev) => prev.subtract({ days: 1 }));
  };

  return (
    <ScrollView className="flex flex-1 bg-background p-4">
      <View className="mb-4 flex flex-row items-center justify-between">
        <Pressable onPress={prevDay} className="p-2">
          <ChevronIcon direction="right" />
        </Pressable>

        <H1 className="my-8 text-center">{selectedDate.format('dddd, MMMM D.')}</H1>

        <View className="w-10 items-center">
          {!Time.isSameDay(selectedDate.toDate(), Time.now().toDate()) && (
            <Pressable onPress={nextDay} className="p-2">
              <ChevronIcon direction="left" />
            </Pressable>
          )}
        </View>
      </View>

      <Card className="mb-4">
        <CardHeader>
          <H3>Daily nutrition</H3>
        </CardHeader>
        <CardContent>
          <View className="flex-row justify-between rounded-md bg-secondary/20 p-4">
            <MacroSummaryItem label="Calories" value={dailyTotals.calories} unit="kcal" />
            <MacroSummaryItem label="Protein" value={dailyTotals.protein} unit="g" />
            <MacroSummaryItem label="Carbs" value={dailyTotals.carbs} unit="g" />
            <MacroSummaryItem label="Fat" value={dailyTotals.fat} unit="g" />
          </View>
        </CardContent>
      </Card>
      <View className="mb-4">
        <AddUserMeal />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" className="mt-10" />
      ) : (
        detailedMeals.map((m) => (
          <Card key={m.userMeal.id} className="mb-4">
            <CardHeader>
              <Text className="text-lg font-bold">{m.userMeal.name}</Text>
            </CardHeader>
            <CardContent>
              <MealDetailSheet meal={m} />

              {m.userFoods &&
                m.userFoods.map((f) => (
                  <Text key={f.userFood.id} className="mb-1 text-muted-foreground">
                    {f.foodDetail.food.description ?? 'Food'} - {f.userFood.quantity}x
                    {f.userFood.total_grams ? `, ${f.userFood.total_grams}g` : ''}
                  </Text>
                ))}
            </CardContent>
            <CardFooter>
              <Text className="text-xs text-card-foreground">
                {Time.format(m.userMeal.eaten_at, 'HH:mm')}
              </Text>
            </CardFooter>
          </Card>
        ))
      )}

      {!isLoading && detailedMeals.length === 0 && (
        <Text className="mt-10 text-center text-muted">No meals recorded for this day.</Text>
      )}

      <View className="h-10" />
    </ScrollView>
  );
}

function MacroSummaryItem({ value, label, unit }: { value: number; label: string; unit: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-xl font-bold">
        {value.toFixed(0)} <Text className="text-sm font-normal text-muted-foreground">{unit}</Text>
      </Text>
      <Text className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Text>
    </View>
  );
}
