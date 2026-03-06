import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View } from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import {
    Button,
    useThemeColor,
    Select,
    TextField,
    Input,
} from 'heroui-native';
import { Text, Muted } from '@/components/Text';
import { useWorkoutStore } from '@/contexts/useWorkoutStore';
import { useUserStore } from '@/contexts/useUserStore';
import { useWorkoutTimer } from './hooks/useWorkoutTimer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/types/types';
import { Check, X, Plus, Dumbbell } from 'lucide-react-native';
import AddExerciseSheet from './components/AddExercise.sheet';
import ExerciseGroupCard from './components/ExerciseGroupCard';
import { Exercise, WorkoutSet } from '@/types/workout.types';
import MainLayout from '@/layouts/Main.layout';
import { formatDate, formatTime } from '@/lib/dateTime';
import WorkoutSetRow from './components/WorkoutSetRow';

type Props = NativeStackScreenProps<AppStackParamList, 'ActiveWorkout'>;
export default function ActiveWorkoutScreen({ route, navigation }: Props) {
    const { workoutId } = route.params;
    const {
        userWorkouts,
        editUserWorkout,
        deleteUserWorkout,
        setStyles,
        setTypes,
        exercises: allExercises
    } = useWorkoutStore();
    const { weightUnits } = useUserStore();

    const accentColor = useThemeColor('accent');
    const dangerColor = useThemeColor('danger');
    const foregroundColor = useThemeColor('foreground');
    const mutedColor = useThemeColor('muted');

    const workout = useMemo(() =>
        userWorkouts.find(w => w.id === workoutId),
        [userWorkouts, workoutId]);

    const { formattedTime } = useWorkoutTimer(workout?.startDate || new Date().toISOString());

    const startDate = useMemo(() => {
        if (!workout?.startDate) return null;
        const d = new Date(workout.startDate);
        return `${formatDate(d)}  ${formatTime(d)}`;
    }, [workout?.startDate]);

    const [labelText, setLabelText] = useState(workout?.label?.[0] || '');
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    useEffect(() => {
        if (!isEditingLabel) setLabelText(workout?.label?.[0] || '');
    }, [workout?.label?.[0]]);

    const handleLabelBlur = useCallback(() => {
        setIsEditingLabel(false);
        if (!workout) return;
        const trimmed = labelText.trim();
        if (trimmed !== (workout.label?.[0] || '')) {
            editUserWorkout(workout.id, { ...workout, label: trimmed ? [trimmed] : undefined });
        }
    }, [labelText, workout, editUserWorkout]);

    type ExerciseGroup = { exerciseId: string; sets: WorkoutSet[] };

    const groupedSets = useMemo(() => {
        const groups: ExerciseGroup[] = [];
        if (!workout) return groups;

        const sortedSets = [...workout.sets].sort((a, b) => a.seqNumber - b.seqNumber);
        sortedSets.forEach(set => {
            const group = groups.find(g => g.exerciseId === set.exerciseId);
            if (group) group.sets.push(set);
            else groups.push({ exerciseId: set.exerciseId, sets: [set] });
        });
        return groups;
    }, [workout?.sets]);

    const [localGroups, setLocalGroups] = useState<ExerciseGroup[]>(groupedSets);
    const dragPendingRef = useRef(false);

    useEffect(() => {
        if (dragPendingRef.current) return;
        setLocalGroups(groupedSets);
    }, [groupedSets]);

    const handleAddExercise = async (exercise: Exercise) => {
        if (!workout) return;
        const newSet: WorkoutSet = {
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            workoutId: workout.id,
            exerciseId: exercise.id,
            seqNumber: workout.sets.length + 1,
            repetitions: 1,
            weight: 1,
            weightUnitId: weightUnits[0]?.id.toString() || "1",
        };
        await editUserWorkout(workout.id, { ...workout, sets: [...workout.sets, newSet] });
    };

    const handleAddSet = async (exerciseId: string) => {
        if (!workout) return;
        const exerciseSets = workout.sets.filter(s => s.exerciseId === exerciseId);
        const lastSet = exerciseSets[exerciseSets.length - 1];
        const newSet: WorkoutSet = {
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            workoutId: workout.id,
            exerciseId: exerciseId,
            seqNumber: workout.sets.length + 1,
            repetitions: lastSet?.repetitions || 1,
            weight: lastSet?.weight || 1,
            weightUnitId: lastSet?.weightUnitId || weightUnits[0]?.id.toString() || "1",
            styleId: lastSet?.styleId,
            setTypeId: lastSet?.setTypeId,
            restTime: lastSet?.restTime,
        };
        await editUserWorkout(workout.id, { ...workout, sets: [...workout.sets, newSet] });
    };

    const workoutRef = useRef(workout);
    useEffect(() => { workoutRef.current = workout; }, [workout]);
    const editUserWorkoutRef = useRef(editUserWorkout);
    useEffect(() => { editUserWorkoutRef.current = editUserWorkout; }, [editUserWorkout]);

    const handleDragEnd = useCallback(({ data }: { data: ExerciseGroup[] }) => {
        setLocalGroups(data);
        const w = workoutRef.current;
        if (!w) return;
        dragPendingRef.current = true;
        let seqCounter = 1;
        const reorderedSets: WorkoutSet[] = [];
        for (const group of data) {
            for (const set of group.sets) {
                reorderedSets.push({ ...set, seqNumber: seqCounter++ });
            }
        }
        editUserWorkoutRef.current(w.id, { ...w, sets: reorderedSets }).finally(() => {
            dragPendingRef.current = false;
        });
    }, []);

    const updateSet = useCallback(async (setId: string, updates: Partial<WorkoutSet>) => {
        const w = workoutRef.current;
        if (!w) return;
        const newSets = w.sets.map(s => s.id === setId ? { ...s, ...updates } : s);
        await editUserWorkoutRef.current(w.id, { ...w, sets: newSets });
    }, []);

    const deleteSet = useCallback(async (setId: string) => {
        const w = workoutRef.current;
        if (!w) return;
        const newSets = w.sets
            .filter(s => s.id !== setId)
            .map((s, i) => ({ ...s, seqNumber: i + 1 }));
        await editUserWorkoutRef.current(w.id, { ...w, sets: newSets });
    }, []);

    if (!workout) return null;

    return (
        <MainLayout scrollable={false}>
            <View className="flex-row justify-between items-center gap-2">
                <Input
                    value={labelText}
                    onChangeText={setLabelText}
                    onFocus={() => setIsEditingLabel(true)}
                    onBlur={handleLabelBlur}
                    placeholder="Active Workout"
                    className="flex-1 bg-background text-lg py-2"
                />
                <Button variant="danger-soft" size="sm" isIconOnly onPress={() => deleteUserWorkout(workout.id).then(() => navigation.goBack())}>
                    <X color={dangerColor} size={20} />
                </Button>
                <Button variant="primary" size="sm" onPress={() => navigation.navigate('Tabs', { screen: 'Training' })}>
                    <Check color={foregroundColor} size={20} />
                    <Button.Label>Finish</Button.Label>
                </Button>
            </View>

            <DraggableFlatList
                data={localGroups}
                keyExtractor={(item) => item.exerciseId}
                onDragEnd={handleDragEnd}
                showsVerticalScrollIndicator={false}
                contentContainerClassName='pb-32 gap-4'
                ListEmptyComponent={
                    <View className="py-20 items-center opacity-30">
                        <Dumbbell size={64} color={accentColor} />
                        <Text className="mt-4 text-lg font-bold">Your workout is empty</Text>
                    </View>
                }
                renderItem={({ item: group, drag }: RenderItemParams<ExerciseGroup>) => {
                    const exercise = allExercises.find(e => e.id === group.exerciseId);
                    const currentUnitId = group.sets[0]?.weightUnitId;
                    const currentUnit = weightUnits.find(u => String(u.id) === currentUnitId)?.name;
                    return (
                        <ScaleDecorator>
                            <ExerciseGroupCard
                                exercise={exercise}
                                drag={drag}
                                onAddSet={() => handleAddSet(group.exerciseId)}
                                columnHeader={
                                    <>
                                        <Muted>Set</Muted>
                                        <View>
                                            <Select
                                                value={currentUnitId && currentUnit ? { value: currentUnitId, label: currentUnit } : undefined}
                                                onValueChange={(opt) => {
                                                    const newUnitId = opt?.value === currentUnitId ? undefined : opt?.value;
                                                    const newSets = workout.sets.map(s => s.exerciseId === group.exerciseId ? { ...s, weightUnitId: newUnitId } : s);
                                                    editUserWorkout(workout.id, { ...workout, sets: newSets });
                                                }}
                                            >
                                                <Select.Trigger className='flex flex-row gap-1 justify-center' variant='unstyled'>
                                                    <Muted>{currentUnit ? `Weight (${currentUnit})` : 'Weight'}</Muted>
                                                    <Select.TriggerIndicator iconProps={{ color: mutedColor }} />
                                                </Select.Trigger>
                                                <Select.Portal>
                                                    <Select.Overlay />
                                                    <Select.Content presentation="popover" width="content-fit">
                                                        {weightUnits.map(u => (
                                                            <Select.Item key={u.id} value={String(u.id)} label={u.name}>
                                                                <Select.ItemDescription>{u.name}</Select.ItemDescription>
                                                                <Select.ItemIndicator className='hidden' />
                                                            </Select.Item>
                                                        ))}
                                                    </Select.Content>
                                                </Select.Portal>
                                            </Select>
                                        </View>
                                        <Muted>Reps</Muted>
                                        <Muted>RIR</Muted>
                                        <Muted>Rest</Muted>
                                        <View className="w-12" />
                                    </>
                                }
                            >
                                {group.sets.map((set, idx) => (
                                    <WorkoutSetRow
                                        key={set.id}
                                        set={set}
                                        setIndex={idx}
                                        onUpdate={updateSet}
                                        onDelete={deleteSet}
                                        setStyles={setStyles}
                                        setTypes={setTypes}
                                        accentColor={accentColor}
                                    />
                                ))}
                            </ExerciseGroupCard>
                        </ScaleDecorator>
                    );
                }}
            />

            <View className="absolute bottom-5 right-5 items-center px-4">
                <AddExerciseSheet
                    onSelectExercise={handleAddExercise}
                    trigger={
                        <Button variant="primary" size="lg" className="w-min rounded-2xl shadow-lg">
                            <Button.Label className="text-lg text-center">Add Exercise</Button.Label>
                            <Plus color={foregroundColor} size={24} />
                        </Button>
                    }
                />
            </View>
        </MainLayout>
    );
}

