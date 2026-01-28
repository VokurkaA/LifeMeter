import React from "react";
import { View } from "react-native";
import { CreateMealInput, UserMeal, UserFood } from "@/types/food.types";
import MealBuilder from "../components/MealBuilder";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

interface AddMealProps {
    onSuccess?: () => void;
    createUserMeal: (data: CreateMealInput) => Promise<void>;
    userMeals: { userMeal: UserMeal; userFoods: UserFood[]; }[]
}

export default function NewMeal({ onSuccess, createUserMeal }: AddMealProps) {
    const handleSave = async (data: CreateMealInput) => {
        await createUserMeal(data);
        onSuccess?.();
    };

    return (
        <BottomSheetScrollView showsVerticalScrollIndicator={false} >
            <MealBuilder onSave={handleSave} />
        </BottomSheetScrollView>
    );
}