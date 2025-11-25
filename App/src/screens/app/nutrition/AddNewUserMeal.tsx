import { KeyboardAvoidingView, View } from 'react-native';
import { Input } from '@/components/ui/Input';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { Time } from '@/lib/Time';
import { FoodDetail, Portion, UserFood } from '@/types/food.types';
import { foodService } from '@/services/food.service';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/Card';
import { Select, SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ScrollView } from 'react-native-gesture-handler';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/contexts/useStore';

export default function AddNewUserMeal({
  setOpen,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { createUserMeal } = useStore();
  const { toast } = useToast();
  const [mealName, setMealName] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [eatenAt, setEatenAt] = useState(Time.now().toISOString());

  const [foodSearchText, setFoodSearchText] = useState('');
  const [newFoodVariants, setNewFoodVariants] = useState<SelectOption[]>([]);
  const [newFoods, setNewFoods] = useState<UserFood[]>([]);
  const [newFoodsDetail, setNewFoodsDetail] = useState<FoodDetail[]>([]);

  const [selectedNewFood, setSelectedNewFood] = useState<FoodDetail | null>(null);
  const [selectedNewFoodPortionVariants, setSelectedNewFoodPortionVariants] = useState<
    SelectOption[]
  >([]);
  const [selectedNewFoodTotalGrams, setSelectedNewFoodTotalGrams] = useState<number | null>(null);
  const [selectedNewFoodQuantity, setSelectedNewFoodQuantity] = useState<number | null>(null);
  const [selectedNewFoodPortion, setSelectedNewFoodPortion] = useState<Portion | null>(null);
  const [selectedNewFoodDescription, setSelectedNewFoodDescription] = useState<string>('');

  const resetNewFoodValues = () => {
    setSelectedNewFood(null);
    setSelectedNewFoodPortionVariants([]);
    setSelectedNewFoodTotalGrams(null);
    setSelectedNewFoodQuantity(null);
    setSelectedNewFoodPortion(null);
    setSelectedNewFoodDescription('');
  };

  const selectFood = async (foodId: number, foodLabel: string) => {
    setFoodSearchText(foodLabel);

    const food = await foodService.getFoodById(foodId);
    setSelectedNewFood(food);
    setSelectedNewFoodPortionVariants(
      food.portions.length > 0
        ? [
            ...food.portions.map((p) => ({
              label: `${p.portion_amount || ''} ${p.portion_unit || ''} ${p.modifier || ''} (${p.gram_weight}g)`,
              value: String(p.id),
            })),
            { label: 'other', value: 'other' },
          ]
        : [],
    );
    setSelectedNewFoodPortion(null);
    setSelectedNewFoodTotalGrams(null);
    setSelectedNewFoodQuantity(null);
    setSelectedNewFoodDescription('');

    setNewFoodVariants([]);
  };

  const handleSearchTextChange = (text: string) => {
    setFoodSearchText(text);
    resetNewFoodValues();
  };

  const performFoodSearch = async (query: string) => {
    if (!query || query.length < 2) return;

    resetNewFoodValues();
    const val = await foodService.getFoodByName(query);
    setNewFoodVariants(
      val.data
        ? val.data.map((c) => ({
            label: c.description,
            value: String(c.id),
          }))
        : [],
    );
  };

  const handlePortionChange = (val: string) => {
    if (val === 'other') {
      setSelectedNewFoodPortion(null);
    } else if (selectedNewFood) {
      const portion = selectedNewFood.portions.find((p) => String(p.id) === val);
      const targetPortion = portion || null;

      setSelectedNewFoodPortion(targetPortion);

      const currentQty = selectedNewFoodQuantity ?? 1;
      if (!selectedNewFoodQuantity) setSelectedNewFoodQuantity(1);

      if (targetPortion) {
        setSelectedNewFoodTotalGrams(targetPortion.gram_weight * currentQty);
      }
    }
  };

  const handleAddNewFood = () => {
    if (!selectedNewFood) return;
    if (!selectedNewFoodTotalGrams || selectedNewFoodTotalGrams <= 0) return;

    if (newFoodsDetail.some((item) => item.food.id === selectedNewFood.food.id)) {
      toast('You have already added this food to the meal.', 'info', 1000, 'top', false, 'narrow');
      return;
    }

    setNewFoodsDetail((prev) => [...prev, selectedNewFood]);

    const newFood: UserFood = {
      id: '-',
      user_meal_id: '-',
      food_id: selectedNewFood.food.id,
      total_grams: selectedNewFoodTotalGrams,
      quantity: selectedNewFoodQuantity ?? 1,
      portion_id: selectedNewFoodPortion?.id,
      description: selectedNewFoodDescription,
    };
    setNewFoods((prev) => [...prev, newFood]);

    resetNewFoodValues();
    setFoodSearchText('');
  };

  const handleQuantityChange = (text: string) => {
    const newQty = text ? Number(text) : null;
    setSelectedNewFoodQuantity(newQty);
    setSelectedNewFoodPortion(null);
    if (selectedNewFoodPortion && newQty !== null) {
      setSelectedNewFoodTotalGrams(selectedNewFoodPortion.gram_weight * newQty);
    }
  };

  const addUserMeal = () => {
    createUserMeal({
      name: mealName,
      eaten_at: eatenAt,
      items: newFoods.map((f) => ({
        food_id: f.food_id,
        total_grams: f.total_grams,
        quantity: f.quantity,
        portion_id: f.portion_id || null,
        description: f.description || null,
      })),
    }).then(() => {
      toast('Meal created successfully', 'success', 500, 'top', false, 'narrow');
      resetNewFoodValues();
      setFoodSearchText('');
      setMealName('');
      setMealDescription('');
      setOpen(false);
    });
  };

  return (
    <KeyboardAvoidingView>
      <ScrollView className="gap-4 pb-20 pt-4">
        <Input
          label="Meal name"
          placeholder="Eg. Oats with peanut butter"
          value={mealName}
          onChangeText={setMealName}
        />
        <Input
          label="Meal description"
          placeholder=" "
          value={mealDescription}
          onChangeText={setMealDescription}
        />
        <Input
          label="Eaten at"
          value={Time.format(eatenAt, 'YYYY-MM-DD HH:mm')}
          onChangeText={(val) => {
            setEatenAt(Time.parse(val.replace(' ', 'T'), { assumeUTC: true }).toISOString());
          }}
        />

        <View className="gap-2">
          <Card>
            <Select
              title="Food name"
              placeholder="Search to filter..."
              withSearchbar={true}
              value={foodSearchText}
              onChange={handleSearchTextChange}
              onSearch={performFoodSearch}
              variants={newFoodVariants}
              onSelect={(selected) => {
                selectFood(Number(selected.value), selected.label);
              }}
            />

            {selectedNewFood && (
              <View className="gap-2 p-2">
                {selectedNewFoodPortionVariants.length > 0 && (
                  <Select
                    title="Select a portion"
                    placeholder="Select a portion"
                    variants={selectedNewFoodPortionVariants}
                    value={
                      selectedNewFoodPortion
                        ? `${selectedNewFoodPortion.portion_amount || ''} ${selectedNewFoodPortion.portion_unit || ''} ${selectedNewFoodPortion.modifier || ''} (${selectedNewFoodPortion.gram_weight}g)`
                        : ''
                    }
                    onChange={handlePortionChange}
                  />
                )}
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Input
                      label="Quantity"
                      placeholder="1"
                      value={
                        selectedNewFoodQuantity !== null ? String(selectedNewFoodQuantity) : ''
                      }
                      onChangeText={handleQuantityChange}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="Gram weight"
                      placeholder="Eg. 120g"
                      value={
                        selectedNewFoodTotalGrams !== null ? String(selectedNewFoodTotalGrams) : ''
                      }
                      onChangeText={(val) => {
                        setSelectedNewFoodTotalGrams(val ? Number(val) : null);
                      }}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                <Input
                  label="Description"
                  placeholder=""
                  value={selectedNewFoodDescription}
                  onChangeText={(text) => setSelectedNewFoodDescription(text)}
                />
                <Button label="Add" onPress={() => handleAddNewFood()} />
              </View>
            )}
          </Card>
          <ScrollView>
            {newFoodsDetail.map((f, i) => (
              <Card key={i}>
                <CardHeader>
                  <Text className="text-lg font-bold">{f.food.description}</Text>
                </CardHeader>
                <CardContent>
                  <CardDescription>{f.category?.name || ''}</CardDescription>
                  <Text className="text-gray-500">
                    {f.brandedFood?.brand_name || ''} {f.brandedFood?.brand_owner || ''}{' '}
                    {f.brandedFood?.subbrand_name || ''}
                    {f.brandedFood?.ingredients}
                  </Text>
                </CardContent>
              </Card>
            ))}
          </ScrollView>
          <Button
            label="Add meal"
            onPress={() => {
              addUserMeal();
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
