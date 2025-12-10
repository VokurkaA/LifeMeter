import { View } from 'react-native';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BodyStatsData } from '@/screens/onboarding/userInfo/BodyStats';
import { ActivityLevel } from '@/types/user.profile.types';

// Activity Level
export interface ObjectiveData {
  goalWeight: number;
}

interface BodyStatsProps {
  onSubmit: (data: ObjectiveData) => void;
  units: { weightUnit: 'kg' | 'lbs' | undefined };
  userSex: 'male' | 'female';
  userBirthDate: string;
  userBodyStats: BodyStatsData; // weight, weight unit, height, height unit
  userActivityLevel: ActivityLevel;
}

export function Objective({ onSubmit, units }: BodyStatsProps) {
  const { toast } = useToast();
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(units.weightUnit || 'kg');
  const [goalWeightBy, setGoalWeightBy] = useState<string | undefined>();

  const validateAndSubmit = () => {
    if (!goalWeight) {
      toast('Please enter a goal weight', 'destructive', 1000, 'top', false, 'narrow');
    }
  };

  const handleDateChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length > 4) {
      formatted = `${formatted.slice(0, 5)}/${cleaned.slice(4, 8)}`;
    }
    setGoalWeightBy(formatted);
  };

  const weightKg = (height: number, heightUnit: 'cm' | 'ft') => {

  };
  const baseMetabolicRate = (
    sex: 'male' | 'female',
    bodyStats: BodyStatsData,
    birthDate: string,
  ) => {};
  return (
    <View className="flex gap-4">
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input
            label="Target weight"
            keyboardType="numeric"
            placeholder="Target weight"
            value={goalWeight !== null ? String(goalWeight) : ''}
            onChangeText={(val) => {
              setGoalWeight(val ? Number(val) : null);
            }}
          />
        </View>
        <Select
          className="min-w-24"
          title="Unit"
          placeholder=""
          variants={[
            { label: 'kg', value: 'kg' },
            { label: 'lbs', value: 'lbs' },
          ]}
          value={weightUnit}
          onChange={(val) => setWeightUnit(val as 'kg' | 'lbs')}
        />
      </View>
      <Input
        label="Goal weight by"
        placeholder="DD/MM/YYYY"
        value={goalWeightBy}
        onChangeText={handleDateChange}
        keyboardType="numeric"
        maxLength={10}
      />
      <Button className="mt-auto" label="Next" variant="default" onPress={validateAndSubmit} />
    </View>
  );
}
