import React, { useMemo, useEffect, useState } from "react";
import { View } from "react-native";
import { Accordion, SkeletonGroup, Button } from "heroui-native";
import { CreateMealInput, UserMeal, UserFood, FoodDetail } from "@/types/food.types";
import { Text } from "@/components/Text";
import { timestampToDate } from "@/lib/dateTime";
import { foodService } from "@/services/food.service";

interface FromExistingMeal {
    onSuccess?: () => void;
    createUserMeal: (data: CreateMealInput) => Promise<void>;
    userMeals: { userMeal: UserMeal; userFoods: UserFood[]; }[]
}

export default function FromExistingMeal({ onSuccess, createUserMeal, userMeals }: FromExistingMeal) {
    const uniqueUserMeals = useMemo(() => {
        const nameToMeal = new Map<string, { userMeal: UserMeal; userFoods: UserFood[] }>();
        for (let i = userMeals.length - 1; i >= 0; i--) {
            const meal = userMeals[i];
            if (!nameToMeal.has(meal.userMeal.name)) {
                nameToMeal.set(meal.userMeal.name, meal);
            }
        }
        return Array.from(nameToMeal.values()).reverse();
    }, [userMeals]);

    return (
        <View className="flex flex-col">
            <Accordion variant="default" isDividerVisible={true}>
                {uniqueUserMeals.map(({ userMeal, userFoods }) => (
                    <MealAccordion key={userMeal.id} userMeal={userMeal} userFoods={userFoods} />
                ))}
            </Accordion>
        </View>
    );
}

const MealAccordion = React.memo(function MealAccordion({ userMeal, userFoods }: { userMeal: UserMeal; userFoods: UserFood[] }) {
    const [foods, setFoods] = useState<FoodDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [calories, setCalories] = useState<number>(0);
    const eatenAt = useMemo<Date | undefined>(() => timestampToDate(userMeal.eaten_at), [userMeal.eaten_at]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setFoods([]);
        setCalories(0);

        async function fetchFoods() {
            try {
                const foodDetails = await Promise.all(userFoods.map((f) => foodService.getFoodById(f.food_id)));
                if (!mounted) return;

                setFoods(foodDetails);

                const totalCalories = foodDetails.reduce((sum, data, idx) => {
                    const calPer100g = data.nutrients.find((n) => n.nutrient_nbr === 208)?.amount ?? 0;
                    return sum + (calPer100g * userFoods[idx].total_grams) / 100;
                }, 0);

                setCalories(totalCalories);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchFoods();

        return () => { mounted = false; };
    }, [userFoods]);

    return (
        <Accordion.Item key={userMeal.id} value={userMeal.id}>
            <Accordion.Trigger>
                {eatenAt && <Text>{eatenAt.getDate()}. {eatenAt.getMonth() + 1}.</Text>}
                <Text className="flex-1 font-bold">{userMeal.name}</Text>
                <Text>{Math.round(calories)} kcal</Text>
                <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
                <SkeletonGroup isLoading={loading} className="gap-2">
                    {loading ? (
                        <>
                            <SkeletonGroup.Item className="h-4 w-2/3 rounded-md" />
                            <SkeletonGroup.Item className="h-4 w-1/2 rounded-md" />
                        </>
                    ) : (
                        foods.map((f) => (
                            <View key={f.food.id}>
                                <Text>{f.food.description}</Text>
                            </View>
                        ))
                    )}
                    <Button size="sm" variant="secondary" className="mt-2">Add</Button>
                </SkeletonGroup>
            </Accordion.Content>
        </Accordion.Item>
    );
});

const MealForm = React.memo(function MealForm({ userMeal, userFoods, foodDetails }: { userMeal: UserMeal; userFoods: UserFood[]; foodDetails: FoodDetail[] }) {
    return (
        <View className="flex flex-row gap-4">

        </View>
    )
})