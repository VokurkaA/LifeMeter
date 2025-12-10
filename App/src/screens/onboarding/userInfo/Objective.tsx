import { View } from 'react-native';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BodyStatsData } from '@/screens/onboarding/userInfo/BodyStats';
import { useStore } from '@/contexts/useStore';
import { calculateAge } from '@/lib/utils';
import mifflinStJeor from '@/lib/bmr';

// Activity Level
export interface ObjectiveData {
  goalWeight: number;
  calculatedBmr: number;
}

interface BodyStatsProps {
  onSubmit: (data: ObjectiveData) => void;
  units: { weightUnit: 'kg' | 'lbs' | undefined };
  userSex: 'male' | 'female';
  userBirthDate: string;
  userBodyStats: BodyStatsData;
  userActivityLevelId: number;
}

export function Objective({
  onSubmit,
  units,
  userSex,
  userBirthDate,
  userBodyStats,
  userActivityLevelId,
}: BodyStatsProps) {
  const { toast } = useToast();
  const { weightUnits, lengthUnits } = useStore();
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(units.weightUnit || 'kg');
  const [goalWeightBy, setGoalWeightBy] = useState<string | undefined>();

  const baseMetabolicRate = (
    sex: 'male' | 'female',
    bodyStats: BodyStatsData,
    birthDate: string,
    weightUnits: { name: string; kgConversionFactor: number }[],
    lengthUnits: { name: string; meterConversionFactor: number }[],
  ) => {
    const age = calculateAge(birthDate);

    const weightUnitEntry = weightUnits.find(
      (u) => u.name.toLowerCase() === bodyStats.weightUnit.toLowerCase(),
    );
    const heightUnitEntry = lengthUnits.find(
      (u) => u.name.toLowerCase() === bodyStats.heightUnit.toLowerCase(),
    );

    const weightKg = bodyStats.weight * weightUnitEntry!.kgConversionFactor;
    const heightCm = bodyStats.height * heightUnitEntry!.meterConversionFactor * 100;

    return Math.round(mifflinStJeor(sex, weightKg, heightCm, age));
  };

  const validateAndSubmit = () => {
    if (!goalWeight) {
      toast('Please enter a goal weight', 'destructive', 1000, 'top', false, 'narrow');
      return;
    }

    const bmr = baseMetabolicRate(userSex, userBodyStats, userBirthDate, weightUnits, lengthUnits);

    onSubmit({
      goalWeight: goalWeight,
      calculatedBmr: bmr,
    });
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
