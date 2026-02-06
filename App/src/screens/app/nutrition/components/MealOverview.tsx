import { Card } from "heroui-native";
import type { FoodDetail, UserMeal, UserFood } from "@/types/food.types";
import { View } from "react-native";
import { Text } from "@/components/Text";
import { formatTime, timeToDate } from "@/lib/dateTime";

interface MealOverviewProps {
    meals: { userMeal: UserMeal; userFoods: UserFood[] }[];
    foodDetails: Record<number, FoodDetail>;
}

export default function MealOverview({ meals, foodDetails }: MealOverviewProps) {
    return (
        <View className="gap-2">
            <Text className="text-xl">Today's meals</Text>
            {meals.length > 0 ? (
                meals.map((meal) => {
                    const eatenAt = timeToDate(meal.userMeal.eaten_at);
                    const caloriesTotal = meal.userFoods.reduce((total, food) => {
                        const foodDetail = foodDetails[food.food_id];
                        return total + (foodDetail ? foodDetail.nutrients.find(nutrient => nutrient.nutrient_nbr === 208)?.amount || 0 : 0);
                    }, 0);
                    return (
                        <Card key={meal.userMeal.id} variant="transparent" className="border border-border flex flex-row gap-2">
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
                                <Card.Description className="text-foreground">{caloriesTotal}</Card.Description>
                                <Card.Description className="text-sm text-muted">kcal</Card.Description>
                            </Card.Footer>
                        </Card>
                    );
                })
            ) : <Text className="text-muted">No meals logged today.</Text>}
        </View>
    );
}
