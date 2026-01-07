import { View } from 'react-native';
import { useStore } from '@/contexts/useStore';
import { Select, SelectOption } from '@/components/ui/Select';
import React, { useMemo, useState } from 'react';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

// Activity Level
export interface LifestyleData {
  activityLevelId: number;
}

interface BodyStatsProps {
  onSubmit: (data: LifestyleData) => void;
}

export function Lifestyle({ onSubmit }: BodyStatsProps) {
  const { toast } = useToast();
  const { activityLevels } = useStore();
  const [selectedLevelId, setSelectedLevelId] = useState<string | undefined>();

  const activityVariants = useMemo<SelectOption[]>(
    () =>
      activityLevels.map((l) => ({
        label: l.name,
        value: String(l.id),
      })),
    [activityLevels],
  );

  const validateAndSubmit = () => {
    if (!selectedLevelId) {
      toast('Select an activity level', 'destructive', 1000, 'top', false, 'narrow');
      return;
    }
    onSubmit({
      activityLevelId: Number(selectedLevelId),
    });
  };

  return (
    <View className="flex gap-4">
      <Select
        title="How active are you"
        variants={activityVariants}
        value={selectedLevelId}
        onSelect={(val) => setSelectedLevelId(val.value)}
      />
      {selectedLevelId && (
        <Text>{activityLevels.find((l) => String(l.id) === selectedLevelId)?.description}</Text>
      )}
      <Button className="mt-auto" label="Next" variant="default" onPress={validateAndSubmit} />
    </View>
  );
}
