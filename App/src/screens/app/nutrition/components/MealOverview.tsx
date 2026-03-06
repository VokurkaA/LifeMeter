import { Card } from "heroui-native";
import type { FoodDetail, UserMeal, UserFood } from "@/types/food.types";
import { View, FlatList } from "react-native";
import { Text } from "@/components/Text";
import { formatTime, timeToDate } from "@/lib/dateTime";
import React, { memo, useCallback } from "react";

interface MealOverviewProps {
    meals: { userMeal: UserMeal; userFoods: UserFood[] }[];
    foodDetails: Record<number, FoodDetail>;
    ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
}

const MealItem = memo(({ meal, foodDetails }: { meal: { userMeal: UserMeal; userFoods: UserFood[] }, foodDetails: Record<number, FoodDetail> }) => {
    const eatenAt = timeToDate(meal.userMeal.eaten_at);
    const caloriesTotal = meal.userFoods.reduce((total, food) => {
        const foodDetail = foodDetails[food.food_id];
        return total + (foodDetail ? foodDetail.nutrients.find(nutrient => nutrient.nutrient_nbr === 208)?.amount || 0 : 0);
    }, 0);

    return (
        <View className="px-4 mb-3">
            <Card variant="transparent" className="border border-border flex flex-row gap-2">
                <Card.Header className="flex justify-center">
                    {eatenAt && <Card.Description className="">{formatTime(eatenAt)}</Card.Description>}
                </Card.Header>
                <Card.Body className="flex-1">
                    <Card.Title>{meal.userMeal.name}</Card.Title>
                    {meal.userFoods.map((food) => (
                        <Text className="text-muted lowercase" key={food.id}>{foodDetails[food.food_id]?.food.description}</Text>
                    ))}
                </Card.Body>
                <Card.Footer className="flex justify-center">
                    <Card.Description className="text-foreground">{Math.round(caloriesTotal)}</Card.Description>
                    <Card.Description className="text-sm text-muted">kcal</Card.Description>
                </Card.Footer>
            </Card>
        </View>
    );
});

export default function MealOverview({ meals, foodDetails, ListHeaderComponent }: MealOverviewProps) {
    const renderItem = useCallback(({ item }: { item: { userMeal: UserMeal; userFoods: UserFood[] } }) => (
        <MealItem meal={item} foodDetails={foodDetails} />
    ), [foodDetails]);

    const renderEmpty = useCallback(() => (
        <View className="p-4 items-center">
            <Text className="text-muted">No meals logged today.</Text>
        </View>
    ), []);

    return (
        <FlatList
            data={meals}
            renderItem={renderItem}
            keyExtractor={item => item.userMeal.id}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={renderEmpty}
            contentContainerClassName="pb-10"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
        />
    );
}
