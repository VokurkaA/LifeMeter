import { Card, BottomSheet, Button, useThemeColor, PressableFeedback, useToast } from "heroui-native";
import type { FoodDetail, UserMeal, UserFood, UpdateMealInput } from "@/types/food.types";
import { View, Alert } from "react-native";
import { Text } from "@/components/Text";
import { formatTime, timeToDate } from "@/lib/dateTime";
import React, { memo, useState } from "react";
import { MoreVertical, Edit2, Trash2 } from "lucide-react-native";
import MealBuilder from "./MealBuilder";

interface MealOverviewProps {
    meals: { userMeal: UserMeal; userFoods: UserFood[] }[];
    foodDetails: Record<number, FoodDetail>;
    onEdit?: (id: string, data: UpdateMealInput) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

const MealItem = memo(({ 
    meal, 
    foodDetails,
    onEdit,
    onDelete
}: { 
    meal: { userMeal: UserMeal; userFoods: UserFood[] }, 
    foodDetails: Record<number, FoodDetail>,
    onEdit?: (id: string, data: UpdateMealInput) => Promise<void>,
    onDelete?: (id: string) => Promise<void>
}) => {
    if (!meal.userMeal) return null;
    const { toast } = useToast();
    const foregroundColor = useThemeColor("foreground");
    const mutedColor = useThemeColor("muted");
    const dangerColor = useThemeColor("danger");
    
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const eatenAt = timeToDate(meal.userMeal.eaten_at);
    const caloriesTotal = meal.userFoods.reduce((total, food) => {
        if (!food) return total;
        const foodDetail = foodDetails[food.food_id];
        if (!foodDetail) return total;
        const calNutrient = foodDetail.nutrients.find(n => n.nutrient_nbr === 208);
        return total + ((calNutrient?.amount || 0) * food.total_grams) / 100;
    }, 0);

    const handleDelete = () => {
        Alert.alert(
            "Delete Meal",
            "Are you sure you want to delete this meal?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await onDelete?.(meal.userMeal.id);
                            setIsSheetOpen(false);
                            toast.show({
                                variant: "success",
                                label: "Meal deleted",
                            });
                        } catch (e) {
                            toast.show({
                                variant: "danger",
                                label: "Failed to delete meal",
                            });
                        }
                    }
                }
            ]
        );
    };

    const handleSaveEdit = async (data: any) => {
        try {
            await onEdit?.(meal.userMeal.id, data);
            setIsEditing(false);
            setIsSheetOpen(false);
            toast.show({
                variant: "success",
                label: "Meal updated",
            });
        } catch (e) {
            toast.show({
                variant: "danger",
                label: "Failed to update meal",
            });
        }
    };

    const initialData = {
        name: meal.userMeal.name,
        eaten_at: meal.userMeal.eaten_at,
        items: meal.userFoods.map(uf => ({
            food_id: uf.food_id,
            total_grams: uf.total_grams,
            portion_id: uf.portion_id,
            quantity: uf.quantity,
        }))
    };

    return (
        <View className="px-4 mb-3">
            <BottomSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <BottomSheet.Trigger asChild>
                    <PressableFeedback>
                        <Card variant="transparent" className="border border-border flex flex-row gap-2">
                            <Card.Header className="flex justify-center">
                                {eatenAt && <Card.Description className="">{formatTime(eatenAt)}</Card.Description>}
                            </Card.Header>
                            <Card.Body className="flex-1">
                                <Card.Title>{meal.userMeal.name}</Card.Title>
                                {meal.userFoods.map((food, idx) => {
                                    if (!food) return null;
                                    return (
                                        <Text className="text-muted lowercase" key={`${food.id}-${idx}`}>{foodDetails[food.food_id]?.food.description}</Text>
                                    );
                                })}
                            </Card.Body>
                            <Card.Footer className="flex-row items-center gap-2">
                                <View className="items-end mr-2">
                                    <Card.Description className="text-foreground font-bold">{Math.round(caloriesTotal)}</Card.Description>
                                    <Card.Description className="text-[10px] text-muted uppercase">kcal</Card.Description>
                                </View>
                                <MoreVertical size={16} color={mutedColor} />
                            </Card.Footer>
                        </Card>
                    </PressableFeedback>
                </BottomSheet.Trigger>
                <BottomSheet.Portal>
                    <BottomSheet.Overlay />
                    <BottomSheet.Content snapPoints={isEditing ? ["90%"] : ["40%"]}>
                        {isEditing ? (
                            <View className="flex-1">
                                <BottomSheet.Title className="mb-4">Edit Meal</BottomSheet.Title>
                                <MealBuilder 
                                    initialData={initialData} 
                                    onSave={handleSaveEdit} 
                                    onCancel={() => setIsEditing(false)} 
                                />
                            </View>
                        ) : (
                            <View className="gap-4">
                                <BottomSheet.Title>{meal.userMeal.name}</BottomSheet.Title>
                                <View className="gap-2">
                                    <Button variant="secondary" className="justify-start" onPress={() => setIsEditing(true)}>
                                        <Edit2 size={20} color={foregroundColor} />
                                        <Button.Label>Edit Meal</Button.Label>
                                    </Button>
                                    <Button variant="tertiary" className="justify-start" onPress={handleDelete}>
                                        <Trash2 size={20} color={dangerColor} />
                                        <Button.Label className="text-danger">Delete Meal</Button.Label>
                                    </Button>
                                </View>
                            </View>
                        )}
                    </BottomSheet.Content>
                </BottomSheet.Portal>
            </BottomSheet>
        </View>
    );
});

export default function MealOverview({ meals, foodDetails, onEdit, onDelete }: MealOverviewProps) {
    if (meals.length === 0) {
        return (
            <View className="p-4 items-center">
                <Text className="text-muted">No meals logged today.</Text>
            </View>
        );
    }

    return (
        <View className="gap-3">
            {meals.map((meal, index) => (
                <MealItem 
                    key={meal.userMeal?.id || index} 
                    meal={meal} 
                    foodDetails={foodDetails}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </View>
    );
}
