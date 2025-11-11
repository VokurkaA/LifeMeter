import {H1} from '@/components/ui/Text';
import {ScrollView} from 'react-native';
import {foodService} from "@/services/food.service";
import { Button } from '@/components/ui/Button';
import React from 'react';

export default function NutritionScreen() {
  const fetchData = async () => {
    try {
      // Fetch page 1; change the number to request another page
      // const { data, pagination } = await foodService.getFoodById(77);
      const data = await foodService.getFoodById(77);
      console.log('Food:', JSON.stringify(data, null, 1));
      // console.log('Pagination:', pagination);
    } catch (err) {
      console.error('Failed to fetch food', err);
    }
  };

  return (<ScrollView className="flex flex-1 bg-background">
      <H1 className="m-4">Nutrition Screen</H1>
      <Button label="log" onPress={() => fetchData()} />
    </ScrollView>);
}
