import ComboBox, { SelectOption } from "@/components/Combobox";
import { foodService } from "@/services/food.service";
import { CreateMealInput, FoodDetail } from "@/types/food.types";
import { useState } from "react";
import { View } from "react-native";
import FoodDetailForm from "../components/FoodDetailForm";
import { useFoodSearch } from "../hooks/useFoodSearch";

interface QuickAddMealProps {
    onSuccess?: () => void;
    createUserMeal: (data: CreateMealInput) => Promise<void>;
}

export default function QuickAddMeal({ onSuccess, createUserMeal }: QuickAddMealProps) {
    const { options: foodOptions, isLoading: isSearching, search: filterFoods } = useFoodSearch();
    const [selectedFood, setSelectedFood] = useState<SelectOption | undefined>();
    const [foodDetail, setFoodDetail] = useState<FoodDetail>();
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);

    const handleFoodSelect = (value: SelectOption | undefined) => {
        setSelectedFood(value);
        setFoodDetail(undefined);

        if (!value) return;

        setIsFetchingDetail(true);
        foodService.getFoodById(Number(value.value))
            .then(res => {
                setFoodDetail(res);
            })
            .finally(() => setIsFetchingDetail(false));
    };

    const handleSuccess = () => {
        setFoodDetail(undefined);
        setSelectedFood(undefined);
        onSuccess?.();
    };

    return (
        <View>
            <ComboBox
                items={foodOptions}
                onValueChange={handleFoodSelect}
                selectedOption={selectedFood}
                onSearchQueryChange={filterFoods}
                isLoading={isSearching || isFetchingDetail}
            />
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
