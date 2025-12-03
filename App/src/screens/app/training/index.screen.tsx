import { H2, Text } from '@/components/ui/Text';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useStore } from '@/contexts/useStore';
import { Card, CardHeader } from '@/components/ui/Card';
import AddWorkoutSheet from './AddWorkout.sheet';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { FullWorkout } from '@/types/workout.types';

export default function TrainingScreen() {
  const { userWorkouts } = useStore();
  const ongoingWorkout = userWorkouts?.[0] && !userWorkouts[0].endDate ? userWorkouts[0] : null;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<FullWorkout | null>(null);

  const handleCreateWorkout = () => {
    setSelectedWorkout(null);
    setSheetOpen(true);
  };

  const handleEditWorkout = (workout: FullWorkout) => {
    setSelectedWorkout(workout);
    setSheetOpen(true);
  };

  return (
    <ScrollView className="flex flex-1 bg-background p-4">
      <AddWorkoutSheet open={sheetOpen} onOpenChange={setSheetOpen} workout={selectedWorkout} />

      <Button className="mb-4" label="Add a workout" onPress={handleCreateWorkout} />

      {ongoingWorkout && (
        <TouchableOpacity onPress={() => handleEditWorkout(ongoingWorkout)}>
          <Card>
            <CardHeader>
              <H2>Ongoing workout</H2>
              <Text>{ongoingWorkout.label?.[0] || 'Untitled Workout'}</Text>
            </CardHeader>
          </Card>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
