import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { 
    Button, 
    Card, 
    useThemeColor, 
    useToast, 
    PressableFeedback, 
    Input,
    Select,
    Separator,
    Popover,
    TextField,
    Label
} from 'heroui-native';
import { Text } from '@/components/Text';
import { useWorkoutStore } from '@/contexts/useWorkoutStore';
import { useUserStore } from '@/contexts/useUserStore';
import { useWorkoutTimer } from './hooks/useWorkoutTimer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/types/types';
import { Check, X, Plus, Trash2, Dumbbell, MoreVertical, MessageSquare, Timer } from 'lucide-react-native';
import AddExerciseSheet from './components/AddExercise.sheet';
import { Exercise, SetStyle, SetType, WorkoutSet } from '@/types/workout.types';
import MainLayout from '@/layouts/Main.layout';

type Props = NativeStackScreenProps<AppStackParamList, 'ActiveWorkout'>;

const WorkoutSetRow = React.memo(({ 
    set, 
    onUpdate, 
    onDelete, 
    setStyles, 
    setTypes, 
    accentColor, 
    getSetTypeLabel 
}: {
    set: WorkoutSet;
    onUpdate: (setId: string, updates: Partial<WorkoutSet>) => void;
    onDelete: (setId: string) => void;
    setStyles: SetStyle[];
    setTypes: SetType[];
    accentColor: string;
    getSetTypeLabel: (typeId?: string) => string | null;
}) => {
    const [localWeight, setLocalWeight] = useState(String(set.weight || ''));
    const [localReps, setLocalReps] = useState(String(set.repetitions || ''));
    const [localRir, setLocalRir] = useState(String(set.rir ?? ''));
    const [localRest, setLocalRest] = useState(set.restTime || '');

    useEffect(() => {
        setLocalWeight(String(set.weight || ''));
    }, [set.weight]);

    useEffect(() => {
        setLocalReps(String(set.repetitions || ''));
    }, [set.repetitions]);

    useEffect(() => {
        setLocalRir(String(set.rir ?? ''));
    }, [set.rir]);

    useEffect(() => {
        setLocalRest(set.restTime || '');
    }, [set.restTime]);

    const handleWeightBlur = () => {
        const val = parseFloat(localWeight) || 0;
        if (val !== set.weight) onUpdate(set.id, { weight: val });
    };

    const handleRepsBlur = () => {
        const val = parseInt(localReps) || 0;
        if (val !== set.repetitions) onUpdate(set.id, { repetitions: val });
    };

    const handleRirBlur = () => {
        const val = parseInt(localRir) || 0;
        if (val !== set.rir) onUpdate(set.id, { rir: val });
    };

    const handleRestBlur = () => {
        if (localRest !== set.restTime) onUpdate(set.id, { restTime: localRest || undefined });
    };

    const typeLabel = getSetTypeLabel(set.setTypeId);

    return (
        <View className="flex-row items-center px-4 py-3 border-b border-border/20">
            <Popover>
                <Popover.Trigger asChild>
                    <PressableFeedback className="w-10 h-10 items-center justify-center -ml-2">
                        <View className="items-center">
                            <View className={`w-7 h-7 rounded-full items-center justify-center border ${typeLabel ? 'border-accent bg-accent/10' : 'border-border'}`}>
                                <Text className={`text-xs font-bold ${typeLabel ? 'text-accent' : 'text-foreground'}`}>
                                    {typeLabel || set.seqNumber}
                                </Text>
                            </View>
                            {set.notes && (
                                <View className="absolute -top-1 -right-1">
                                    <MessageSquare size={10} color={accentColor} fill={accentColor} />
                                </View>
                            )}
                        </View>
                    </PressableFeedback>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Overlay />
                    <Popover.Content presentation="popover" className="p-4 gap-4 w-72">
                        <View>
                            <Text className="text-xs font-bold text-muted uppercase mb-2">Set Settings (Set {set.seqNumber})</Text>
                            <Separator className="mb-4" />
                            
                            <Text className="text-xs font-bold text-muted uppercase mb-2">Type</Text>
                            <View className="flex-row flex-wrap gap-2 mb-4">
                                <Button 
                                    variant={!set.setTypeId ? "primary" : "secondary"} 
                                    size="sm" 
                                    onPress={() => onUpdate(set.id, { setTypeId: undefined })}
                                >
                                    <Button.Label>Normal</Button.Label>
                                </Button>
                                {setTypes.map(t => (
                                    <Button 
                                        key={t.id}
                                        variant={set.setTypeId === t.id ? "primary" : "secondary"}
                                        size="sm"
                                        onPress={() => onUpdate(set.id, { setTypeId: t.id })}
                                    >
                                        <Button.Label>{t.name}</Button.Label>
                                    </Button>
                                ))}
                            </View>

                            <Text className="text-xs font-bold text-muted uppercase mb-2">Style</Text>
                            <View className="flex-row flex-wrap gap-2 mb-4">
                                <Button 
                                    variant={!set.styleId ? "primary" : "secondary"} 
                                    size="sm" 
                                    onPress={() => onUpdate(set.id, { styleId: undefined })}
                                >
                                    <Button.Label>Normal</Button.Label>
                                </Button>
                                {setStyles.map(s => (
                                    <Button 
                                        key={s.id}
                                        variant={set.styleId === s.id ? "primary" : "secondary"}
                                        size="sm"
                                        onPress={() => onUpdate(set.id, { styleId: s.id })}
                                    >
                                        <Button.Label>{s.name}</Button.Label>
                                    </Button>
                                ))}
                            </View>

                            <TextField>
                                <Label>Notes</Label>
                                <Input 
                                    placeholder="Add set notes..." 
                                    value={set.notes || ''}
                                    onChangeText={(val) => onUpdate(set.id, { notes: val || undefined })}
                                    multiline
                                />
                            </TextField>
                        </View>
                    </Popover.Content>
                </Popover.Portal>
            </Popover>

            <View className="flex-1 px-0.5">
                <Input
                    variant="secondary"
                    className="text-center font-bold h-10 px-0"
                    keyboardType="numeric"
                    value={localWeight}
                    onChangeText={setLocalWeight}
                    onBlur={handleWeightBlur}
                />
            </View>

            <View className="flex-1 px-0.5">
                <Input
                    variant="secondary"
                    className="text-center font-bold h-10 px-0"
                    keyboardType="numeric"
                    value={localReps}
                    onChangeText={setLocalReps}
                    onBlur={handleRepsBlur}
                />
            </View>

            <View className="flex-1 px-0.5">
                <Input
                    variant="secondary"
                    className="text-center font-bold h-10 px-0"
                    keyboardType="numeric"
                    value={localRir}
                    onChangeText={setLocalRir}
                    onBlur={handleRirBlur}
                />
            </View>

            <View className="flex-1 px-0.5">
                <Input
                    variant="secondary"
                    className="text-center font-bold h-10 px-0"
                    keyboardType="numeric"
                    value={localRest}
                    onChangeText={setLocalRest}
                    onBlur={handleRestBlur}
                    placeholder="00:00"
                />
            </View>

            <View className="w-8 flex-row justify-end items-center">
                <PressableFeedback onPress={() => onDelete(set.id)}>
                    <Trash2 size={18} color="#ef4444" />
                </PressableFeedback>
            </View>
        </View>
    );
});

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

    const workout = useMemo(() => 
        userWorkouts.find(w => w.id === workoutId),
    [userWorkouts, workoutId]);

    const { formattedTime } = useWorkoutTimer(workout?.startDate || new Date().toISOString());

    const groupedSets = useMemo(() => {
        const groups: { exerciseId: string; sets: WorkoutSet[] }[] = [];
        if (!workout) return groups;

        const sortedSets = [...workout.sets].sort((a, b) => a.seqNumber - b.seqNumber);
        
        sortedSets.forEach(set => {
            const group = groups.find(g => g.exerciseId === set.exerciseId);
            if (group) {
                group.sets.push(set);
            } else {
                groups.push({ exerciseId: set.exerciseId, sets: [set] });
            }
        });
        return groups;
    }, [workout?.sets]);

    if (!workout) return null;

    const handleAddExercise = async (exercise: Exercise) => {
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

    const updateSet = useCallback(async (setId: string, updates: Partial<WorkoutSet>) => {
        if (!workout) return;
        const newSets = workout.sets.map(s => s.id === setId ? { ...s, ...updates } : s);
        await editUserWorkout(workout.id, { ...workout, sets: newSets });
    }, [workout, editUserWorkout]);

    const deleteSet = useCallback(async (setId: string) => {
        if (!workout) return;
        const newSets = workout.sets.filter(s => s.id !== setId);
        await editUserWorkout(workout.id, { ...workout, sets: newSets });
    }, [workout, editUserWorkout]);

    const updateGroupUnit = async (exerciseId: string, unitId: string) => {
        const newSets = workout.sets.map(s => s.exerciseId === exerciseId ? { ...s, weightUnitId: unitId } : s);
        await editUserWorkout(workout.id, { ...workout, sets: newSets });
    };

    const getSetTypeLabel = useCallback((typeId?: string) => {
        if (!typeId) return null;
        const type = setTypes.find(t => t.id === typeId);
        return type?.name?.charAt(0).toUpperCase() || null;
    }, [setTypes]);

    return (
        <MainLayout>
            <View className="flex-row justify-between items-start mb-6">
                <View>
                    <Text className="text-3xl font-bold">{workout.label?.[0] || 'Active Workout'}</Text>
                    <Text className="text-primary font-mono">{formattedTime}</Text>
                </View>
                <View className="flex-row gap-2">
                    <Button variant="tertiary" size="sm" isIconOnly onPress={() => deleteUserWorkout(workout.id).then(() => navigation.goBack())}>
                        <X color="#ef4444" size={20} />
                    </Button>
                    <Button variant="primary" size="sm" onPress={() => navigation.navigate('Tabs', { screen: 'Training' })}>
                        <Check color="white" size={20} />
                        <Button.Label>Finish</Button.Label>
                    </Button>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="gap-6 pb-32">
                    {groupedSets.map((group) => {
                        const exercise = allExercises.find(e => e.id === group.exerciseId);
                        const currentUnitId = group.sets[0]?.weightUnitId || "1";
                        const currentUnit = weightUnits.find(u => String(u.id) === currentUnitId)?.name || 'kg';

                        return (
                            <View key={group.exerciseId} className="gap-3">
                                <View className="flex-row justify-between items-end px-1">
                                    <View className="flex-1">
                                        <Text className="text-xl font-bold capitalize">{exercise?.variant || 'Exercise'}</Text>
                                        <Text className="text-muted text-xs capitalize">{exercise?.type}</Text>
                                    </View>
                                    <Select
                                        value={{ value: currentUnitId, label: currentUnit }}
                                        onValueChange={(opt) => updateGroupUnit(group.exerciseId, opt?.value || "1")}
                                    >
                                        <Select.Trigger className="h-8 border-none bg-surface/50 rounded-lg px-2">
                                            <Select.Value className="text-xs font-bold" placeholder="Unit" />
                                        </Select.Trigger>
                                        <Select.Portal>
                                            <Select.Overlay />
                                            <Select.Content presentation="popover" width="trigger">
                                                {weightUnits.map(u => (
                                                    <Select.Item key={u.id} value={String(u.id)} label={u.name} />
                                                ))}
                                            </Select.Content>
                                        </Select.Portal>
                                    </Select>
                                </View>

                                <Card variant="transparent" className="border border-border p-0 overflow-hidden">
                                    <View className="flex-row px-4 py-2 bg-surface/30 border-b border-border">
                                        <Text className="w-10 text-[10px] font-bold text-muted uppercase">Set</Text>
                                        <Text className="flex-1 text-[10px] font-bold text-muted uppercase text-center">Weight ({currentUnit})</Text>
                                        <Text className="flex-1 text-[10px] font-bold text-muted uppercase text-center">Reps</Text>
                                        <Text className="flex-1 text-[10px] font-bold text-muted uppercase text-center">RIR</Text>
                                        <Text className="flex-1 text-[10px] font-bold text-muted uppercase text-center">Rest</Text>
                                        <View className="w-8" />
                                    </View>

                                    {group.sets.map((set) => (
                                        <WorkoutSetRow
                                            key={set.id}
                                            set={set}
                                            onUpdate={updateSet}
                                            onDelete={deleteSet}
                                            setStyles={setStyles}
                                            setTypes={setTypes}
                                            accentColor={accentColor}
                                            getSetTypeLabel={getSetTypeLabel}
                                        />
                                    ))}

                                    <PressableFeedback 
                                        className="p-3 items-center bg-surface/10"
                                        onPress={() => handleAddSet(group.exerciseId)}
                                    >
                                        <View className="flex-row items-center gap-2">
                                            <Plus size={16} color={accentColor} />
                                            <Text className="text-accent font-bold">Add Set</Text>
                                        </View>
                                    </PressableFeedback>
                                </Card>
                            </View>
                        );
                    })}

                    {workout.sets.length === 0 && (
                        <View className="py-20 items-center opacity-30">
                            <Dumbbell size={64} color={accentColor} />
                            <Text className="mt-4 text-lg font-bold">Your workout is empty</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View className="absolute bottom-6 left-0 right-0 items-center">
                <AddExerciseSheet 
                    onSelectExercise={handleAddExercise}
                    trigger={
                        <Button variant="primary" size="lg" className="px-8 rounded-full shadow-lg">
                            <Plus color="white" size={24} />
                            <Button.Label className="text-lg">Add Exercise</Button.Label>
                        </Button>
                    }
                />
            </View>
        </MainLayout>
    );
}
