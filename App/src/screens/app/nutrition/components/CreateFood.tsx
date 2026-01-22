import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Button, TextField } from 'heroui-native';
import { Text, Heading } from '@/components/Text';
import { useStore } from '@/contexts/useStore';
import { CreateFoodInput } from '@/types/food.types';

export default function CreateFood({ onSuccess }: { onSuccess?: () => void }) {
  const { createFood } = useStore();
  const [loading, setLoading] = useState(false);

  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');

  const [servingName, setServingName] = useState('serving');
  const [servingWeight, setServingWeight] = useState('');

  const handleSave = async () => {
    if (!description || !servingWeight) return;

    setLoading(true);
    try {
        const nutrients = [];
        if (calories) nutrients.push({ nutrient_nbr: 208, amount: parseFloat(calories) });
        if (protein) nutrients.push({ nutrient_nbr: 203, amount: parseFloat(protein) });
        if (fat) nutrients.push({ nutrient_nbr: 204, amount: parseFloat(fat) });
        if (carbs) nutrients.push({ nutrient_nbr: 205, amount: parseFloat(carbs) });

        const input: CreateFoodInput = {
            description,
            brand_owner: brand || undefined,
            portions: [{
                gram_weight: parseFloat(servingWeight),
                portion_amount: 1,
                portion_unit: servingName,
            }],
            nutrients
        };

        await createFood(input);
        onSuccess?.();
        
        // Reset form
        setDescription('');
        setBrand('');
        setCalories('');
        setProtein('');
        setFat('');
        setCarbs('');
        setServingName('serving');
        setServingWeight('');
        
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
      <Heading>Create New Food</Heading>
      
      <TextField>
        <TextField.Label>Food Name</TextField.Label>
        <TextField.Input value={description} onChangeText={setDescription} placeholder="e.g., Banana" />
      </TextField>

      <TextField>
        <TextField.Label>Brand (Optional)</TextField.Label>
        <TextField.Input value={brand} onChangeText={setBrand} placeholder="e.g., Chiquita" />
      </TextField>

      <Heading className="text-lg font-bold mt-4">Serving Size</Heading>
      <View className="flex-row gap-4">
        <View className="flex-1">
            <TextField>
                <TextField.Label>Unit Name</TextField.Label>
                <TextField.Input value={servingName} onChangeText={setServingName} placeholder="e.g., piece" />
            </TextField>
        </View>
        <View className="flex-1">
            <TextField>
                <TextField.Label>Weight (g)</TextField.Label>
                <TextField.Input value={servingWeight} onChangeText={setServingWeight} keyboardType="numeric" placeholder="e.g., 100" />
            </TextField>
        </View>
      </View>

      <Heading className="text-lg font-bold mt-4">Nutrients (per 100g)</Heading> 
      
      <View className="flex-row gap-4">
          <View className="flex-1">
            <TextField>
                <TextField.Label>Calories (kcal)</TextField.Label>
                <TextField.Input value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="0" />
            </TextField>
          </View>
          <View className="flex-1">
            <TextField>
                <TextField.Label>Protein (g)</TextField.Label>
                <TextField.Input value={protein} onChangeText={setProtein} keyboardType="numeric" placeholder="0" />
            </TextField>
          </View>
      </View>
      <View className="flex-row gap-4">
          <View className="flex-1">
            <TextField>
                <TextField.Label>Carbs (g)</TextField.Label>
                <TextField.Input value={carbs} onChangeText={setCarbs} keyboardType="numeric" placeholder="0" />
            </TextField>
          </View>
          <View className="flex-1">
            <TextField>
                <TextField.Label>Fat (g)</TextField.Label>
                <TextField.Input value={fat} onChangeText={setFat} keyboardType="numeric" placeholder="0" />
            </TextField>
          </View>
      </View>

      <Button onPress={handleSave} isDisabled={loading} className="mt-6">
        {loading ? 'Saving...' : 'Create Food'}
      </Button>
    </ScrollView>
  );
}
