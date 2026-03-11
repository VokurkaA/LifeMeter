import { useMemo, useState, useEffect, useRef } from 'react';

export type ExerciseGroup<TSet extends { exerciseId: string; seqNumber: number }> = {
    exerciseId: string;
    sets: TSet[];
};

/**
 * Groups an array of sets by exerciseId (sorted by seqNumber) and manages
 * local optimistic drag-reorder state so the DraggableFlatList feels instant.
 */
export function useExerciseGroups<TSet extends { exerciseId: string; seqNumber: number }>(
    sets: TSet[],
) {
    const groupedSets = useMemo(() => {
        const groups: ExerciseGroup<TSet>[] = [];
        const sortedSets = [...sets].sort((a, b) => a.seqNumber - b.seqNumber);
        sortedSets.forEach(set => {
            const group = groups.find(g => g.exerciseId === set.exerciseId);
            if (group) group.sets.push(set);
            else groups.push({ exerciseId: set.exerciseId, sets: [set] });
        });
        return groups;
    }, [sets]);

    const [localGroups, setLocalGroups] = useState<ExerciseGroup<TSet>[]>(groupedSets);
    const dragPendingRef = useRef(false);

    useEffect(() => {
        if (dragPendingRef.current) return;
        setLocalGroups(groupedSets);
    }, [groupedSets]);

    return { localGroups, setLocalGroups, dragPendingRef };
}
