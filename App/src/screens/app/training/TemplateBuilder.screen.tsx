import React from 'react';
import { View } from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { Button, useThemeColor, Input } from 'heroui-native';
import { Text, Muted } from '@/components/Text';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/types/types';
import { Check, X, Plus, Dumbbell } from 'lucide-react-native';
import AddExerciseSheet from './components/sheets/AddExercise.sheet';
import ExerciseGroupCard from './components/shared/ExerciseGroupCard';
import TemplateSetRow from './components/template/TemplateSetRow';
import { ExerciseGroup } from './hooks/useExerciseGroups';
import { useTemplateBuilder } from './hooks/useTemplateBuilder';
import { TemplateWorkoutSet } from '@/types/workout.types';
import MainLayout from '@/layouts/Main.layout';

type Props = NativeStackScreenProps<AppStackParamList, 'TemplateBuilder'>;

export default function TemplateBuilderScreen({ route, navigation }: Props) {
    const { templateId } = route.params;
    const {
        template,
        setTemplate,
        exercises,
        setStyles,
        setTypes,
        localGroups,
        handleDragEnd,
        handleSave,
        handleAddExercise,
        handleAddSet,
        updateSet,
        deleteSet,
        deleteUserWorkoutTemplate,
    } = useTemplateBuilder(templateId);

    const accentColor = useThemeColor('accent');
    const dangerColor = useThemeColor('danger');
    const foregroundColor = useThemeColor('foreground');

    return (
        <MainLayout scrollable={false}>
            <DraggableFlatList
                ListHeaderComponent={
                    <View className="flex-row justify-between items-center gap-2 mb-4">
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
                            <Button variant="primary" size="sm" onPress={() => handleSave().then(ok => ok && navigation.goBack())} isDisabled={!template.name}>
                                <Check color={foregroundColor} size={20} />
                                <Button.Label>Save</Button.Label>
                            </Button>
                        </View>
                    </View>
                }
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
                renderItem={({ item: group, drag }: RenderItemParams<ExerciseGroup<TemplateWorkoutSet>>) => {
                    const exercise = exercises.find(e => e.id === group.exerciseId);
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
