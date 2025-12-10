import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export function Lifestyle({ onSubmit }: { onSubmit: (data: { activityFactor: number }) => void }) {
  const [activityFactor, setActivityFactor] = useState<number | undefined>();

  const activityLevels = [
    { label: 'Sedentary (Little or no exercise)', value: 1.2 },
    { label: 'Lightly Active (1-3 days/week)', value: 1.375 },
    { label: 'Moderately Active (3-5 days/week)', value: 1.55 },
    { label: 'Very Active (6-7 days/week)', value: 1.725 },
    { label: 'Extra Active (Physical job)', value: 1.9 },
  ];

  const validateAndSubmit = () => {
    if (!activityFactor) {
      Alert.alert('Selection Required', 'Please select an activity level.');
      return;
    }
    onSubmit({ activityFactor });
  };

  return (
    <View className="mt-8 flex-1">
      <View className="flex-1">
        <Select
          title="Activity Level"
          placeholder="Select your activity level"
          variants={activityLevels}
          value={activityFactor}
          onChange={(val) => setActivityFactor(val as number)}
        />
      </View>
      <Button className="mt-auto" label="Next" variant="link" onPress={validateAndSubmit} />
    </View>
  );
}
