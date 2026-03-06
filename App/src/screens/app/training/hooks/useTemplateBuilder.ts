import { useMemo, useState, useCallback } from 'react';
import { useWorkoutStore } from '@/contexts/useWorkoutStore';
import { useExerciseGroups, ExerciseGroup } from './useExerciseGroups';
import { Exercise, TemplateWorkoutSet, FullWorkoutTemplate } from '@/types/workout.types';

/**
 * Encapsulates all state and operations for the TemplateBuilder screen.
 * Navigation callbacks (goBack) are intentionally left to the screen so this
 * hook stays navigation-agnostic.
 */
export function useTemplateBuilder(templateId: string | undefined) {
    const {
        userWorkoutTemplates,
        createUserWorkoutTemplate,
        editUserWorkoutTemplate,
        deleteUserWorkoutTemplate,
        setStyles,
        setTypes,
        exercises,
    } = useWorkoutStore();

    const [template, setTemplate] = useState<FullWorkoutTemplate>(() => {
        const existing = userWorkoutTemplates.find(t => t.id === templateId);
        return existing || {
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            name: '',
            userId: '',
            sets: [],
        };
    });

    // ── Grouped sets + drag state ────────────────────────────────────────────
    const { localGroups, setLocalGroups, dragPendingRef } = useExerciseGroups(template.sets);

    // ── Drag reorder ─────────────────────────────────────────────────────────
    const handleDragEnd = useCallback(({ data }: { data: ExerciseGroup<TemplateWorkoutSet>[] }) => {
        setLocalGroups(data);
        dragPendingRef.current = true;
        let seq = 1;
        const reordered: TemplateWorkoutSet[] = [];
        for (const group of data) {
            for (const set of group.sets) {
                reordered.push({ ...set, seqNumber: seq++ });
            }
        }
        setTemplate(t => ({ ...t, sets: reordered }));
        dragPendingRef.current = false;
    }, []);

    // ── Save ─────────────────────────────────────────────────────────────────
    /** Persists the template. Returns true on success so the screen can goBack. */
    const handleSave = useCallback(async (): Promise<boolean> => {
        if (!template.name) return false;
        if (templateId) {
            await editUserWorkoutTemplate(template.id, template);
        } else {
            await createUserWorkoutTemplate(template);
        }
        return true;
    }, [template, templateId, editUserWorkoutTemplate, createUserWorkoutTemplate]);

    // ── Set operations ───────────────────────────────────────────────────────
    const handleAddExercise = useCallback((exercise: Exercise) => {
        const newSet: TemplateWorkoutSet = {
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            workoutTemplateId: template.id,
            exerciseId: exercise.id,
            seqNumber: template.sets.length + 1,
            repetitions: 1,
        };
        setTemplate(t => ({ ...t, sets: [...t.sets, newSet] }));
    }, [template.id, template.sets.length]);

    const handleAddSet = useCallback((exerciseId: string) => {
        setTemplate(t => {
            const exerciseSets = t.sets.filter(s => s.exerciseId === exerciseId);
            const last = exerciseSets[exerciseSets.length - 1];
            const newSet: TemplateWorkoutSet = {
                id: 'temp-' + Math.random().toString(36).substr(2, 9),
                workoutTemplateId: t.id,
                exerciseId,
                seqNumber: t.sets.length + 1,
                repetitions: last?.repetitions || 1,
                rir: last?.rir,
                styleId: last?.styleId,
                setTypeId: last?.setTypeId,
                restTime: last?.restTime,
            };
            return { ...t, sets: [...t.sets, newSet] };
        });
    }, []);

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

    return {
        template,
        setTemplate,
        exercises,
        setStyles,
        setTypes,
        // list
        localGroups,
        handleDragEnd,
        // operations
        handleSave,
        handleAddExercise,
        handleAddSet,
        updateSet,
        deleteSet,
        deleteUserWorkoutTemplate,
    };
}
