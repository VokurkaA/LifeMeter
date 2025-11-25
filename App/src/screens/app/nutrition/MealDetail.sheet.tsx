import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { CompleteNutrient, FullUserMeal } from '@/types/food.types';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { H1, H2, Text } from '@/components/ui/Text';
import { Time } from '@/lib/Time';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollView } from 'react-native-gesture-handler';
import { useStore } from '@/contexts/useStore';
import DeleteIcon from '@/components/icons/delete';
import EditIcon from '@/components/icons/edit';
import AddNewUserMeal from './AddNewUserMeal';

const getNutrient = (nutrients: CompleteNutrient[], id: number) => {
  return nutrients.find((n) => n.nutrient_nbr === id);
};

export function MealDetailSheet({ meal }: { meal: FullUserMeal }) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { deleteUserMeal } = useStore();

  const handleDelete = () => {
    Alert.alert('Delete Meal', 'Are you sure you want to delete this meal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteUserMeal(meal.userMeal.id);
          setOpen(false);
        },
      },
    ]);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setIsEditing(false); // Reset edit mode on close
      }}
    >
      <BottomSheetTrigger asChild>
        <Button label="Details" size="sm" />
      </BottomSheetTrigger>

      <BottomSheetContent className="p-4" minHeightRatio={0.9}>
        {isEditing ? (
          <>
            <BottomSheetHeader className="mb-2 flex-row items-center justify-between">
              <BottomSheetTitle>Edit Meal</BottomSheetTitle>
              <Button
                label="Cancel"
                size="sm"
                variant="ghost"
                onPress={() => setIsEditing(false)}
              />
            </BottomSheetHeader>
            <AddNewUserMeal setOpen={setOpen} initialMeal={meal} />
          </>
        ) : (
          <ScrollView>
            <BottomSheetHeader className="flex-row items-center justify-between">
              <BottomSheetTitle>Meal Details</BottomSheetTitle>
              <View className="flex-row gap-2">
                <Button
                  label=""
                  icon={<EditIcon size={20} color="black" />}
                  variant="ghost"
                  onPress={() => setIsEditing(true)}
                />
                <Button
                  label=""
                  icon={<DeleteIcon size={20} color="red" />}
                  variant="ghost"
                  onPress={handleDelete}
                />
              </View>
            </BottomSheetHeader>

            <View>
              <View className="gap-4 pb-6 pt-2">
                <View>
                  <H1>{meal.userMeal.name}</H1>
                  <Text className="text-secondary-foreground">
                    {Time.format(meal.userMeal.eaten_at, 'DD.MM.YYYY, HH:mm')}
                  </Text>
                </View>

                {meal.userFoods.map((f) => {
                  return (
                    <Card key={f.userFood.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <View className="flex-row items-start justify-between gap-2">
                          <View className="flex-1">
                            <H2 className="mb-1 text-lg leading-tight">
                              {f.foodDetail.food.description}
                            </H2>
                            <Text className="text-xs text-muted-foreground">
                              {f.foodDetail.brandedFood?.brand_name || ''}
                              {f.foodDetail.brandedFood?.subbrand_name || ''}
                              {f.foodDetail.brandedFood?.brand_owner || ''}
                            </Text>
                          </View>
                          {f.foodDetail.category?.name && (
                            <Badge label={f.foodDetail.category.name} variant="secondary" />
                          )}
                        </View>
                      </CardHeader>

                      <CardContent>
                        {f.userFood.description && (
                          <Text className="mb-3 italic text-secondary-foreground">
                            {f.userFood.description}
                          </Text>
                        )}

                        <View className="mb-4 flex-row justify-between rounded-md bg-secondary/20 p-3">
                          <MacroItem
                            value={getNutrient(f.foodDetail.nutrients, 208)}
                            label="Calories"
                          />
                          <MacroItem
                            value={getNutrient(f.foodDetail.nutrients, 203)}
                            label="Protein"
                          />
                          <MacroItem
                            value={getNutrient(f.foodDetail.nutrients, 205)}
                            label="Carbs"
                          />
                          <MacroItem value={getNutrient(f.foodDetail.nutrients, 204)} label="Fat" />
                        </View>

                        <View className="flex-row flex-wrap gap-y-2">
                          {f.foodDetail.nutrients
                            .filter((n) => n.amount > 0)
                            .filter((n) => ![203, 204, 205, 208].includes(n.nutrient_nbr))
                            .map((n) => (
                              <View
                                key={`${n.food_id}-${n.nutrient_nbr}`}
                                className="w-1/2 flex-row justify-between pr-2"
                              >
                                <Text className="mr-2 truncate text-sm text-muted-foreground">
                                  {n.name}
                                </Text>
                                <Text className="text-sm font-medium">
                                  {n.amount.toFixed(1)} {n.unit}
                                </Text>
                              </View>
                            ))}
                        </View>
                      </CardContent>
                    </Card>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
}

function MacroItem({ value, label }: { value: CompleteNutrient | undefined; label?: string }) {
  if (!value) return null;
  return (
    <View className="flex-1 items-center">
      <Text className="font-bold">
        {value.amount.toFixed(1)} {value.unit}
      </Text>
      <Text className="text-xs uppercase tracking-wider text-muted-foreground">
        {label || value.name}
      </Text>
    </View>
  );
}
