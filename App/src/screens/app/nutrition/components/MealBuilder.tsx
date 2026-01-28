import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { TextField, Button, useToast, SkeletonGroup, useThemeColor, Surface, Card, PressableFeedback } from "heroui-native";
import { Muted, Text } from "@/components/Text";
import ComboBox, { SelectOption } from "@/components/Combobox";
import { foodService } from "@/services/food.service";
import { CreateMealInput, Food, FoodDetail, MealItemInput } from "@/types/food.types";
import { Trash2, Plus, Calculator, XIcon } from "lucide-react-native";
import { normalizePositiveDecimal } from "@/lib/normalize";
import { SelectWithTrigger } from "@/components/SelectWithTrigger";
import { BottomSheetTextInput } from "@/components/BottomSheetTextInput";

interface MealBuilderProps {
    initialData?: CreateMealInput;
    onSave: (data: CreateMealInput) => Promise<void>;
    onCancel?: () => void;
}

interface BuilderItem {
    id: string; 
    foodDetail: FoodDetail;
    gramAmount: number;
    portionId?: number;
}

export default function MealBuilder({ initialData, onSave, onCancel }: MealBuilderProps) {
    const { toast } = useToast();
    const [mealName, setMealName] = useState(initialData?.name || "");
    const [items, setItems] = useState<BuilderItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingInitial, setIsLoadingInitial] = useState(false);

    const [foodOptions, setFoodOptions] = useState<SelectOption[]>([]);
    const [selectedFood, setSelectedFood] = useState<SelectOption | undefined>();
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchingList, setIsSearchingList] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (initialData?.items && initialData.items.length > 0) {
            setIsLoadingInitial(true);
            const loadItems = async () => {
                try {
                    const loadedItems = await Promise.all(
                        initialData.items.map(async (item) => {
                            const detail = await foodService.getFoodById(item.food_id);
                            return {
                                id: Math.random().toString(36).substr(2, 9),
                                foodDetail: detail,
                                gramAmount: item.total_grams,
                                portionId: item.portion_id ?? undefined,
                            };
                        })
                    );
                    setItems(loadedItems);
                } catch (error) {
                    console.error("Failed to load initial items:", error);
                } finally {
                    setIsLoadingInitial(false);
                }
            };
            loadItems();
        }
    }, [initialData]);

    const dataToOptions = (data: Food[]): SelectOption[] =>
        data.map(food => ({
            label: food.description,
            value: String(food.id),
        }));

    const filterFoods = useCallback((query: string) => {
        setIsSearchingList(true);
        const task = query.trim()
            ? foodService.getFoodByName(query)
            : foodService.getAllFood();

        task.then(res => setFoodOptions(dataToOptions(res.data)))
            .finally(() => setIsSearchingList(false));
    }, []);

    const handleFoodSelect = async (option: SelectOption | undefined) => {
        if (!option) return;
        setIsSearching(true);
        try {
            const detail = await foodService.getFoodById(Number(option.value));
            const newItem: BuilderItem = {
                id: Math.random().toString(36).substr(2, 9),
                foodDetail: detail,
                gramAmount: detail.portions.length > 0 ? detail.portions[0].gram_weight : 100,
                portionId: detail.portions.length > 0 ? detail.portions[0].id : undefined,
            };
            setItems(prev => [...prev, newItem]);
            setSelectedFood(undefined);
            setSearchQuery(""); 
        } catch (error) {
            console.error("Failed to add food:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const updateItem = (id: string, updates: Partial<BuilderItem>) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const totalNutrients = useMemo(() => {
        const summary = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };

        items.forEach(item => {
            const factor = item.gramAmount / 100;
            item.foodDetail.nutrients.forEach(n => {
                const amount = (n.amount || 0) * factor;
                if (n.nutrient_nbr === 208) summary.calories += amount;
                if (n.nutrient_nbr === 203) summary.protein += amount;
                if (n.nutrient_nbr === 205) summary.carbs += amount;
                if (n.nutrient_nbr === 204) summary.fat += amount;
            });
        });

        return summary;
    }, [items]);

    const handleSave = async () => {
        if (!mealName.trim()) {
            toast.show({ variant: "danger", label: "Error", description: "Please enter a meal name" });
            return;
        }
        if (items.length === 0) {
            toast.show({ variant: "danger", label: "Error", description: "Please add at least one food item" });
            return;
        }

        setIsSaving(true);
        try {
            const payload: CreateMealInput = {
                name: mealName,
                items: items.map(item => ({
                    food_id: item.foodDetail.food.id,
                    total_grams: item.gramAmount,
                    portion_id: item.portionId || null,
                    quantity: 1,
                })),
            };
            await onSave(payload);
            toast.show({ variant: "success", label: "Success", description: "Meal saved successfully" });
        } catch (error) {
            console.error("Failed to save meal:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingInitial) {
        return (
            <View className="gap-4 p-4">
                <SkeletonGroup isLoading={true}>
                    <SkeletonGroup.Item className="h-12 w-full rounded-lg" />
                    <SkeletonGroup.Item className="h-40 w-full rounded-lg" />
                    <SkeletonGroup.Item className="h-20 w-full rounded-lg" />
                </SkeletonGroup>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1" contentContainerClassName="pb-20">
            <View className="gap-4">
                <TextField>
                    <TextField.Label>Meal Name</TextField.Label>
                    <BottomSheetTextInput
                        placeholder="e.g. Healthy Breakfast"
                        value={mealName}
                        onChangeText={setMealName}
                    />
                </TextField>

                <View className="gap-2">
                    <Text className="font-semibold">Add Foods</Text>
                    <ComboBox
                        items={foodOptions}
                        onValueChange={handleFoodSelect}
                        selectedOption={selectedFood}
                        onSearchQueryChange={filterFoods}
                        searchQuery={searchQuery} 
                        setSearchQuery={setSearchQuery} 
                        isLoading={isSearchingList}
                    />
                </View>

                {items.length > 0 && (
                    <Card className="gap-4">
                        <Card.Header>
                            <Card.Title>Macros</Card.Title>
                        </Card.Header>
                        <Card.Body className="flex flex-row items-center justify-between px-2">
                            <NutrientStat label="Calories" value={totalNutrients.calories} unit="kcal" />
                            <NutrientStat label="Protein" value={totalNutrients.protein} unit="g" />
                            <NutrientStat label="Carbs" value={totalNutrients.carbs} unit="g" />
                            <NutrientStat label="Fat" value={totalNutrients.fat} unit="g" />
                        </Card.Body>
                    </Card>
                )}

                {items.length > 0 && (
                    <View className="gap-4">
                        <Text className="font-semibold">Selected Items ({items.length})</Text>
                        {items.map((item) => (
                            <BuilderItemRow
                                key={item.id}
                                item={item}
                                onUpdate={(updates) => updateItem(item.id, updates)}
                                onRemove={() => removeItem(item.id)}
                            />
                        ))}
                    </View>
                )}

                <View className="flex flex-row gap-3">
                    {onCancel && (
                        <Button onPress={onCancel} variant="tertiary" className="flex-1">
                            <Button.Label>Cancel</Button.Label>
                        </Button>
                    )}
                    <Button
                        onPress={handleSave}
                        className="flex-1"
                        isDisabled={isSaving || items.length === 0 || !mealName}
                    >
                        <Button.Label>{isSaving ? "Saving..." : "Save Meal"}</Button.Label>
                    </Button>
                </View>
            </View>
        </ScrollView>
    );
}

function BuilderItemRow({ item, onUpdate, onRemove }: {
    item: BuilderItem;
    onUpdate: (updates: Partial<BuilderItem>) => void;
    onRemove: () => void
}) {
    const dangerColor = useThemeColor('danger');
    const portionsOptions = useMemo(() => {
        return item.foodDetail.portions.map(p => ({
            value: String(p.id),
            label: `${p.portion_amount ?? ""} ${p.portion_unit ?? ""} ${p.modifier ?? ""} (${p.gram_weight} g)`.trim(),
        }));
    }, [item.foodDetail]);

    const selectedPortionOption = useMemo(() => {
        return portionsOptions.find(o => o.value === String(item.portionId));
    }, [portionsOptions, item.portionId]);

    const handlePortionChange = (option?: SelectOption) => {
        if (!option) return;
        const portion = item.foodDetail.portions.find(p => String(p.id) === option.value);
        if (portion) {
            onUpdate({ portionId: portion.id, gramAmount: portion.gram_weight });
        }
    };

    return (
        <Card>
            <Card.Header>
                <View className="flex flex-row gap-2 items-start">
                    <View className="flex-1">
                        <Card.Title className="shrink">{item.foodDetail.food.description}</Card.Title>
                        <Card.Description className="text-sm">{item.foodDetail.category?.name}</Card.Description>
                    </View>
                    <PressableFeedback onPress={onRemove}>
                        <XIcon color={dangerColor} />
                    </PressableFeedback>
                </View>
            </Card.Header>

            <Card.Body className="flex flex-row items-center gap-4 my-2">
                <View className="flex flex-2">
                    <SelectWithTrigger
                        label="Portion"
                        options={portionsOptions}
                        value={selectedPortionOption}
                        onValueChange={handlePortionChange}
                        isDisabled={portionsOptions.length === 0}
                    />
                </View>
                <View className="flex-1">
                    <TextField>
                        <TextField.Label>Grams</TextField.Label>
                        <BottomSheetTextInput
                            keyboardType="numeric"
                            placeholder="0"
                            value={String(item.gramAmount === 0 ? "" : item.gramAmount)}
                            onChangeText={(text) => {
                                if (text === "") {
                                    onUpdate({ gramAmount: 0, portionId: undefined });
                                    return;
                                }
                                const { value } = normalizePositiveDecimal(text, { maxDecimals: 2 });
                                if (value !== undefined) {
                                    onUpdate({ gramAmount: value, portionId: undefined });
                                }
                            }}
                        />
                    </TextField>
                </View>
            </Card.Body>
        </Card>
    );
}

function NutrientStat({ label, value, unit }: { label: string; value: number; unit: string }) {
    return (
        <View className="flex items-center">
            <Muted>{label}</Muted>
            <View className="flex-row items-baseline">
                <Text className="font-bold">{Math.round(value)}</Text>
                <Text className="text-[10px] ml-0.5 text-foreground/60">{unit}</Text>
            </View>
        </View>
    );
}
