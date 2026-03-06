import { SleepSession, StoreContextType } from '@/types/types';
import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
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
import { storage, useStorage } from '@/lib/storage';
import { onReconnect } from '@/lib/network-state';
import { toast } from '@/lib/toast';
import { openHealthDashboard, requestHealthPermissions } from '@/lib/health';
import { Linking } from 'react-native/Libraries/Linking/Linking';

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<any> = ({ children }) => {
  const [sleepSessions, setSleepSessions] = useStorage.array<SleepSession>('sleepSessions');
  const [userMeals, setUserMeals] = useStorage.array<{ userMeal: UserMeal; userFoods: UserFood[] }>('userMeals');
  const [userWorkouts, setUserWorkouts] = useStorage.array<FullWorkout>('userWorkouts');
  const [userProfile, setUserProfile] = useStorage.object<UserProfile>('userProfile');
  const [userGoals, setUserGoals] = useStorage.object<UserGoal>('userGoals');
  const [latestWeight, setLatestWeight] = useStorage.object<UserWeightLog>('latestWeight');
  const [activityLevels, setActivityLevels] = useStorage.array<ActivityLevel>('activityLevels');
  const [lengthUnits, setLengthUnits] = useStorage.array<LengthUnit>('lengthUnits');
  const [weightUnits, setWeightUnits] = useStorage.array<WeightUnit>('weightUnits');

  const [isLoading, setIsLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  const { user } = useAuth();

  useLayoutEffect(() => {
    return onReconnect(() => setRefreshCount((c) => c + 1));
  }, []);

  useLayoutEffect(() => {
    if (!user) {
      setSleepSessions(undefined);
      setUserMeals(undefined);
      setUserWorkouts(undefined);
      setUserProfile(undefined);
      setUserGoals(undefined);
      setLatestWeight(undefined);
      setIsLoading(false);
      return;
    }

    if (!sleepSessions && !userMeals && !userWorkouts) {
      setIsLoading(true);
    }
    if (storage.boolean.get('enable-sync')) {
      requestHealthPermissions().then(result => {
        console.log(JSON.stringify(result))
        if (!result.ok) {
          storage.boolean.set('enable-sync', false);
          toast.show({
            variant: "warning",
            label: "Permission denied",
            description: "Please enable health permissions in your device settings.",
            actionLabel: "Open Settings",
            onActionPress: () => openHealthDashboard(),
          });
        }
      })
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
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, refreshCount]);

  const startSleep = useCallback(async () => {
    try {
      const newSession = await sleepService.startSleepSession();
      setSleepSessions([newSession, ...(sleepSessions ?? [])]);
    } catch (e) {
      console.error('Failed to start sleep session', e);
    }
  }, [sleepSessions]);

  const endSleep = useCallback(async () => {
    try {
      const endedSession = await sleepService.endSleepSession();
      setSleepSessions(
        (sleepSessions ?? []).map((session) =>
          session.id === endedSession.id ? endedSession : session,
        ),
      );
    } catch (e) {
      console.error('Failed to end sleep session', e);
    }
  }, [sleepSessions]);

  const createSleepSession = useCallback(
    async (startAt: string, endAt?: string, note?: string) => {
      try {
        const created = await sleepService.addSleepSession(startAt, endAt, note);
        setSleepSessions([created, ...(sleepSessions ?? [])]);
      } catch (e) {
        console.error('Failed to create sleep session', e);
        throw e;
      }
    },
    [sleepSessions],
  );

  const editSleepSession = useCallback(
    async (
      id: string,
      patch: { startAt?: string; endAt?: string | undefined; note?: string | undefined },
    ) => {
      try {
        const updated = await sleepService.editSleepSession(id, patch);
        setSleepSessions((sleepSessions ?? []).map((s) => (s.id === id ? updated : s)));
      } catch (e) {
        console.error('Failed to edit sleep session', e);
        throw e;
      }
    },
    [sleepSessions],
  );

  const deleteSleepSession = useCallback(
    async (id: string) => {
      try {
        await sleepService.deleteSleepSession(id);
        setSleepSessions((sleepSessions ?? []).filter((s) => s.id !== id));
      } catch (e) {
        console.error('Failed to delete sleep session', e);
        throw e;
      }
    },
    [sleepSessions],
  );

  const ongoingSleepSession = useMemo(() => {
    return (sleepSessions ?? []).find((session) => !session.endAt) || undefined;
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

  const createUserMeal = useCallback(
    async (data: CreateMealInput) => {
      try {
        const created = await foodService.addUserMeal(data);
        setUserMeals([{ userMeal: created.meal, userFoods: created.food }, ...(userMeals ?? [])]);
      } catch (e) {
        console.error('Failed to create user meal', e);
      }
    },
    [userMeals],
  );

  const editUserMeal = useCallback(
    async (id: string, data: UpdateMealInput) => {
      try {
        const updated = await foodService.editUserMeal(id, data);
        const summary = {
          userMeal: updated.userMeal,
          userFoods: updated.userFoods.map((uf) => uf.userFood),
        };
        setUserMeals((userMeals ?? []).map((m) => (m.userMeal.id === id ? summary : m)));
      } catch (e) {
        console.error('Failed to edit user meal', e);
      }
    },
    [userMeals],
  );

  const deleteUserMeal = useCallback(
    async (id: string) => {
      try {
        await foodService.deleteUserMeal(id);
        setUserMeals((userMeals ?? []).filter((m) => m.userMeal.id !== id));
      } catch (e) {
        console.error('Failed to delete user meal', e);
      }
    },
    [userMeals],
  );

  const refreshUserWorkouts = useCallback(async () => {
    try {
      const workouts = await workoutService.getAllUserWorkouts();
      setUserWorkouts(workouts);
    } catch (e) {
      console.error('Failed to refresh user workouts', e);
    }
  }, []);

  const createUserWorkout = useCallback(
    async (data: FullWorkout) => {
      try {
        const created = await workoutService.addUserWorkout(data);
        setUserWorkouts([created, ...(userWorkouts ?? [])]);
        return created;
      } catch (e) {
        console.error('Failed to create user workout', e);
        return undefined;
      }
    },
    [userWorkouts],
  );

  const editUserWorkout = useCallback(
    async (id: string, data: FullWorkout) => {
      try {
        const updated = await workoutService.editUserWorkout(id, data);
        setUserWorkouts((userWorkouts ?? []).map((w) => (w.id === id ? updated : w)));
        return updated;
      } catch (e) {
        console.error('Failed to edit user workout', e);
        return undefined;
      }
    },
    [userWorkouts],
  );

  const deleteUserWorkout = useCallback(
    async (id: string) => {
      try {
        await workoutService.deleteUserWorkout(id);
        setUserWorkouts((userWorkouts ?? []).filter((w) => w.id !== id));
      } catch (e) {
        console.error('Failed to delete user workout', e);
      }
    },
    [userWorkouts],
  );

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
      sleepSessions: sleepSessions ?? [],
      startSleep,
      endSleep,
      createSleepSession,
      editSleepSession,
      deleteSleepSession,
      ongoingSleepSession,
      refreshSleepSessions,

      // Meals
      userMeals: userMeals ?? [],
      refreshUserMeals,
      createUserMeal,
      editUserMeal,
      deleteUserMeal,

      // Workouts
      userWorkouts: userWorkouts ?? [],
      refreshUserWorkouts,
      createUserWorkout,
      editUserWorkout,
      deleteUserWorkout,

      // Profile & Goals
      userProfile: userProfile ?? undefined,
      userGoals: userGoals ?? undefined,
      activityLevels: activityLevels ?? [],
      lengthUnits: lengthUnits ?? [],
      weightUnits: weightUnits ?? [],
      latestWeight: latestWeight ?? undefined,
      isLoading,
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
      isLoading,
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