import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Time } from '@/lib/Time';

export interface BasicInfoData {
  preferredUnit: 'metric' | 'imperial' | 'mixed';
  preferredLengthUnit: 'cm' | 'ft' | undefined;
  preferredWeightUnit: 'kg' | 'lbs' | undefined;
  sex: 'male' | 'female';
  birthDateIso: string;
}
type preferredUnitType = 'metric' | 'imperial' | 'mixed' | undefined;
type preferredLengthUnitType = 'cm' | 'ft' | undefined;
type preferredWeightUnitType = 'kg' | 'lbs' | undefined;
type userSexType = 'male' | 'female' | undefined;

export function BasicInfo({ onSubmit }: { onSubmit: (data: BasicInfoData) => void }) {
  const [preferredUnit, setPreferredUnit] = useState<preferredUnitType>();
  const [preferredLengthUnit, setPreferredLengthUnit] = useState<preferredLengthUnitType>();
  const [preferredWeightUnit, setPreferredWeightUnit] = useState<preferredWeightUnitType>();
  const [userSex, setUserSex] = useState<userSexType>();

  const [dobInput, setDobInput] = useState<string>('');

  const handleDateChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length > 4) {
      formatted = `${formatted.slice(0, 5)}/${cleaned.slice(4, 8)}`;
    }
    setDobInput(formatted);
  };

  const validateAndSubmit = () => {
    const parts = dobInput.split('/');
    let validTime: Time | null = null;

    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      const dateObj = new Date(year, month - 1, day);
      const timeInstance = Time.from(dateObj);

      if (
        timeInstance.isValid() &&
        dateObj.getDate() === day &&
        dateObj.getMonth() === month - 1 &&
        year > 1900 &&
        year <= new Date().getFullYear()
      ) {
        validTime = timeInstance;
      }
    }

    if (!validTime) {
      Alert.alert('Invalid Date', 'Please enter a valid date of birth (DD/MM/YYYY)');
      return;
    }

    if (!preferredUnit || !userSex) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }

    if (preferredUnit === 'mixed' && (!preferredLengthUnit || !preferredWeightUnit)) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }

    const formData: BasicInfoData = {
      preferredUnit,
      preferredLengthUnit: preferredLengthUnit || undefined,
      preferredWeightUnit: preferredWeightUnit || undefined,
      sex: userSex,
      birthDateIso: validTime.toISOString(),
    };

    onSubmit(formData);
  };

  return (
    <View>
      <View className="mt-8 flex-1">
        <Select
          title="Preferred unit"
          placeholder="Select your preferred unit type"
          variants={[
            { label: 'Metric (kg / cm)', value: 'metric' },
            { label: 'Imperial (lbs / ft)', value: 'imperial' },
            { label: 'Mixed', value: 'mixed' },
          ]}
          value={preferredUnit}
          onChange={(val) => {
            setPreferredUnit(val as preferredUnitType);
            if (val !== 'mixed') {
              setPreferredLengthUnit(undefined);
              setPreferredWeightUnit(undefined);
            }
          }}
        />

        {preferredUnit === 'mixed' && (
          <View className="mt-4 space-y-4">
            <Select
              title="Length unit"
              placeholder="Select length unit"
              variants={[
                { label: 'Centimeters (cm)', value: 'cm' },
                { label: 'Feet (ft)', value: 'ft' },
              ]}
              value={preferredLengthUnit}
              onChange={(val) => setPreferredLengthUnit(val as preferredLengthUnitType)}
            />

            <Select
              title="Weight unit"
              placeholder="Select weight unit"
              variants={[
                { label: 'Kilograms (kg)', value: 'kg' },
                { label: 'Pounds (lbs)', value: 'lbs' },
              ]}
              value={preferredWeightUnit}
              onChange={(val) => setPreferredWeightUnit(val as preferredWeightUnitType)}
            />
          </View>
        )}

        <Input
          label="Date of birth"
          placeholder="DD/MM/YYYY"
          value={dobInput}
          onChangeText={handleDateChange}
          keyboardType="numeric"
          maxLength={10}
        />

        <Select
          title="Sex"
          placeholder="Select your sex"
          variants={[
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
          ]}
          value={userSex}
          onChange={(val) => setUserSex(val as userSexType)}
        />
      </View>

      <Button className="mt-auto" label="Next" variant="link" onPress={validateAndSubmit} />
    </View>
  );
}
