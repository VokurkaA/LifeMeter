import React from 'react';
import { View } from 'react-native';
import { Card, Button, PressableFeedback, useThemeColor } from 'heroui-native';
import { Text } from '@/components/Text';
import { GripVertical, Plus } from 'lucide-react-native';
import { Exercise } from '@/types/workout.types';

interface Props {
    /** The exercise data for this group. */
    exercise?: Exercise;
    /** When provided, renders a long-press drag handle (for DraggableFlatList). */
    drag?: () => void;
    /** Called when the user taps "Add Set". */
    onAddSet: () => void;
    /** Column header row rendered inside Card.Header. */
    columnHeader: React.ReactNode;
    /** Set rows to render inside the card. */
    children: React.ReactNode;
}

/**
 * Shared card for a single exercise group (exercise name + sets + add-set button).
 * Used by both ActiveWorkout and TemplateBuilder.
 */
export default function ExerciseGroupCard({
    exercise,
    drag,
    onAddSet,
    columnHeader,
    children,
}: Props) {
    const accentColor = useThemeColor('accent');
    const mutedColor = useThemeColor('muted');

    return (
        <View className="gap-3">
            <View className="flex-row items-center gap-2">
                <Text className="font-bold text-xl flex-1">
                    {exercise?.variant} {exercise?.type}
                </Text>
                {drag && (
                    <PressableFeedback onLongPress={drag} delayLongPress={150}>
                        <GripVertical size={20} color={mutedColor} />
                    </PressableFeedback>
                )}
            </View>

            <Card variant="transparent" className="border border-border">
                <Card.Header className="flex flex-row items-center justify-between">
                    {columnHeader}
                </Card.Header>

                {children}

                <Button variant="outline" onPress={onAddSet}>
                    <Plus size={16} color={accentColor} />
                    <Text className="text-accent font-bold">Add Set</Text>
                </Button>
            </Card>
        </View>
    );
}
