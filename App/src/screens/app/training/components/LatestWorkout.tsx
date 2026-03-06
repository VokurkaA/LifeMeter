import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, useThemeColor } from 'heroui-native';
import { Text } from '@/components/Text';
import { useWorkoutStore } from '@/contexts/useWorkoutStore';
import { formatTime, MONTHS } from '@/lib/dateTime';
import { FilePlus } from 'lucide-react-native';
import { navigate } from '@/navigation/navigate';

export default function LatestWorkout() {
  const { userWorkouts, userWorkoutTemplates, createUserWorkoutTemplate } = useWorkoutStore();
  const accentColor = useThemeColor('accent');

  const latestWorkout = useMemo(() => {
    const completedWorkouts = userWorkouts.filter(w => w.endDate).sort((a, b) => 
      new Date(b.endDate!).getTime() - new Date(a.endDate!).getTime()
    );
    return completedWorkouts[0];
  }, [userWorkouts]);

  if (!latestWorkout) return null;

  const template = userWorkoutTemplates.find(t => t.id === latestWorkout.workoutTemplateId);
  const startDate = new Date(latestWorkout.startDate);
  const endDate = new Date(latestWorkout.endDate!);

  const uniqueExercises = useMemo(() => {
    const ids = new Set(latestWorkout.sets.map(s => s.exerciseId));
    return ids.size;
  }, [latestWorkout.sets]);

  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  const handleSaveAsTemplate = async () => {
    const newTemplate = await createUserWorkoutTemplate({
      name: latestWorkout.label?.[0] || 'My Template',
      sets: latestWorkout.sets.map(s => ({
        exerciseId: s.exerciseId,
        seqNumber: s.seqNumber,
        repetitions: s.repetitions,
        rir: s.rir,
        restTime: s.restTime,
        notes: s.notes,
        styleId: s.styleId,
        setTypeId: s.setTypeId
      }))
    } as any);

    if (newTemplate) {
      navigate('TemplateBuilder', { templateId: newTemplate.id });
    }
  };

  return (
    <View className="gap-2 mb-6">
      <Text className="text-xl font-bold px-1">Latest Workout</Text>
      <Card className="p-4">
        <Card.Header className="flex-row justify-between items-start mb-2">
          <Card.Body>
            <Card.Title className="text-lg">{latestWorkout.label?.[0] || template?.name || 'Workout'}</Card.Title>
            <Card.Description>
              {MONTHS[startDate.getMonth()]} {startDate.getDate()}, {formatTime(startDate)} - {formatTime(endDate)}
            </Card.Description>
          </Card.Body>
          {template ? (
            <Chip size="sm" variant="soft" color="accent">
              {template.name}
            </Chip>
          ) : (
            <Button variant="tertiary" size="sm" isIconOnly onPress={handleSaveAsTemplate}>
              <FilePlus size={18} color={accentColor} />
            </Button>
          )}
        </Card.Header>
        
        <Card.Footer className="flex-row gap-6 mt-2">
          <View>
            <Text className="text-muted text-xs uppercase font-bold">Exercises</Text>
            <Text className="text-lg font-bold">{String(uniqueExercises)}</Text>
          </View>
          <View>
            <Text className="text-muted text-xs uppercase font-bold">Sets</Text>
            <Text className="text-lg font-bold">{String(latestWorkout.sets.length)}</Text>
          </View>
          <View>
             <Text className="text-muted text-xs uppercase font-bold">Duration</Text>
             <Text className="text-lg font-bold">{String(duration)}m</Text>
          </View>
        </Card.Footer>
      </Card>
    </View>
  );
}
