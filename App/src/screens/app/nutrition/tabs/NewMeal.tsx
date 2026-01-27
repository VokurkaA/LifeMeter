import React, {  } from "react";
import { View } from "react-native";
import { useToast } from "heroui-native";
import { CreateMealInput, UserMeal, UserFood } from "@/types/food.types";

interface AddMealProps {
    onSuccess?: () => void;
    createUserMeal: (data: CreateMealInput) => Promise<void>;
    userMeals: { userMeal: UserMeal; userFoods: UserFood[]; }[]
}

export default function NewMeal({ onSuccess, createUserMeal, userMeals }: AddMealProps) {
    const { toast } = useToast();
    return (
        <View>

        </View>
    )
}