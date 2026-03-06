import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View } from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import {
    Button,
    useThemeColor,
    Input,
} from 'heroui-native';
import { Text, Muted } from '@/components/Text';
import { useWorkoutStore } from '@/contexts/useWorkoutStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/types/types';
import { Check, X, Plus, Dumbbell } from 'lucide-react-native';
import AddExerciseSheet from './components/AddExercise.sheet';
import ExerciseGroupCard from './components/ExerciseGroupCard';
import TemplateSetRow from './components/TemplateSetRow';
import { Exercise, TemplateWorkoutSet, FullWorkoutTemplate } from '@/types/workout.types';
import MainLayout from '@/layouts/Main.layout';

type Props = NativeStackScreenProps<AppStackParamList, 'TemplateBuilder'>;
type ExerciseGroup = { exerciseId: string; sets: TemplateWorkoutSet[] };

export default function TemplateBuilderScreen({ route, navigation }: Props) {
    const { templateId } = route.params;
    const {
        userWorkoutTemplates,
        createUserWorkoutTemplate,
        editUserWorkoutTemplate,
        deleteUserWorkoutTemplate,
        setStyles,
        setTypes,
        exercises: allExercises,
    } = useWorkoutStore();

    const accentColor = useThemeColor('accent');
    const dangerColor = useThemeColor('danger');
    const foregroundColor = useThemeColor('foreground');

    const [template, setTemplate] = useState<FullWorkoutTemplate>(() => {
        const existing = userWorkoutTemplates.find(t => t.id === templateId);
        return existing || {
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            name: '',
            userId: '',
            sets: [],
        };
    });

    const groupedSets = useMemo(() => {
        const groups: ExerciseGroup[] = [];
        const sortedSets = [...template.sets].sort((a, b) => a.seqNumber - b.seqNumber);
        sortedSets.forEach(set => {
            const group = groups.find(g => g.exerciseId === set.exerciseId);
            if (group) group.sets.push(set);
            else groups.push({ exerciseId: set.exerciseId, sets: [set] });
        });
        return groups;
    }, [template.sets]);

    const [localGroups, setLocalGroups] = useState<ExerciseGroup[]>(groupedSets);
    const dragPendingRef = useRef(false);

    React.useEffect(() => {
        if (dragPendingRef.current) return;
        setLocalGroups(groupedSets);
    }, [groupedSets]);

    const handleSave = async () => {
        if (!template.name) return;
        if (templateId) {
            await editUserWorkoutTemplate(template.id, template);
        } else {
            await createUserWorkoutTemplate(template);
        }
        navigation.goBack();
    };

    const handleAddExercise = (exercise: Exercise) => {
        const newSet: TemplateWorkoutSet = {
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            workoutTemplateId: template.id,
            exerciseId: exercise.id,
            seqNumber: template.sets.length + 1,
            repetitions: 1,
        };
        setTemplate(t => ({ ...t, sets: [...t.sets, newSet] }));
    };

    const handleAddSet = (exerciseId: string) => {
        setTemplate(t => {
            const exerciseSets = t.sets.filter(s => s.exerciseId === exerciseId);
            const lastSet = exerciseSets[exerciseSets.length - 1];
            const newSet: TemplateWorkoutSet = {
                id: 'temp-' + Math.random().toString(36).substr(2, 9),
                workoutTemplateId: t.id,
                exerciseId,
                seqNumber: t.sets.length + 1,
                repetitions: lastSet?.repetitions || 1,
                rir: lastSet?.rir,
                styleId: lastSet?.styleId,
                setTypeId: lastSet?.setTypeId,
                restTime: lastSet?.restTime,
            };
            return { ...t, sets: [...t.sets, newSet] };
        });
    };

    const updateSet = useCallback((setId: string, updates: Partial<TemplateWorkoutSet>) => {
        setTemplate(t => ({
            ...t,
            sets: t.sets.map(s => s.id === setId ? { ...s, ...updates } : s),
        }));
    }, []);

    const deleteSet = useCallback((setId: string) => {
        setTemplate(t => ({
            ...t,
            sets: t.sets.filter(s => s.id !== setId),
        }));
    }, []);

    const handleDragEnd = useCallback(({ data }: { data: ExerciseGroup[] }) => {
        setLocalGroups(data);
        dragPendingRef.current = true;
        let seqCounter = 1;
        const reorderedSets: TemplateWorkoutSet[] = [];
        for (const group of data) {
            for (const set of group.sets) {
                reorderedSets.push({ ...set, seqNumber: seqCounter++ });
            }
        }
        setTemplate(t => ({ ...t, sets: reorderedSets }));
        dragPendingRef.current = false;
    }, []);

    return (
        <MainLayout scrollable={false}>
            <View className="flex-row justify-between items-center gap-2">
                <Input
                    value={template.name}
                    onChangeText={(name) => setTemplate(t => ({ ...t, name }))}
                    placeholder="Template Name"
                    className="flex-1 bg-background text-lg py-2"
                />
                <View className="flex-row gap-2">
                    {templateId && (
                        <Button variant="danger-soft" size="sm" isIconOnly onPress={() => deleteUserWorkoutTemplate(template.id).then(() => navigation.goBack())}>
                            <X color={dangerColor} size={20} />
                        </Button>
                    )}
                    <Button variant="primary" size="sm" onPress={handleSave} isDisabled={!template.name}>
                        <Check color={foregroundColor} size={20} />
                        <Button.Label>Save</Button.Label>
                    </Button>
                </View>
            </View>

            <DraggableFlatList
                data={localGroups}
                keyExtractor={(item) => item.exerciseId}
                onDragEnd={handleDragEnd}
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-32 gap-4"
                ListEmptyComponent={
                    <View className="py-20 items-center opacity-30">
                        <Dumbbell size={64} color={accentColor} />
                        <Text className="mt-4 text-lg font-bold">Add exercises to your template</Text>
                    </View>
                }
                renderItem={({ item: group, drag }: RenderItemParams<ExerciseGroup>) => {
                    const exercise = allExercises.find(e => e.id === group.exerciseId);
                    return (
                        <ScaleDecorator>
                            <ExerciseGroupCard
                                exercise={exercise}
                                drag={drag}
                                onAddSet={() => handleAddSet(group.exerciseId)}
                                columnHeader={
                                    <>
                                        <Muted>Set</Muted>
                                        <Muted className="flex-1 text-center">Reps</Muted>
                                        <Muted className="flex-1 text-center">RIR</Muted>
                                        <Muted className="flex-1 text-center">Rest</Muted>
                                        <View className="w-8" />
                                    </>
                                }
                            >
                                {group.sets.map((set, idx) => (
                                    <TemplateSetRow
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
