import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { Muted, Text } from "@/components/Text";
import { Button, TextField, useToast } from "heroui-native";
import { SelectWithTrigger } from "@/components/SelectWithTrigger";
import { normalizePositiveDecimal } from "@/lib/normalize";
import { CreateMealInput, FoodDetail } from "@/types/food.types";
import { SelectOption } from "@/components/Combobox";
import { BottomSheetTextInput } from "@/components/BottomSheetTextInput";

interface FoodDetailFormProps {
    foodDetail: FoodDetail;
    onSuccess?: () => void;
    createUserMeal: (data: CreateMealInput) => Promise<void>;
}

export default function FoodDetailForm({ foodDetail, onSuccess, createUserMeal }: FoodDetailFormProps) {
    const { toast } = useToast();
    const [portionsOptions, setPortionsOptions] = useState<SelectOption[]>([]);
    const [selectedPortion, setSelectedPortion] = useState<SelectOption | undefined>();
    const [gramAmount, setGramAmount] = useState<number | undefined>(100);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (foodDetail) {
            const options = foodDetail.portions.map(p => ({
                value: String(p.id),
                label: `${p.portion_amount ?? ""} ${p.portion_unit ?? ""} ${p.modifier ?? ""} (${p.gram_weight} g)`.trim(),
            }));
            setPortionsOptions(options);

            if (foodDetail.portions.length > 0) {
                const firstPortion = foodDetail.portions[0];
                setSelectedPortion({
                    value: String(firstPortion.id),
                    label: `${firstPortion.portion_amount ?? ""} ${firstPortion.portion_unit ?? ""} ${firstPortion.modifier ?? ""} (${firstPortion.gram_weight} g)`.trim()
                });
                setGramAmount(firstPortion.gram_weight);
            } else {
                setGramAmount(100);
                setSelectedPortion(undefined);
            }
        }
    }, [foodDetail]);

    const syncPortionFromGrams = (grams?: number) => {
        if (!grams || !foodDetail) {
            setSelectedPortion(undefined);
            return;
        }

        const portion = foodDetail.portions.find(
            p => p.gram_weight === grams
        );

        setSelectedPortion(
            portion
                ? portionsOptions.find(o => o.value === String(portion.id))
                : undefined
        );
    };

    const handlePortionChange = (option?: SelectOption) => {
        setSelectedPortion(option);

        if (!option || !foodDetail) {
            setGramAmount(undefined);
            return;
        }

        const portion = foodDetail.portions.find(
            p => String(p.id) === option.value
        );

        setGramAmount(portion?.gram_weight);
    };

    const handleAdd = async () => {
        if (!foodDetail || gramAmount === undefined) return;

        setIsSubmitting(true);
        try {
            await createUserMeal({
                name: `${foodDetail.food.description}`,
                items: [
                    {
                        food_id: foodDetail.food.id,
                        total_grams: gramAmount,
                        quantity: 1,
                        portion_id: selectedPortion ? Number(selectedPortion.value) : null,
                        description: null,
                    },
                ],
            });
            toast.show({
                variant: "success",
                label: 'Meal added',
                description: 'Your meal has been logged successfully.',
            });
            onSuccess?.();
        } catch (error) {
            console.error("Failed to add meal:", error);
            toast.show({
                variant: "danger",
                label: 'Failed to add meal',
                description: 'An error occurred while logging your meal.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="gap-4">
            <View>
                <Text className="text-xl font-bold">
                    {foodDetail.food.description}
                </Text>

                <View className="flex-row flex-wrap gap-x-2">
                    <Muted>{foodDetail.category?.name}</Muted>

                    {foodDetail.brandedFood && (
                        <View className="ml-auto flex-row items-center">
                            <Muted>
                                {foodDetail.brandedFood.brand_name || ""}{" "}
                                {foodDetail.brandedFood.brand_owner || ""}{" "}
                                {foodDetail.brandedFood.subbrand_name || ""}
                            </Muted>
                        </View>
                    )}
                </View>
            </View>

            {foodDetail.portions.length > 0 && (
                <SelectWithTrigger
                    label="Select Portion"
                    options={portionsOptions}
                    value={selectedPortion}
                    onValueChange={handlePortionChange}
                />
            )}

            <TextField>
                <TextField.Label>Amount (grams)</TextField.Label>
                <BottomSheetTextInput
                    keyboardType="numeric"
                    placeholder="100"
                    value={gramAmount !== undefined ? String(gramAmount) : ""}
                    onChangeText={(text) => {
                        const { value } = normalizePositiveDecimal(text, {
                            maxDecimals: 2,
                        });

                        if (value === undefined) {
                            setGramAmount(undefined);
                            setSelectedPortion(undefined);
                            return;
                        }

                        setGramAmount(value);
                        syncPortionFromGrams(value);
                    }} />
            </TextField>

            {foodDetail.brandedFood?.ingredients && (
                <View>
                    <Text className="font-semibold mb-1">Ingredients</Text>
                    <Muted className="text-xs leading-5 capitalize">
                        {foodDetail.brandedFood.ingredients.toLowerCase()}
                    </Muted>
                </View>
            )}

            {foodDetail.nutrients.length > 0 && (
                <View>
                    <Text className="font-semibold mb-2">Detailed Nutrients</Text>
                    {foodDetail.nutrients
                        .filter(n => n.amount > 0)
                        .map(n => (
                            <View
                                key={n.nutrient_nbr}
                                className="flex-row justify-between pb-px"
                            >
                                <Muted className="flex-1 mr-4">{n.name}</Muted>
                                <View className="flex-row items-baseline">
                                    <Text className="font-medium">
                                        {(
                                            (n.amount * (gramAmount ?? 100)) /
                                            100
                                        ).toFixed(2)}
                                    </Text>
                                    <Muted className="ml-1 text-xs lowercase">
                                        {n.unit}
                                    </Muted>
                                </View>
                            </View>
                        ))}
                </View>
            )}

            <Button
                onPress={handleAdd}
                isDisabled={isSubmitting || gramAmount === undefined || gramAmount <= 0}
            >
                <Button.Label>
                    {isSubmitting ? "Adding..." : "Add"}
                </Button.Label>
            </Button>
        </View>
    );
}
