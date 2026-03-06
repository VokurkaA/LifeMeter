import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { workoutService } from '@/services/workout.service';
import { useStorage } from '@/lib/storage';
import { useAuth } from './useAuth';
import { onReconnect } from '@/lib/network-state';
import type { 
  Exercise, 
  FullWorkout, 
  FullWorkoutTemplate, 
  SetStyle, 
  SetType 
} from '@/types/workout.types';

export interface WorkoutStoreContextType {
  userWorkouts: FullWorkout[];
  userWorkoutTemplates: FullWorkoutTemplate[];
  exercises: Exercise[];
  setStyles: SetStyle[];
  setTypes: SetType[];
  refreshUserWorkouts: () => Promise<void>;
  createUserWorkout: (data: FullWorkout) => Promise<FullWorkout | undefined>;
  editUserWorkout: (id: string, data: FullWorkout) => Promise<FullWorkout | undefined>;
  deleteUserWorkout: (id: string) => Promise<void>;
  refreshUserWorkoutTemplates: () => Promise<void>;
  createUserWorkoutTemplate: (data: FullWorkoutTemplate) => Promise<FullWorkoutTemplate | undefined>;
  editUserWorkoutTemplate: (id: string, data: FullWorkoutTemplate) => Promise<FullWorkoutTemplate | undefined>;
  deleteUserWorkoutTemplate: (id: string) => Promise<void>;
  refreshExercises: () => Promise<void>;
  isLoading: boolean;
}

const WorkoutStoreContext = createContext<WorkoutStoreContextType | undefined>(undefined);

export const WorkoutStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userWorkouts, setUserWorkouts] = useStorage.array<FullWorkout>('userWorkouts');
  const [userWorkoutTemplates, setUserWorkoutTemplates] = useStorage.array<FullWorkoutTemplate>('userWorkoutTemplates');
  const [exercises, setExercises] = useStorage.array<Exercise>('exercises');
  const [setStyles, setSetStyles] = useStorage.array<SetStyle>('setStyles');
  const [setTypes, setSetTypes] = useStorage.array<SetType>('setTypes');
  
  const [isLoading, setIsLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    return onReconnect(() => setRefreshCount((c) => c + 1));
  }, []);

  useEffect(() => {
    if (!user) {
      setUserWorkouts(undefined);
      setUserWorkoutTemplates(undefined);
      setExercises(undefined);
      setSetStyles(undefined);
      setSetTypes(undefined);
      return;
    }

    let active = true;
    (async () => {
      try {
        if (!userWorkouts || !userWorkoutTemplates) setIsLoading(true);
        const [workouts, templates, exercisesList, styles, types] = await Promise.all([
          workoutService.getAllUserWorkouts(),
          workoutService.getAllUserWorkoutTemplates(),
          workoutService.getExercises(),
          workoutService.getSetStyles(),
          workoutService.getSetTypes(),
        ]);
        if (active) {
          setUserWorkouts(workouts);
          setUserWorkoutTemplates(templates);
          setExercises(exercisesList);
          setSetStyles(styles);
          setSetTypes(types);
        }
      } catch (e) {
        console.error('Failed to fetch workout data', e);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user, refreshCount]);

  const refreshUserWorkouts = useCallback(async () => {
    const workouts = await workoutService.getAllUserWorkouts();
    setUserWorkouts(workouts);
  }, []);

  const createUserWorkout = useCallback(
    async (data: FullWorkout) => {
      const created = await workoutService.addUserWorkout(data);
      setUserWorkouts([created, ...(userWorkouts ?? [])]);
      return created;
    },
    [userWorkouts],
  );

  const editUserWorkout = useCallback(
    async (id: string, data: FullWorkout) => {
      const updated = await workoutService.editUserWorkout(id, data);
      setUserWorkouts((userWorkouts ?? []).map((w) => (w.id === id ? updated : w)));
      return updated;
    },
    [userWorkouts],
  );

  const deleteUserWorkout = useCallback(
    async (id: string) => {
      await workoutService.deleteUserWorkout(id);
      setUserWorkouts((userWorkouts ?? []).filter((w) => w.id !== id));
    },
    [userWorkouts],
  );

  const refreshUserWorkoutTemplates = useCallback(async () => {
    const templates = await workoutService.getAllUserWorkoutTemplates();
    setUserWorkoutTemplates(templates);
  }, []);

  const createUserWorkoutTemplate = useCallback(
    async (data: FullWorkoutTemplate) => {
      const created = await workoutService.addUserWorkoutTemplate(data);
      setUserWorkoutTemplates([created, ...(userWorkoutTemplates ?? [])]);
      return created;
    },
    [userWorkoutTemplates],
  );

  const editUserWorkoutTemplate = useCallback(
    async (id: string, data: FullWorkoutTemplate) => {
      const updated = await workoutService.editUserWorkoutTemplate(id, data);
      setUserWorkoutTemplates((userWorkoutTemplates ?? []).map((t) => (t.id === id ? updated : t)));
      return updated;
    },
    [userWorkoutTemplates],
  );

  const deleteUserWorkoutTemplate = useCallback(
    async (id: string) => {
      await workoutService.deleteUserWorkoutTemplate(id);
      setUserWorkoutTemplates((userWorkoutTemplates ?? []).filter((t) => t.id !== id));
    },
    [userWorkoutTemplates],
  );

  const refreshExercises = useCallback(async () => {
    const list = await workoutService.getExercises();
    setExercises(list);
  }, []);

  const value = useMemo(() => ({
    userWorkouts: userWorkouts ?? [],
    userWorkoutTemplates: userWorkoutTemplates ?? [],
    exercises: exercises ?? [],
    setStyles: setStyles ?? [],
    setTypes: setTypes ?? [],
    refreshUserWorkouts,
    createUserWorkout,
    editUserWorkout,
    deleteUserWorkout,
    refreshUserWorkoutTemplates,
    createUserWorkoutTemplate,
    editUserWorkoutTemplate,
    deleteUserWorkoutTemplate,
    refreshExercises,
    isLoading
  }), [userWorkouts, userWorkoutTemplates, exercises, setStyles, setTypes, refreshUserWorkouts, createUserWorkout, editUserWorkout, deleteUserWorkout, refreshUserWorkoutTemplates, createUserWorkoutTemplate, editUserWorkoutTemplate, deleteUserWorkoutTemplate, refreshExercises, isLoading]);

  return <WorkoutStoreContext.Provider value={value}>{children}</WorkoutStoreContext.Provider>;
};

export const useWorkoutStore = () => {
  const context = useContext(WorkoutStoreContext);
  if (!context) throw new Error('useWorkoutStore must be used within WorkoutStoreProvider');
  return context;
};
