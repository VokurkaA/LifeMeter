import React from 'react';
import { View } from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { Button, useThemeColor, Select, Input } from 'heroui-native';
import { Text, Muted } from '@/components/Text';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/types/types';
import { Check, X, Plus, Dumbbell } from 'lucide-react-native';
import AddExerciseSheet from './components/sheets/AddExercise.sheet';
import ExerciseGroupCard from './components/shared/ExerciseGroupCard';
import WorkoutSetRow from './components/workout/WorkoutSetRow';
import { ExerciseGroup } from './hooks/useExerciseGroups';
import { useActiveWorkout } from './hooks/useActiveWorkout';
import { WorkoutSet } from '@/types/workout.types';
import MainLayout from '@/layouts/Main.layout';

type Props = NativeStackScreenProps<AppStackParamList, 'ActiveWorkout'>;

export default function ActiveWorkoutScreen({ route, navigation }: Props) {
    const { workoutId } = route.params;
    const {
        workout,
        weightUnits,
        exercises,
        setStyles,
        setTypes,
        labelText,
        setLabelText,
        isEditingLabel,
        setIsEditingLabel,
        handleLabelBlur,
        localGroups,
        handleDragEnd,
        handleAddExercise,
        handleAddSet,
        updateSet,
        deleteSet,
        editUserWorkout,
        deleteUserWorkout,
    } = useActiveWorkout(workoutId);

    const accentColor = useThemeColor('accent');
    const dangerColor = useThemeColor('danger');
    const foregroundColor = useThemeColor('foreground');
    const mutedColor = useThemeColor('muted');

    if (!workout) return null;

    return (
        <MainLayout scrollable={false}>
            <DraggableFlatList
                ListHeaderComponent={
                    <View className="flex-row justify-between items-center gap-2 mb-4">
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
                }
                data={localGroups}
                keyExtractor={(item) => item.exerciseId}
                onDragEnd={handleDragEnd}
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-12 gap-4"
                ListEmptyComponent={
                    <View className="py-20 items-center opacity-30">
                        <Dumbbell size={64} color={accentColor} />
                        <Text className="mt-4 text-lg font-bold">Your workout is empty</Text>
                    </View>
                }
                renderItem={({ item: group, drag }: RenderItemParams<ExerciseGroup<WorkoutSet>>) => {
                    const exercise = exercises.find(e => e.id === group.exerciseId);
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
                                                <Select.Trigger className="flex flex-row gap-1 justify-center" variant="unstyled">
                                                    <Muted>{currentUnit ? `Weight (${currentUnit})` : 'Weight'}</Muted>
                                                    <Select.TriggerIndicator iconProps={{ color: mutedColor }} />
                                                </Select.Trigger>
                                                <Select.Portal>
                                                    <Select.Overlay />
                                                    <Select.Content presentation="popover" width="content-fit">
                                                        {weightUnits.map(u => (
                                                            <Select.Item key={u.id} value={String(u.id)} label={u.name}>
                                                                <Select.ItemDescription>{u.name}</Select.ItemDescription>
                                                                <Select.ItemIndicator className="hidden" />
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
