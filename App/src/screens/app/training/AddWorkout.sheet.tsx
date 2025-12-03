import { BottomSheet, BottomSheetContent } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
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

  const { createUserWorkout, editUserWorkout, deleteUserWorkout } = useStore();
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

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingSetIndex, setEditingSetIndex] = useState<number | undefined>(undefined);

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

  const toSafeIsoString = (dateStr?: string) => {
    try {
      return dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  };

  useEffect(() => {
    if (open) {
      if (workout) {
        setWorkoutName(workout.label?.[0] || '');
        setWorkoutNotes(workout.notes || '');
        const sortedSets = [...(workout.sets || [])].sort((a, b) => a.seqNumber - b.seqNumber);
        setWorkoutSets(sortedSets);
      } else {
        setWorkoutName('');
        setWorkoutNotes('');
        setWorkoutSets([]);
      }
      resetForm();
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

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingSetIndex(undefined);
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

  const loadSetIntoForm = (index: number) => {
    const set = workoutSets[index];
    const exercise = exercises.find((e) => e.id === set.exerciseId);

    setEditingSetIndex(index);
    setSelectedExercise(exercise);
    setExerciseWeight(set.weight);
    setExerciseWeightUnit(weightOptions.find((u) => String(u.id) === set.weightUnitId));
    setRepetitions(set.repetitions);
    setRir(set.rir);
    setRestTime(set.restTime);
    setNewExerciseNotes(set.notes);
    setSetStyle(setStyles.find((s) => String(s.id) === set.styleId));
    setSetType(setTypes.find((t) => String(t.id) === set.setTypeId));

    if (exercise) {
      setNewExerciseSearch(`${exercise.variant} ${exercise.type}`);
    }

    setIsFormOpen(true);
  };

  const handleSaveSet = () => {
    if (!selectedExercise || !repetitions) {
      toast(
        'Please select an exercise and repetitions',
        'destructive',
        1000,
        'top',
        false,
        'narrow',
      );
      return;
    }

    const setPayload: WorkoutSet = {
      id: editingSetIndex !== undefined ? workoutSets[editingSetIndex].id : '-',
      workoutId: workout?.id || '-',
      exerciseId: selectedExercise.id,
      seqNumber: editingSetIndex !== undefined ? editingSetIndex : workoutSets.length,
      weight: exerciseWeight,
      weightUnitId: exerciseWeightUnit ? String(exerciseWeightUnit.id) : undefined,
      repetitions: Math.floor(repetitions),
      rir,
      restTime: restTime,
      notes: newExerciseNotes,
      styleId: setStyle ? String(setStyle.id) : undefined,
      setTypeId: setType ? String(setType.id) : undefined,
    };

    if (editingSetIndex !== undefined) {
      setWorkoutSets((prev) => prev.map((s, i) => (i === editingSetIndex ? setPayload : s)));
    } else {
      setWorkoutSets((prev) => [...prev, setPayload]);
    }

    resetForm();
  };

  const handleDeleteSet = (index: number) => {
    Alert.alert('Delete Set', 'Are you sure you want to remove this set?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setWorkoutSets((prev) => {
            const newSets = prev.filter((_, i) => i !== index);
            return newSets.map((s, i) => ({ ...s, seqNumber: i }));
          });
          if (editingSetIndex === index) resetForm();
        },
      },
    ]);
  };

  const handleDeleteWorkout = () => {
    if (!workout?.id) return;

    Alert.alert('Delete Workout', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUserWorkout(workout.id);
            toast('Workout deleted', 'default', 1000, 'top', false, 'narrow');
            onOpenChange(false);
          } catch (e: any) {
            toast('Failed to delete workout', 'destructive', 1000, 'top', false, 'narrow');
          }
        },
      },
    ]);
  };

  const handleSaveWorkout = async (finish: boolean = false) => {
    if (!workoutName.trim()) {
      toast('Please input workout name', 'destructive', 2000, 'top', false, 'narrow');
      return;
    }

    const payload: FullWorkout = {
      id: workout?.id || '-',
      userId: user?.id || '',
      startDate: toSafeIsoString(workout?.startDate),
      endDate: finish ? new Date().toISOString() : undefined,
      label: [workoutName],
      notes: workoutNotes,
      sets: workoutSets.map((s, idx) => ({
        ...s,
        seqNumber: idx,
        workoutId: workout?.id || '-',
      })),
    };

    try {
      if (workout?.id) {
        await editUserWorkout(workout.id, payload);
        toast(
          finish ? 'Workout finished' : 'Workout saved',
          'default',
          1000,
          'top',
          false,
          'narrow',
        );
      } else {
        await createUserWorkout(payload);
        toast('Workout started', 'default', 1000, 'top', false, 'narrow');
      }
      onOpenChange(false);
    } catch (e: any) {
      console.error('Save error:', e);
      toast(
        `Failed to save: ${e?.message || 'Unknown error'}`,
        'destructive',
        1000,
        'top',
        false,
        'narrow',
      );
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent minHeightRatio={0.9}>
        <ScrollView>
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

          {isFormOpen ? (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>
                  {editingSetIndex !== undefined ? `Edit Set #${editingSetIndex + 1}` : 'New Set'}
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
                  onChange={setNewExerciseSearch}
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
                    onChangeText={(val) => setRepetitions(Math.floor(Number(val)))}
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
                    variants={setTypes.map((t) => ({ label: t.name, value: String(t.id) }))}
                    value={setType ? String(setType.id) : undefined}
                    onSelect={(val) => setSetType(setTypes.find((t) => String(t.id) === val.value))}
                  />
                  <Select
                    title="Set style"
                    className="flex-1"
                    variants={setStyles.map((s) => ({ label: s.name, value: String(s.id) }))}
                    value={setStyle ? String(setStyle.id) : undefined}
                    onSelect={(val) =>
                      setSetStyle(setStyles.find((s) => String(s.id) === val.value))
                    }
                  />
                </View>

                <Input
                  label="Exercise notes"
                  value={newExerciseNotes}
                  onChangeText={setNewExerciseNotes}
                />
              </CardContent>
              <CardFooter className="flex-row justify-end gap-2">
                <Button label="Cancel" variant="ghost" onPress={resetForm} />
                <Button
                  label={editingSetIndex !== undefined ? 'Update Set' : 'Add Set'}
                  onPress={handleSaveSet}
                />
              </CardFooter>
            </Card>
          ) : (
            <Button className="mb-4" label="+ Add New Set" onPress={() => setIsFormOpen(true)} />
          )}

          <View className="mb-6 gap-2">
            {workoutSets.length > 0 ? (
              workoutSets.map((s, idx) => {
                const ex = exercises.find((e) => e.id === s.exerciseId);
                const restTimeVal = parseRestTimeForDisplay(s.restTime);

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => loadSetIntoForm(idx)}
                    activeOpacity={0.7}
                  >
                    <Card>
                      <CardHeader className="flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base">
                          {ex ? `${ex.variant} ${ex.type}` : 'Unknown Exercise'}
                        </CardTitle>
                        <Text className="font-mono text-xs text-muted-foreground">#{idx + 1}</Text>
                      </CardHeader>
                      <CardContent className="gap-1 pb-2">
                        <View className="flex-row gap-4">
                          <Text className="font-semibold">{s.repetitions} reps</Text>
                          {s.weight && (
                            <Text>
                              @ {s.weight}{' '}
                              {s.weightUnitId
                                ? weightOptions.find((w) => String(w.id) === s.weightUnitId)?.name
                                : ''}
                            </Text>
                          )}
                          {s.rir !== undefined && (
                            <Text className="text-muted-foreground">RIR: {s.rir}</Text>
                          )}
                        </View>
                        {restTimeVal !== undefined && (
                          <Text className="text-xs text-muted-foreground">
                            Rest: {Time.formatDurationMs(restTimeVal * 1000, 'mm:ss')}
                          </Text>
                        )}
                        {s.notes && (
                          <Text className="mt-1 text-sm italic text-muted-foreground">
                            {s.notes}
                          </Text>
                        )}
                      </CardContent>
                      <CardFooter className="justify-end pb-2 pt-0">
                        <Button
                          label="Remove"
                          variant="ghost"
                          className="h-8 px-2 text-destructive"
                          labelClasses="text-destructive text-xs"
                          onPress={() => handleDeleteSet(idx)}
                        />
                      </CardFooter>
                    </Card>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text className="my-4 text-center text-muted-foreground">No sets added yet</Text>
            )}
          </View>

          <View className="mt-2 flex gap-3">
            <Button
              label={workout ? 'Save Changes' : 'Start Workout'}
              onPress={() => handleSaveWorkout(false)}
            />

            {workout && (
              <>
                {!workout.endDate && (
                  <Button
                    label="Finish Workout"
                    variant="secondary"
                    onPress={() => handleSaveWorkout(true)}
                  />
                )}

                <Button
                  label="Delete Workout"
                  variant="destructive"
                  className="mt-4"
                  onPress={handleDeleteWorkout}
                />
              </>
            )}
          </View>
          <View className="h-10" />
        </ScrollView>
      </BottomSheetContent>
    </BottomSheet>
  );
}
