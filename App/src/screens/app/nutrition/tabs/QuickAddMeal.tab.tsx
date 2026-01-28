import ComboBox, { SelectOption } from "@/components/Combobox";
import { foodService } from "@/services/food.service";
import { CreateMealInput, FoodDetail, FoodSearchResult } from "@/types/food.types";
import { useState } from "react";
import { View } from "react-native";
import FoodDetailForm from "../components/FoodDetailForm";
import { useFoodSearch } from "../hooks/useFoodSearch";
import { Muted, Text } from "@/components/Text";

interface QuickAddMealProps {
    onSuccess?: () => void;
    createUserMeal: (data: CreateMealInput) => Promise<void>;
}

export default function QuickAddMeal({ onSuccess, createUserMeal }: QuickAddMealProps) {
    const { options: foodOptions, isLoading: isSearching, search: filterFoods, loadMore } = useFoodSearch();
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

    const renderFoodItem = (item: SelectOption) => {
        const food = item.data as FoodSearchResult;
        return (
            <View className="flex-col gap-1 py-1">
                <Text className="font-semibold">{food.description}</Text>
                {(food.brand_name || food.category_name || food.brand_owner) && (
                    <Muted className="text-xs">
                        {[food.brand_name, food.brand_owner, food.category_name].filter(Boolean).join(" • ")}
                    </Muted>
                )}
            </View>
        );
    };

    return (
        <View>
            <ComboBox
                items={foodOptions}
                onValueChange={handleFoodSelect}
                selectedOption={selectedFood}
                onSearchQueryChange={filterFoods}
                isLoading={isSearching || isFetchingDetail}
                onEndReached={loadMore}
                renderItem={renderFoodItem}
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
