import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BasicUserInfoData } from './BasicUserInfo';

interface ObjectiveProps {
  units: BasicUserInfoData;
  onSubmit: (data: { targetWeight: number }) => void;
}

export function Objective({ units, onSubmit }: ObjectiveProps) {
  const [targetWeight, setTargetWeight] = useState('');

  const isImperialWeight =
    units.preferredUnit === 'imperial' || units.preferredWeightUnit === 'lbs';
  const weightLabel = isImperialWeight ? 'Target Weight (lbs)' : 'Target Weight (kg)';

  const validateAndSubmit = () => {
    const val = parseFloat(targetWeight);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid target weight.');
      return;
    }
    onSubmit({ targetWeight: val });
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <View className="mt-8 flex-1">
        <Input
          label={weightLabel}
          placeholder="e.g. 70"
          value={targetWeight}
          onChangeText={setTargetWeight}
          keyboardType="numeric"
        />
      </View>
      <Button className="mt-auto" label="Finish" onPress={validateAndSubmit} />
    </KeyboardAvoidingView>
  );
}
