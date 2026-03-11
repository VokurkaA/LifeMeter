import React, { useState, useEffect } from "react";
import { BottomSheet } from "heroui-native";
import { Exercise } from "@/types/workout.types";
import { Combobox } from "@/components/Combobox";
import { useWorkoutStore } from "@/contexts/useWorkoutStore";

interface AddExerciseSheetProps {
    onSelectExercise: (exercise: Exercise) => void;
    trigger: React.ReactNode;
}

export default function AddExerciseSheet({ onSelectExercise, trigger }: AddExerciseSheetProps) {
    const { exercises } = useWorkoutStore();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isOpen) setSearchQuery("");
    }, [isOpen]);

    return (
        <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
            <BottomSheet.Trigger asChild>
                {trigger}
            </BottomSheet.Trigger>
            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content contentContainerClassName="flex-1">
                    <BottomSheet.Title>Add Exercise</BottomSheet.Title>
                        <Combobox
                            options={exercises}
                            getOptionValue={(e) => e.id}
                            getOptionLabel={(e) => `${e.variant} ${e.type}`}
                            dialogTitle="Select Exercise"
                            placeholder="Search exercises…"
                            searchPlaceholder="Search exercises..."
                            filterOption={(e, q) => {
                                const lower = q.toLowerCase();
                                return (
                                    e.variant.toLowerCase().includes(lower) ||
                                    e.type.toLowerCase().includes(lower)
                                );
                            }}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            resetSearchOnSelect
                            emptyText="No exercises found"
                            onChange={(e) => {
                                if (e) {
                                    onSelectExercise(e);
                                    setIsOpen(false);
                                }
                            }}
                        />
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
}
