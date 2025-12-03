import { H2, Text } from '@/components/ui/Text';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useStore } from '@/contexts/useStore';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import AddWorkoutSheet from './AddWorkout.sheet';
import { Button } from '@/components/ui/Button';
import { useMemo, useState } from 'react';
import { FullWorkout } from '@/types/workout.types';
import { Time } from '@/lib/Time';

export default function TrainingScreen() {
  const { userWorkouts } = useStore();

  const { ongoing, history } = useMemo(() => {
    if (!userWorkouts) return { ongoing: null, history: [] };

    const ongoing = userWorkouts.find((w) => !w.endDate);
    const history = userWorkouts
      .filter((w) => w.endDate)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return { ongoing, history };
  }, [userWorkouts]);

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

  // Helper to count unique exercises
  const getUniqueExercisesCount = (workout: FullWorkout) => {
    const ids = new Set(workout.sets.map((s) => s.exerciseId));
    return ids.size;
  };

  return (
    <View className="flex-1 bg-background">
      <AddWorkoutSheet open={sheetOpen} onOpenChange={setSheetOpen} workout={selectedWorkout} />

      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Button label="Start New Workout" onPress={handleCreateWorkout} />
        </View>

        {ongoing && (
          <View className="mb-8">
            <H2 className="mb-3 text-primary">Active Session</H2>
            <TouchableOpacity onPress={() => handleEditWorkout(ongoing)} activeOpacity={0.8}>
              <Card className="border-2 border-primary bg-primary/5">
                <CardHeader className="pb-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xl font-bold">
                      {ongoing.label?.[0] || 'Current Workout'}
                    </Text>
                    <Text className="animate-pulse font-bold text-primary">LIVE</Text>
                  </View>
                </CardHeader>
                <CardContent>
                  <Text className="mb-2 text-muted-foreground">
                    Started {Time.relative(ongoing.startDate)}
                  </Text>
                  <View className="flex-row gap-4">
                    <Text className="font-medium">{ongoing.sets.length} sets completed</Text>
                    <Text className="font-medium text-muted-foreground">|</Text>
                    <Text className="font-medium">
                      {getUniqueExercisesCount(ongoing)} exercises
                    </Text>
                  </View>
                  {ongoing.notes ? (
                    <Text className="mt-3 text-sm italic text-muted-foreground" numberOfLines={1}>
                      {ongoing.notes}
                    </Text>
                  ) : null}
                </CardContent>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        <H2 className="mb-3">History</H2>
        {history.length === 0 ? (
          <View className="items-center justify-center rounded-lg bg-secondary/30 py-10">
            <Text className="text-muted-foreground">No completed workouts yet.</Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              Start a new workout to track your progress!
            </Text>
          </View>
        ) : (
          <View className="gap-3 pb-10">
            {history.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                onPress={() => handleEditWorkout(workout)}
                activeOpacity={0.7}
              >
                <Card>
                  <CardHeader className="pb-1">
                    <View className="flex-row items-start justify-between">
                      <Text className="mr-2 flex-1 text-lg font-semibold">
                        {workout.label?.[0] || 'Untitled Workout'}
                      </Text>
                      <Text className="mt-1 text-xs text-muted-foreground">
                        {Time.format(workout.startDate, 'MMM D')}
                      </Text>
                    </View>
                  </CardHeader>
                  <CardContent>
                    <Text className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                      {Time.format(workout.startDate, 'h:mm A')} -{' '}
                      {workout.endDate ? Time.format(workout.endDate, 'h:mm A') : '...'}
                    </Text>
                    <View className="flex-row gap-2">
                      <Text className="rounded bg-secondary px-2 py-0.5 text-sm text-foreground">
                        {workout.sets.length} Sets
                      </Text>
                      <Text className="rounded bg-secondary px-2 py-0.5 text-sm text-foreground">
                        {getUniqueExercisesCount(workout)} Exercises
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
