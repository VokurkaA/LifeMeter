import { H2, Text } from '@/components/ui/Text';
import { ScrollView } from 'react-native';
import { useStore } from '@/contexts/useStore';
import { Card, CardHeader } from '@/components/ui/Card';
import AddWorkoutSheet from './AddWorkout.sheet';

export default function TrainingScreen() {
  const { userWorkouts } = useStore();
  const ongoingWorkout = userWorkouts?.[0] && !userWorkouts[0].endDate ? userWorkouts[0] : null;

  return (
    <ScrollView className="flex flex-1 bg-background p-4">
      <AddWorkoutSheet />
      {ongoingWorkout && (
        <Card>
          <CardHeader>
            <H2>Ongoing workout</H2>
            <Text>{ongoingWorkout.label}</Text>
          </CardHeader>
        </Card>
      )}
    </ScrollView>
  );
}
