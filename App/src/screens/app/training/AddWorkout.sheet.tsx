import { BottomSheet, BottomSheetContent, BottomSheetTrigger } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { ScrollView } from 'react-native-gesture-handler';
import { Exercise, type SetStyle, SetType, WeightUnit, WorkoutSet } from '@/types/workout.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { workoutService } from '@/services/workout.service';
import { Select, SelectOption } from '@/components/ui/Select';
import { View } from 'react-native';

export default function AddWorkoutSheet() {
  const [open, setOpen] = useState(false);

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

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetTrigger asChild>
        <Button label="Add a workout" onPress={() => setOpen(true)} />
      </BottomSheetTrigger>
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
              <CardContent className="mt-4 flex flex-col gap-4">
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
                <Input
                  label="Repetitions"
                  keyboardType="numeric"
                  value={repetitions ? String(repetitions) : undefined}
                  onChangeText={(val) => setRepetitions(Number(val))}
                />
                <Input
                  label="RIR"
                  keyboardType="numeric"
                  value={rir ? String(rir) : undefined}
                  onChangeText={(val) => setRir(Number(val))}
                />
              </CardContent>
            </Card>
          ) : (
            <Button
              className="mb-4"
              label="Add new set"
              onPress={() => setIsCreatingNewSet(true)}
            />
          )}
          {workoutSets.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle>{}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </ScrollView>
      </BottomSheetContent>
    </BottomSheet>
  );
}
