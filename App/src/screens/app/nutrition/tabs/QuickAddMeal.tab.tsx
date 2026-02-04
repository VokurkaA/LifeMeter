import { foodService } from "@/services/food.service";
import { CreateMealInput, FoodDetail, FoodSearchResult } from "@/types/food.types";
import { useState } from "react";
import { View } from "react-native";
import FoodDetailForm from "../components/FoodDetailForm";
import { useFoodSearch } from "../hooks/useFoodSearch";
import { Muted, Text } from "@/components/Text";
import { Combobox } from "@/components/Combobox";

type ComboboxOption<TData = unknown> = {
    value: string;
    label: string;
    data?: TData;
};

interface QuickAddMealProps {
    onSuccess?: () => void;
    createUserMeal: (data: CreateMealInput) => Promise<void>;
}

export default function QuickAddMeal({ onSuccess, createUserMeal }: QuickAddMealProps) {
    const { options: foodOptionsRaw, isLoading: isSearching, search: filterFoods, loadMore } = useFoodSearch();
    const foodOptions = foodOptionsRaw as readonly ComboboxOption<FoodSearchResult>[];

    const [selectedFood, setSelectedFood] = useState<ComboboxOption<FoodSearchResult> | undefined>();
    const [foodDetail, setFoodDetail] = useState<FoodDetail>();
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);

    const handleFoodSelect = (value: ComboboxOption<FoodSearchResult> | undefined) => {
        setSelectedFood(value);
        setFoodDetail(undefined);

        if (!value) return;

        setIsFetchingDetail(true);
        foodService
            .getFoodById(Number(value.value))
            .then((res) => {
                setFoodDetail(res);
            })
            .finally(() => setIsFetchingDetail(false));
    };

    const handleSuccess = () => {
        setFoodDetail(undefined);
        setSelectedFood(undefined);
        onSuccess?.();
    };

    const renderFoodItem = (item: ComboboxOption<FoodSearchResult>) => {
        const food = item.data;
        if (!food) {
            return (
                <View className="flex-col gap-1 py-1">
                    <Text className="font-semibold">{item.label}</Text>
                </View>
            );
        }

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
            <Combobox<ComboboxOption<FoodSearchResult>>
                options={foodOptions}
                value={selectedFood}
                onChange={handleFoodSelect}
                getOptionValue={(opt) => String(opt.value)}
                getOptionLabel={(opt) => opt.label}
                onSearchQueryChange={filterFoods}
                isLoading={isSearching || isFetchingDetail}
                onEndReached={loadMore}
                renderOption={(opt) => renderFoodItem(opt)}
            />

            {foodDetail && (
                <FoodDetailForm foodDetail={foodDetail} onSuccess={handleSuccess} createUserMeal={createUserMeal} />
            )}
        </View>
    );
}
