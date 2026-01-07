import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Text } from '@/components/ui/Text';

export interface BodyStatsData {
  height: number;
  heightUnit: 'cm' | 'ft';
  weight: number;
  weightUnit: 'kg' | 'lbs';
  bodyFatPercentage?: number;
  leanTissuePercentage?: number;
  waterPercentage?: number;
  boneMassPercentage?: number;
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

  const [bodyFat, setBodyFat] = useState('');
  const [leanTissue, setLeanTissue] = useState('');
  const [water, setWater] = useState('');
  const [boneMass, setBoneMass] = useState('');

  const validateAndSubmit = () => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (isNaN(heightNum) || isNaN(weightNum) || heightNum <= 0 || weightNum <= 0) {
      toast('Please enter valid height and weight', 'destructive', 1000, 'top', false, 'narrow');
      return;
    }

    const parseOptional = (val: string) => {
      if (!val) return undefined;
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    };

    onSubmit({
      height: heightNum,
      heightUnit: heightUnit,
      weight: weightNum,
      weightUnit: weightUnit,
      bodyFatPercentage: parseOptional(bodyFat),
      leanTissuePercentage: parseOptional(leanTissue),
      waterPercentage: parseOptional(water),
      boneMassPercentage: parseOptional(boneMass),
    });
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="flex gap-4 pb-8">
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

        <View className="mt-4 gap-4 border-t border-border pt-4">
          <Text className="text-lg font-semibold text-foreground">Body Composition (Optional)</Text>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                label="Body Fat %"
                placeholder="e.g. 20"
                value={bodyFat}
                onChangeText={setBodyFat}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Input
                label="Lean Tissue %"
                placeholder="e.g. 75"
                value={leanTissue}
                onChangeText={setLeanTissue}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                label="Water %"
                placeholder="e.g. 60"
                value={water}
                onChangeText={setWater}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Input
                label="Bone Mass %"
                placeholder="e.g. 4"
                value={boneMass}
                onChangeText={setBoneMass}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <Button className="mt-4" label="Next" variant="default" onPress={validateAndSubmit} />
      </View>
    </ScrollView>
  );
}
