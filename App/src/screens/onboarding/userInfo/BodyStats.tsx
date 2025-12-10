import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export interface BodyStatsData {
  height: number;
  heightUnit: 'cm' | 'ft';
  weight: number;
  weightUnit: 'kg' | 'lbs';
}

export function BodyStats({
  units,
  onSubmit,
}: {
  units: { lengthUnit: 'cm' | 'ft'; weightUnit: 'kg' | 'lbs' };
  onSubmit: (data: BodyStatsData) => void;
}) {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>(units.lengthUnit);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(units.weightUnit);

  const validateAndSubmit = () => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (isNaN(heightNum) || isNaN(weightNum) || heightNum <= 0 || weightNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid positive numbers.');
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
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <View className="mt-8 flex-1 space-y-6">
        <View className="z-20 flex-row items-end gap-3">
          <View className="flex-1">
            <Input
              label="Height"
              placeholder={heightUnit === 'cm' ? 'e.g. 175' : 'e.g. 5.9'}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />
          </View>
          <View className="w-1/3">
            <Select
              title=""
              placeholder=""
              variants={[
                { label: 'cm', value: 'cm' },
                { label: 'ft', value: 'ft' },
              ]}
              value={heightUnit}
              onChange={(val) => setHeightUnit(val as 'cm' | 'ft')}
            />
          </View>
        </View>

        <View className="z-10 flex-row items-end gap-3">
          <View className="flex-1">
            <Input
              label="Weight"
              placeholder={weightUnit === 'kg' ? 'e.g. 75' : 'e.g. 160'}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
          </View>
          <View className="w-1/3">
            <Select
              title=""
              placeholder=""
              variants={[
                { label: 'kg', value: 'kg' },
                { label: 'lbs', value: 'lbs' },
              ]}
              value={weightUnit}
              onChange={(val) => setWeightUnit(val as 'kg' | 'lbs')}
            />
          </View>
        </View>
      </View>
      <Button className="mt-auto" label="Next" variant="link" onPress={validateAndSubmit} />
    </KeyboardAvoidingView>
  );
}
