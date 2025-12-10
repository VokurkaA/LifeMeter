import React, { useState } from 'react';
import { View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export interface BodyStatsData {
  height: number;
  heightUnit: 'cm' | 'ft';
  weight: number;
  weightUnit: 'kg' | 'lbs';
}

interface BodyStatsProps {
  units: { lengthUnit: 'cm' | 'ft' | undefined; weightUnit: 'kg' | 'lbs' | undefined };
  onSubmit: (data: BodyStatsData) => void;
}

export function BodyStats({ units, onSubmit }: BodyStatsProps) {
  const { toast } = useToast();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>(units.lengthUnit || 'cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(units.weightUnit || 'kg');

  const validateAndSubmit = () => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (isNaN(heightNum) || isNaN(weightNum) || heightNum <= 0 || weightNum <= 0) {
      toast('Invalid input', 'destructive', 1000, 'top', false, 'narrow');
      return;
    }

    onSubmit({
      height: heightNum,
      heightUnit: heightUnit,
      weight: weightNum,
      weightUnit: weightUnit,
    });
  };

  return (
    <View className="flex gap-4">
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input
            label="Height"
            placeholder={heightUnit === 'cm' ? 'e.g. 175' : 'e.g. 5.9'}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
          />
        </View>
        <Select
          className="min-w-24"
          title="Unit"
          placeholder=""
          variants={[
            { label: 'cm', value: 'cm' },
            { label: 'ft', value: 'ft' },
          ]}
          value={heightUnit}
          onChange={(val) => setHeightUnit(val as 'cm' | 'ft')}
        />
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input
            label="Weight"
            placeholder={weightUnit === 'kg' ? 'e.g. 75' : 'e.g. 160'}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
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
      <Button className="mt-auto" label="Next" variant="default" onPress={validateAndSubmit} />
    </View>
  );
}
