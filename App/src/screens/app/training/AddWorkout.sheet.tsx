import { BottomSheet, BottomSheetContent } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { ScrollView } from 'react-native-gesture-handler';
import {
  Exercise,
  FullWorkout,
  type SetStyle,
  SetType,
  WeightUnit,
  WorkoutSet,
} from '@/types/workout.types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { workoutService } from '@/services/workout.service';
import { Select, SelectOption } from '@/components/ui/Select';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/contexts/useStore';
import { useAuth } from '@/contexts/useAuth';
import { Time } from '@/lib/Time';
import { useToast } from '@/components/ui/Toast';

interface AddWorkoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout?: FullWorkout | null;
}

export default function AddWorkoutSheet({ open, onOpenChange, workout }: AddWorkoutSheetProps) {
  const parseRestTimeForDisplay = (val: string | undefined): number | undefined => {
    if (!val) return undefined;
    const num = parseFloat(val);
    return isNaN(num) ? undefined : num;
  };

  const { createUserWorkout, editUserWorkout } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [weightOptions, setWeightOptions] = useState<WeightUnit[]>([]);
  const [setStyles, setSetStyles] = useState<SetStyle[]>([]);
  const [setTypes, setSetTypes] = useState<SetType[]>([]);

  const [exerciseOptions, setExerciseOptions] = useState<SelectOption[]>([]);

  const [workoutName, setWorkoutName] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);

  const [isCreatingNewSet, setIsCreatingNewSet] = useState<boolean>(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | undefined>();
  const [exerciseWeight, setExerciseWeight] = useState<number | undefined>();
  const [exerciseWeightUnit, setExerciseWeightUnit] = useState<WeightUnit | undefined>();
  const [repetitions, setRepetitions] = useState<number | undefined>();
  const [rir, setRir] = useState<number | undefined>();
  const [restTime, setRestTime] = useState<string | undefined>();
  const [newExerciseNotes, setNewExerciseNotes] = useState<string | undefined>();
  const [setStyle, setSetStyle] = useState<SetStyle | undefined>();
  const [setType, setSetType] = useState<SetType | undefined>();

  const [newExerciseSearch, setNewExerciseSearch] = useState<string | undefined>();

  // Sync state when opening or when the passed workout changes
  useEffect(() => {
    if (open) {
      if (workout) {
        setWorkoutName(workout.label?.[0] || '');
        setWorkoutNotes(workout.notes || '');
        setWorkoutSets(workout.sets || []);
      } else {
        setWorkoutName('');
        setWorkoutNotes('');
        setWorkoutSets([]);
        resetNewExercise();
      }
    }
  }, [open, workout]);

  const filteredExerciseOptions = useMemo(() => {
    return newExerciseSearch
      ? exerciseOptions.filter((e) =>
          e.label.toUpperCase().includes(newExerciseSearch.toUpperCase()),
        )
      : exerciseOptions;
  }, [exerciseOptions, newExerciseSearch]);

  useEffect(() => {
    Promise.all([
      workoutService.getExercises(),
      workoutService.getWeightOptions(),
      workoutService.getSetStyles(),
      workoutService.getSetTypes(),
    ]).then(([ex, weight, styles, types]) => {
      setExercises(ex);
      setWeightOptions(weight);
      setSetStyles(styles);
      setSetTypes(types);

      setExerciseOptions(
        ex.map((e) => ({
          label: `${e.variant} ${e.type}`,
          value: e.id,
        })),
      );
    });
  }, []);

  const resetNewExercise = () => {
    setIsCreatingNewSet(false);
    setSelectedExercise(undefined);
    setExerciseWeight(undefined);
    setExerciseWeightUnit(undefined);
    setRepetitions(undefined);
    setRir(undefined);
    setRestTime(undefined);
    setNewExerciseNotes(undefined);
    setSetStyle(undefined);
    setSetType(undefined);
    setNewExerciseSearch(undefined);
  };

  const handleSave = async (finish: boolean = false) => {
    if (!workoutName.trim()) {
      toast('Please input workout name', 'destructive', 2000, 'top', false, 'narrow');
      return;
    }

    const payload: FullWorkout = {
      id: workout?.id || '-',
      userId: user?.id || '',
      startDate: workout?.startDate || new Date().toISOString(),
      endDate: finish ? new Date().toISOString() : undefined,
      label: [workoutName],
      notes: workoutNotes,
      sets: workoutSets.map((s) => ({
        ...s,
        id: s.id || '-',
        workoutId: workout?.id || '-',
        weightUnitId: s.weightUnitId ?? undefined,
        styleId: s.styleId ?? undefined,
        setTypeId: s.setTypeId ?? undefined,
      })),
    };

    try {
      if (workout?.id) {
        await editUserWorkout(workout.id, payload);
        toast(
          finish ? 'Workout finished' : 'Workout saved',
          'default',
          2000,
          'top',
          false,
          'narrow',
        );
      } else {
        await createUserWorkout(payload);
        toast('Workout started', 'default', 2000, 'top', false, 'narrow');
      }
      onOpenChange(false);
    } catch (e) {
      toast('Failed to save workout', 'destructive', 2000, 'top', false, 'narrow');
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent minHeightRatio={0.9}>
        <ScrollView className="">
          <Input
            className="mb-4"
            label="Workout name"
            placeholder="eg. leg day"
            value={workoutName}
            onChangeText={setWorkoutName}
          />
          <Input
            className="mb-4"
            label="Notes"
            placeholder=""
            value={workoutNotes}
            onChangeText={setWorkoutNotes}
          />
          {isCreatingNewSet ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedExercise
                    ? `New Exercise - ${selectedExercise.variant} ${selectedExercise.type}`
                    : 'Create a new exercise'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Select
                  withSearchbar
                  title="Select an exercise"
                  variants={filteredExerciseOptions}
                  onSelect={(val) => {
                    const exercise = exercises.find((e) => e.id === val.value);
                    setSelectedExercise(exercise);
                    exercise && setNewExerciseSearch(`${exercise.variant} ${exercise.type}`);
                  }}
                  value={newExerciseSearch}
                  onChange={(val) => {
                    setNewExerciseSearch(val);
                  }}
                />
                <View className="flex flex-row gap-2">
                  <Input
                    className="flex-1"
                    keyboardType="numeric"
                    label="Weight"
                    value={exerciseWeight ? String(exerciseWeight) : undefined}
                    onChangeText={(val) => setExerciseWeight(Number(val))}
                  />
                  <Select
                    className="flex-1"
                    title="Unit"
                    variants={weightOptions.map((o) => ({
                      label: o.name,
                      value: String(o.id),
                    }))}
                    value={exerciseWeightUnit ? String(exerciseWeightUnit.id) : undefined}
                    onSelect={(val) => {
                      setExerciseWeightUnit(weightOptions.find((o) => o.id === Number(val.value)));
                    }}
                  />
                </View>
                <View className="flex flex-row gap-2">
                  <Input
                    className="flex-1"
                    label="Repetitions"
                    keyboardType="numeric"
                    value={repetitions ? String(repetitions) : undefined}
                    onChangeText={(val) => setRepetitions(Number(val))}
                  />
                  <Input
                    className="flex-1"
                    label="RIR"
                    keyboardType="numeric"
                    value={rir ? String(rir) : undefined}
                    onChangeText={(val) => setRir(Number(val))}
                  />
                </View>
                <Input
                  label="Rest time (seconds)"
                  keyboardType="numeric"
                  value={restTime}
                  onChangeText={setRestTime}
                />
                <View className="flex flex-row gap-2">
                  <Select
                    className="flex-1"
                    title="Set type"
                    variants={setTypes.map((t) => ({
                      label: t.name,
                      value: String(t.id),
                    }))}
                    value={setType ? String(setType.id) : undefined}
                    onSelect={(val) => {
                      const selected = setTypes.find((t) => String(t.id) === val.value);
                      setSetType(selected);
                    }}
                  />

                  <Select
                    title="Set style"
                    className="flex-1"
                    variants={setStyles.map((s) => ({
                      label: s.name,
                      value: String(s.id),
                    }))}
                    value={setStyle ? String(setStyle.id) : undefined}
                    onSelect={(val) => {
                      const selected = setStyles.find((s) => String(s.id) === val.value);
                      setSetStyle(selected);
                    }}
                  />
                </View>
                <Input
                  label="Exercise notes"
                  value={newExerciseNotes}
                  onChangeText={setNewExerciseNotes}
                />
              </CardContent>
              <CardFooter>
                <Button label="Cancel" variant="destructive" onPress={() => resetNewExercise()} />
                <Button
                  label="Add Exercise"
                  onPress={() => {
                    if (!selectedExercise || !repetitions) return;

                    setWorkoutSets((val) => [
                      ...val,
                      {
                        id: '-',
                        workoutId: workout?.id || '-',
                        exerciseId: selectedExercise.id,
                        seqNumber: val.length,
                        weight: exerciseWeight,
                        weightUnitId: exerciseWeightUnit
                          ? String(exerciseWeightUnit.id)
                          : undefined,
                        repetitions,
                        rir,
                        restTime: restTime,
                        notes: newExerciseNotes,
                        styleId: setStyle ? String(setStyle.id) : undefined,
                        setTypeId: setType ? String(setType.id) : undefined,
                      },
                    ]);

                    resetNewExercise();
                  }}
                />
              </CardFooter>
            </Card>
          ) : (
            <Button
              className="mb-4"
              label="Add new set"
              onPress={() => setIsCreatingNewSet(true)}
            />
          )}
          {workoutSets.length > 0 ? (
            workoutSets.map((s, idx) => {
              const ex = exercises.find((e) => e.id === s.exerciseId);
              const restTimeVal = parseRestTimeForDisplay(s.restTime);

              return (
                <Card key={idx} className="mb-2">
                  <CardHeader>
                    <CardTitle>{ex ? `${ex.variant} ${ex.type}` : ''}</CardTitle>
                  </CardHeader>
                  <CardContent className="gap-1">
                    {s.weight && (
                      <Text>
                        Weight: {s.weight}{' '}
                        {s.weightUnitId
                          ? weightOptions.find((w) => String(w.id) === s.weightUnitId)?.name
                          : ''}
                      </Text>
                    )}
                    <Text>Reps: {s.repetitions}</Text>
                    {s.rir && <Text>RIR: {s.rir}</Text>}
                    {restTimeVal !== undefined && (
                      <Text>Rest: {Time.formatDurationMs(restTimeVal * 1000, 'mm:ss')}</Text>
                    )}
                    {s.notes && <Text>Notes: {s.notes}</Text>}
                  </CardContent>
                  <CardFooter>
                    <Text className="text-muted-foreground">set {s.seqNumber}</Text>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <Text className="my-4 text-center text-muted-foreground">No sets added</Text>
          )}

          <View className="mt-6 flex gap-2">
            <Button
              label={workout ? 'Save changes' : 'Start workout'}
              onPress={() => handleSave(false)}
            />
            {workout && (
              <Button
                label="Finish Workout"
                variant="destructive"
                onPress={() => handleSave(true)}
              />
            )}
          </View>
        </ScrollView>
      </BottomSheetContent>
    </BottomSheet>
  );
}
