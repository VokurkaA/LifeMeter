import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useStore } from '@/contexts/useStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import { Time } from '@/lib/Time';

export default function AddFromExistingUserMeal({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { userMeals, createUserMeal } = useStore();
  const { toast } = useToast();

  const [selectedMealId, setSelectedMealId] = useState<string>('');
  const [name, setName] = useState('');
  const [eatenAt, setEatenAt] = useState(Time.now().toISOString());

  const mealOptions = useMemo(() => {
    const uniqueMap = new Map();
    const sorted = [...userMeals].sort((a, b) =>
      b.userMeal.eaten_at.localeCompare(a.userMeal.eaten_at),
    );

    sorted.forEach((m) => {
      const mealName = m.userMeal.name.trim();
      if (!mealName) return;
      if (!uniqueMap.has(mealName)) {
        uniqueMap.set(mealName, {
          label: mealName,
          value: m.userMeal.id,
        });
      }
    });

    return Array.from(uniqueMap.values());
  }, [userMeals]);

  const handleSelect = (option: { label: string; value: string }) => {
    setSelectedMealId(option.value);
    setName(option.label);
  };

  const handleAdd = async () => {
    if (!selectedMealId) return;

    const sourceMeal = userMeals.find((m) => m.userMeal.id === selectedMealId);
    if (!sourceMeal) return;

    await createUserMeal({
      name: name,
      eaten_at: eatenAt,
      items: sourceMeal.userFoods.map((f) => ({
        food_id: f.food_id,
        total_grams: f.total_grams,
        quantity: f.quantity,
        portion_id: f.portion_id || null,
        description: f.description || null,
      })),
    });

    toast('Meal added from history', 'success');
    setOpen(false);
  };

  return (
    <View className="gap-4 pt-4">
      <Select
        title="Select a past meal"
        placeholder="Search history..."
        withSearchbar
        variants={mealOptions}
        value={selectedMealId}
        onSelect={handleSelect}
      />

      {selectedMealId ? (
        <>
          <Input label="Meal name" value={name} onChangeText={setName} />
          <Input
            label="Eaten at"
            value={Time.format(eatenAt, 'YYYY-MM-DD HH:mm')}
            onChangeText={(val) => {
              const parsed = Time.from(val.replace(' ', 'T'), { assumeUTC: true });
              if (parsed.isValid()) {
                setEatenAt(parsed.toISOString());
              }
            }}
          />
          <Button label="Track Meal" onPress={handleAdd} />
        </>
      ) : (
        <Text className="mt-4 text-center text-muted-foreground">
          Select a meal from the dropdown above to copy its items.
        </Text>
      )}
    </View>
  );
}
