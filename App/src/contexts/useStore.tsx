import { SleepSession, StoreContextType } from '@/types/types';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { sleepService } from '@/services/sleep.service';
import { foodService } from '@/services/food.service';
import { userProfileService } from '@/services/user.profile.service';
import type { CreateMealInput, UpdateMealInput, UserFood, UserMeal } from '@/types/food.types';
import { workoutService } from '@/services/workout.service';
import { FullWorkout } from '@/types/workout.types';
import { useAuth } from '@/contexts/useAuth';
import {
  ActivityLevel,
  LengthUnit,
  LogHeightInput,
  LogWeightInput,
  UpdateGoalInput,
  UpdateProfileInput,
  UserGoal,
  UserProfile,
  UserWeightLog,
  WeightUnit,
} from '@/types/user.profile.types';

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<any> = ({ children }) => {
  const [sleepSessions, setSleepSessions] = useState<SleepSession[]>([]);
  const [userMeals, setUserMeals] = useState<{ userMeal: UserMeal; userFoods: UserFood[] }[]>([]);
  const [userWorkouts, setUserWorkouts] = useState<FullWorkout[]>([]);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userGoals, setUserGoals] = useState<UserGoal | null>(null);
  const [latestWeight, setLatestWeight] = useState<UserWeightLog | null>(null);

  const [activityLevels, setActivityLevels] = useState<ActivityLevel[]>([]);
  const [lengthUnits, setLengthUnits] = useState<LengthUnit[]>([]);
  const [weightUnits, setWeightUnits] = useState<WeightUnit[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setSleepSessions([]);
      setUserMeals([]);
      setUserWorkouts([]);
      setUserProfile(null);
      setUserGoals(null);
      setLatestWeight(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        const [sessions, meals, workouts, profile, goals, weight, levels, lUnits, wUnits] =
          await Promise.all([
            sleepService.getAllSleepSessions(),
            foodService.getAllUserMeals(),
            workoutService.getAllUserWorkouts(),

            userProfileService.getProfile(),
            userProfileService.getGoals(),
            userProfileService.getLatestWeight(),
            userProfileService.getActivityLevels(),
            userProfileService.getLengthUnits(),
            userProfileService.getWeightUnits(),
          ]);

        if (!active) return;

        setSleepSessions(sessions);
        setUserMeals(meals);
        setUserWorkouts(workouts);

        setUserProfile(profile);
        setUserGoals(goals);
        setLatestWeight(weight);
        setActivityLevels(levels);
        setLengthUnits(lUnits);
        setWeightUnits(wUnits);
      } catch (e) {
        console.error('Failed to initialize store', e);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const startSleep = useCallback(async () => {
    try {
      const newSession = await sleepService.startSleepSession();
      setSleepSessions((prev) => [newSession, ...prev]);
    } catch (e) {
      console.error('Failed to start sleep session', e);
    }
  }, []);

  const endSleep = useCallback(async () => {
    try {
      const endedSession = await sleepService.endSleepSession();
      setSleepSessions((prev) =>
        prev.map((session) => (session.id === endedSession.id ? endedSession : session)),
      );
    } catch (e) {
      console.error('Failed to end sleep session', e);
    }
  }, []);

  const createSleepSession = useCallback(async (startAt: string, endAt?: string, note?: string) => {
    try {
      const created = await sleepService.addSleepSession(startAt, endAt, note);
      setSleepSessions((prev) => [created, ...prev]);
    } catch (e) {
      console.error('Failed to create sleep session', e);
    }
  }, []);

  const editSleepSession = useCallback(
    async (
      id: string,
      patch: { startAt?: string; endAt?: string | null; note?: string | null },
    ) => {
      try {
        const updated = await sleepService.editSleepSession(id, patch);
        setSleepSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      } catch (e) {
        console.error('Failed to edit sleep session', e);
      }
    },
    [],
  );

  const deleteSleepSession = useCallback(async (id: string) => {
    try {
      await sleepService.deleteSleepSession(id);
      setSleepSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error('Failed to delete sleep session', e);
    }
  }, []);

  const ongoingSleepSession = useMemo(() => {
    return sleepSessions.find((session) => !session.endAt) || null;
  }, [sleepSessions]);

  const refreshSleepSessions = useCallback(async () => {
    try {
      const sessions = await sleepService.getAllSleepSessions();
      setSleepSessions(sessions);
    } catch (e) {
      console.error('Failed to refresh sleep sessions', e);
    }
  }, []);

  const refreshUserMeals = useCallback(async () => {
    try {
      const meals = await foodService.getAllUserMeals();
      setUserMeals(meals);
    } catch (e) {
      console.error('Failed to refresh user meals', e);
    }
  }, []);

  const createUserMeal = useCallback(async (data: CreateMealInput) => {
    try {
      const created = await foodService.addUserMeal(data);
      setUserMeals((prev) => [{ userMeal: created.meal, userFoods: created.food }, ...prev]);
    } catch (e) {
      console.error('Failed to create user meal', e);
    }
  }, []);

  const editUserMeal = useCallback(async (id: string, data: UpdateMealInput) => {
    try {
      const updated = await foodService.editUserMeal(id, data);
      const summary = {
        userMeal: updated.userMeal,
        userFoods: updated.userFoods.map((uf) => uf.userFood),
      };
      setUserMeals((prev) => prev.map((m) => (m.userMeal.id === id ? summary : m)));
    } catch (e) {
      console.error('Failed to edit user meal', e);
    }
  }, []);

  const deleteUserMeal = useCallback(async (id: string) => {
    try {
      await foodService.deleteUserMeal(id);
      setUserMeals((prev) => prev.filter((m) => m.userMeal.id !== id));
    } catch (e) {
      console.error('Failed to delete user meal', e);
    }
  }, []);

  const refreshUserWorkouts = useCallback(async () => {
    try {
      const workouts = await workoutService.getAllUserWorkouts();
      setUserWorkouts(workouts);
    } catch (e) {
      console.error('Failed to refresh user workouts', e);
    }
  }, []);

  const createUserWorkout = useCallback(async (data: FullWorkout) => {
    try {
      const created = await workoutService.addUserWorkout(data);
      setUserWorkouts((prev) => [created, ...prev]);
      return created;
    } catch (e) {
      console.error('Failed to create user workout', e);
      return undefined;
    }
  }, []);

  const editUserWorkout = useCallback(async (id: string, data: FullWorkout) => {
    try {
      const updated = await workoutService.editUserWorkout(id, data);
      setUserWorkouts((prev) => prev.map((w) => (w.id === id ? updated : w)));
      return updated;
    } catch (e) {
      console.error('Failed to edit user workout', e);
      return undefined;
    }
  }, []);

  const deleteUserWorkout = useCallback(async (id: string) => {
    try {
      await workoutService.deleteUserWorkout(id);
      setUserWorkouts((prev) => prev.filter((w) => w.id !== id));
    } catch (e) {
      console.error('Failed to delete user workout', e);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await userProfileService.getProfile();
      const goals = await userProfileService.getGoals();
      const weight = await userProfileService.getLatestWeight();
      setUserProfile(profile);
      setUserGoals(goals);
      setLatestWeight(weight);
    } catch (e) {
      console.error('Failed to refresh profile', e);
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileInput) => {
    try {
      const updated = await userProfileService.updateProfile(data);
      setUserProfile(updated);
    } catch (e) {
      console.error('Failed to update profile', e);
      throw e;
    }
  }, []);

  const updateGoals = useCallback(async (data: UpdateGoalInput) => {
    try {
      const updated = await userProfileService.updateGoals(data);
      setUserGoals(updated);
    } catch (e) {
      console.error('Failed to update goals', e);
      throw e;
    }
  }, []);

  const logWeight = useCallback(async (data: LogWeightInput) => {
    try {
      const log = await userProfileService.logWeight(data);
      setLatestWeight(log);
    } catch (e) {
      console.error('Failed to log weight', e);
      throw e;
    }
  }, []);

  const logHeight = useCallback(async (data: LogHeightInput) => {
    try {
      await userProfileService.logHeight(data);
    } catch (e) {
      console.error('Failed to log height', e);
      throw e;
    }
  }, []);

  const storeValue: StoreContextType = useMemo(
    () => ({
      // Sleep
      sleepSessions,
      startSleep,
      endSleep,
      createSleepSession,
      editSleepSession,
      deleteSleepSession,
      ongoingSleepSession,
      refreshSleepSessions,

      // Meals
      userMeals,
      refreshUserMeals,
      createUserMeal,
      editUserMeal,
      deleteUserMeal,

      // Workouts
      userWorkouts,
      refreshUserWorkouts,
      createUserWorkout,
      editUserWorkout,
      deleteUserWorkout,

      // Profile & Goals
      userProfile,
      userGoals,
      activityLevels,
      lengthUnits,
      weightUnits,
      latestWeight,
      refreshProfile,
      updateProfile,
      updateGoals,
      logWeight,
      logHeight,
    }),
    [
      sleepSessions,
      startSleep,
      endSleep,
      createSleepSession,
      editSleepSession,
      deleteSleepSession,
      ongoingSleepSession,
      refreshSleepSessions,
      userMeals,
      refreshUserMeals,
      createUserMeal,
      editUserMeal,
      deleteUserMeal,
      userWorkouts,
      refreshUserWorkouts,
      createUserWorkout,
      editUserWorkout,
      deleteUserWorkout,
      userProfile,
      userGoals,
      activityLevels,
      lengthUnits,
      weightUnits,
      latestWeight,
      refreshProfile,
      updateProfile,
      updateGoals,
      logWeight,
      logHeight,
    ],
  );

  return <StoreContext.Provider value={storeValue}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};