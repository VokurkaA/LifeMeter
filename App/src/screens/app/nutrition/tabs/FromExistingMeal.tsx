import React, { useMemo, useEffect, useState } from "react";
import { View } from "react-native";
import { Accordion, SkeletonGroup, Button, Skeleton, useThemeColor } from "heroui-native";
import { CreateMealInput, UserMeal, UserFood, FoodDetail } from "@/types/food.types";
import { Muted, Text } from "@/components/Text";
import { timestampToDate } from "@/lib/dateTime";
import { foodService } from "@/services/food.service";
import MealBuilder from "../components/MealBuilder";
import { ChevronLeft } from "lucide-react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

interface FromExistingMealProps {
    onSuccess?: () => void;
    createUserMeal: (data: CreateMealInput) => Promise<void>;
    userMeals: { userMeal: UserMeal; userFoods: UserFood[]; }[];
}

export default function FromExistingMeal({ onSuccess, createUserMeal, userMeals }: FromExistingMealProps) {
    const [selectedMeal, setSelectedMeal] = useState<{ userMeal: UserMeal; userFoods: UserFood[] } | null>(null);
    const foregroundColor = useThemeColor('foreground');
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

    const handleSelect = (meal: { userMeal: UserMeal; userFoods: UserFood[] }) => {
        setSelectedMeal(meal);
    };

    const handleSave = async (data: CreateMealInput) => {
        await createUserMeal(data);
        onSuccess?.();
    };

    if (selectedMeal) {
        const initialData: CreateMealInput = {
            name: selectedMeal.userMeal.name,
            items: selectedMeal.userFoods.map(uf => ({
                food_id: uf.food_id,
                total_grams: uf.total_grams,
                portion_id: uf.portion_id,
                quantity: uf.quantity,
            })),
        };

        return (
            <View>
                <Button
                    variant="ghost"
                    onPress={() => setSelectedMeal(null)}
                    className="self-start mb-2 -ml-4"
                >
                    <ChevronLeft size={20} color={foregroundColor} />
                    <Button.Label>Back to list</Button.Label>
                </Button>
                <MealBuilder
                    initialData={initialData}
                    onSave={handleSave}
                    onCancel={() => setSelectedMeal(null)}
                />
            </View>
        );
    }

    return (
        <Accordion variant="default" isDividerVisible={true}>
            {uniqueUserMeals.map((meal) => (
                <MealAccordion
                    key={meal.userMeal.id}
                    userMeal={meal.userMeal}
                    userFoods={meal.userFoods}
                    onSelect={() => handleSelect(meal)}
                />
            ))}
        </Accordion>
    );
}

const MealAccordion = React.memo(function MealAccordion({
    userMeal,
    userFoods,
    onSelect
}: {
    userMeal: UserMeal;
    userFoods: UserFood[];
    onSelect: () => void
}) {
    const [foods, setFoods] = useState<FoodDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [calories, setCalories] = useState<number | undefined>();
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
                <View className="flex-1 flex-row items-center gap-3">
                    {eatenAt && <Muted>{eatenAt.getDate()}. {eatenAt.getMonth() + 1}.</Muted>}
                    <Text className="flex-1 font-bold" numberOfLines={1}>{userMeal.name}</Text>
                    {loading ? (
                        <Skeleton className="h-4 w-12 opacity-10 rounded-md" />
                    ) : (
                        <Text className="font-medium">{Math.round(calories!)} kcal</Text>
                    )}
                </View>
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
                        foods.map((f, idx) => (
                            <View key={`${f.food.id}-${idx}`} className="flex-row justify-between items-center">
                                <Text className="flex-1 text-sm" numberOfLines={1}>{f.food.description}</Text>
                                <Muted>{userFoods[idx].total_grams}g</Muted>
                            </View>
                        ))
                    )}
                    <Button size="sm" variant="secondary" className="mt-4" onPress={onSelect}>
                        <Button.Label>Use This Meal</Button.Label>
                    </Button>
                </SkeletonGroup>
            </Accordion.Content>
        </Accordion.Item>
    );
});