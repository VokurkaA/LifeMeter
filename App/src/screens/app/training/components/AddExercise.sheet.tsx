import { BottomSheet, Card, PressableFeedback, useThemeColor } from "heroui-native";
import { useState, useMemo } from "react";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { View } from "react-native";
import { Text } from "@/components/Text";
import { Exercise } from "@/types/workout.types";
import { BottomSheetTextInput } from "@/components/BottomSheetTextInput";
import { useWorkoutStore } from "@/contexts/useWorkoutStore";
import { Dumbbell } from "lucide-react-native";

interface AddExerciseSheetProps {
    onSelectExercise: (exercise: Exercise) => void;
    trigger: React.ReactNode;
}

export default function AddExerciseSheet({ onSelectExercise, trigger }: AddExerciseSheetProps) {
    const { exercises } = useWorkoutStore();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const accentColor = useThemeColor('accent');

    const filteredExercises = useMemo(() => {
        if (!search) return exercises;
        const lowerSearch = search.toLowerCase();
        return exercises.filter(e => 
            e.variant.toLowerCase().includes(lowerSearch) || 
            e.type.toLowerCase().includes(lowerSearch)
        );
    }, [exercises, search]);

    const renderItem = ({ item }: { item: Exercise }) => (
        <PressableFeedback 
            onPress={() => {
                onSelectExercise(item);
                setIsOpen(false);
            }}
            className="mb-3 mx-4"
        >
            <Card variant="transparent" className="border border-border">
                <Card.Header className="flex-row items-center gap-4">
                    <View className="bg-primary/10 p-2 rounded-full">
                        <Dumbbell size={18} color={accentColor} />
                    </View>
                    <View className="flex-1">
                        <Card.Title className="capitalize font-bold">{item.variant}</Card.Title>
                        <Card.Description className="capitalize text-xs">{item.type}</Card.Description>
                    </View>
                </Card.Header>
            </Card>
        </PressableFeedback>
    );

    return (
        <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
            <BottomSheet.Trigger asChild>
                {trigger}
            </BottomSheet.Trigger>
            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content
                    snapPoints={["60%", "90%"]}
                    contentContainerClassName="flex-1"
                >
                    <BottomSheet.Title className="mb-4 px-4">Add Exercise</BottomSheet.Title>
                    <View className="px-4 mb-4">
                        <BottomSheetTextInput
                            placeholder="Search exercises..."
                            value={search}
                            onChangeText={setSearch}
                            variant="secondary"
                        />
                    </View>
                    
                    <BottomSheetFlatList
                        data={filteredExercises}
                        keyExtractor={(item: Exercise) => item.id}
                        renderItem={renderItem}
                        contentContainerClassName="pb-10"
                        ListEmptyComponent={
                            <View className="py-20 items-center">
                                <Text className="text-muted text-center italic">No exercises found matching "{search}"</Text>
                            </View>
                        }
                    />
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
}
