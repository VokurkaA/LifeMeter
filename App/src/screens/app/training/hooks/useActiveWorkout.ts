import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useWorkoutStore } from '@/contexts/useWorkoutStore';
import { useUserStore } from '@/contexts/useUserStore';
import { useWorkoutTimer } from './useWorkoutTimer';
import { useExerciseGroups, ExerciseGroup } from './useExerciseGroups';
import { Exercise, WorkoutSet } from '@/types/workout.types';
import { formatDate, formatTime } from '@/lib/dateTime';

/**
 * Encapsulates all state and operations for the ActiveWorkout screen.
 */
export function useActiveWorkout(workoutId: string) {
    const {
        userWorkouts,
        editUserWorkout,
        deleteUserWorkout,
        setStyles,
        setTypes,
        exercises,
    } = useWorkoutStore();
    const { weightUnits } = useUserStore();

    const workout = useMemo(
        () => userWorkouts.find(w => w.id === workoutId),
        [userWorkouts, workoutId],
    );

    const { formattedTime } = useWorkoutTimer(workout?.startDate || new Date().toISOString());

    const startDate = useMemo(() => {
        if (!workout?.startDate) return null;
        const d = new Date(workout.startDate);
        return `${formatDate(d)}  ${formatTime(d)}`;
    }, [workout?.startDate]);

    // ── Label editing ────────────────────────────────────────────────────────
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

    // ── Grouped sets + drag state ────────────────────────────────────────────
    const { localGroups, setLocalGroups, dragPendingRef } = useExerciseGroups(
        workout?.sets ?? [],
    );

    // Stable refs so drag/update callbacks always see the latest values without
    // causing unnecessary re-renders or stale closures.
    const workoutRef = useRef(workout);
    useEffect(() => { workoutRef.current = workout; }, [workout]);

    const editRef = useRef(editUserWorkout);
    useEffect(() => { editRef.current = editUserWorkout; }, [editUserWorkout]);

    // ── Drag reorder ─────────────────────────────────────────────────────────
    const handleDragEnd = useCallback(({ data }: { data: ExerciseGroup<WorkoutSet>[] }) => {
        setLocalGroups(data);
        const w = workoutRef.current;
        if (!w) return;
        dragPendingRef.current = true;
        let seq = 1;
        const reordered: WorkoutSet[] = [];
        for (const group of data) {
            for (const set of group.sets) {
                reordered.push({ ...set, seqNumber: seq++ });
            }
        }
        editRef.current(w.id, { ...w, sets: reordered }).finally(() => {
            dragPendingRef.current = false;
        });
    }, []);

    // ── Set operations ───────────────────────────────────────────────────────
    const handleAddExercise = useCallback(async (exercise: Exercise) => {
        const w = workoutRef.current;
        if (!w) return;
        const newSet: WorkoutSet = {
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            workoutId: w.id,
            exerciseId: exercise.id,
            seqNumber: w.sets.length + 1,
            repetitions: 1,
            weight: 1,
            weightUnitId: weightUnits[0]?.id.toString() || '1',
        };
        await editRef.current(w.id, { ...w, sets: [...w.sets, newSet] });
    }, [weightUnits]);

    const handleAddSet = useCallback(async (exerciseId: string) => {
        const w = workoutRef.current;
        if (!w) return;
        const exerciseSets = w.sets.filter(s => s.exerciseId === exerciseId);
        const last = exerciseSets[exerciseSets.length - 1];
        const newSet: WorkoutSet = {
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            workoutId: w.id,
            exerciseId,
            seqNumber: w.sets.length + 1,
            repetitions: last?.repetitions || 1,
            weight: last?.weight || 1,
            weightUnitId: last?.weightUnitId || weightUnits[0]?.id.toString() || '1',
            styleId: last?.styleId,
            setTypeId: last?.setTypeId,
            restTime: last?.restTime,
        };
        await editRef.current(w.id, { ...w, sets: [...w.sets, newSet] });
    }, [weightUnits]);

    const updateSet = useCallback(async (setId: string, updates: Partial<WorkoutSet>) => {
        const w = workoutRef.current;
        if (!w) return;
        const newSets = w.sets.map(s => s.id === setId ? { ...s, ...updates } : s);
        await editRef.current(w.id, { ...w, sets: newSets });
    }, []);

    const deleteSet = useCallback(async (setId: string) => {
        const w = workoutRef.current;
        if (!w) return;
        const newSets = w.sets
            .filter(s => s.id !== setId)
            .map((s, i) => ({ ...s, seqNumber: i + 1 }));
        await editRef.current(w.id, { ...w, sets: newSets });
    }, []);

    return {
        workout,
        weightUnits,
        exercises,
        setStyles,
        setTypes,
        formattedTime,
        startDate,
        // label
        labelText,
        setLabelText,
        isEditingLabel,
        setIsEditingLabel,
        handleLabelBlur,
        // list
        localGroups,
        handleDragEnd,
        // set operations
        handleAddExercise,
        handleAddSet,
        updateSet,
        deleteSet,
        // workout ops
        editUserWorkout,
        deleteUserWorkout,
    };
}
