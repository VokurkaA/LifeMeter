import ComboBox, { SelectOption } from "@/components/Combobox";
import { foodService } from "@/services/food.service";
import { CreateMealInput, Food, FoodDetail } from "@/types/food.types";
import { useState, useCallback } from "react";
import { View } from "react-native";
import FoodDetailForm from "../components/FoodDetailForm";

interface QuickAddMealProps {
    onSuccess?: () => void;
    createUserMeal: (data: CreateMealInput) => Promise<void>;
}

export default function QuickAddMeal({ onSuccess, createUserMeal }: QuickAddMealProps) {
    const [foodOptions, setFoodOptions] = useState<SelectOption[]>([]);
    const [selectedFood, setSelectedFood] = useState<SelectOption | undefined>();
    const [foodDetail, setFoodDetail] = useState<FoodDetail>();

    const dataToOptions = (data: Food[]): SelectOption[] =>
        data.map(food => ({
            label: food.description,
            value: String(food.id),
        }));

    const filterFoods = useCallback((query: string) => {
        const task = query.trim()
            ? foodService.getFoodByName(query)
            : foodService.getAllFood();

        task.then(res => setFoodOptions(dataToOptions(res.data)));
    }, []);

    const handleFoodSelect = (value: SelectOption | undefined) => {
        setSelectedFood(value);
        setFoodDetail(undefined);

        if (!value) return;

        foodService.getFoodById(Number(value.value)).then(res => {
            setFoodDetail(res);
        });
    };

    const handleSuccess = () => {
        setFoodDetail(undefined);
        setSelectedFood(undefined);
        onSuccess?.();
    };

    return (
        <View className="flex-1 gap-4">
            <View className="mt-2">
                <ComboBox
                    items={foodOptions}
                    onValueChange={handleFoodSelect}
                    selectedOption={selectedFood}
                    onSearchQueryChange={filterFoods}
                />
            </View>

            {foodDetail && (
                <FoodDetailForm 
                    foodDetail={foodDetail} 
                    onSuccess={handleSuccess}
                    createUserMeal={createUserMeal}
                />
            )}
        </View>
    );
}
