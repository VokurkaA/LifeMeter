import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { userProfileService } from '@/services/user.profile.service';
import { useStorage } from '@/lib/storage';
import { useAuth } from './useAuth';
import { onReconnect } from '@/lib/network-state';
import type { 
  ActivityLevel, 
  LengthUnit, 
  LogHeightInput, 
  LogWeightInput, 
  UpdateGoalInput, 
  UpdateProfileInput, 
  UserGoal, 
  UserProfile, 
  UserWeightLog, 
  WeightUnit 
} from '@/types/user.profile.types';

export interface UserStoreContextType {
  userProfile: UserProfile | undefined;
  userGoals: UserGoal | null | undefined;
  activityLevels: ActivityLevel[];
  lengthUnits: LengthUnit[];
  weightUnits: WeightUnit[];
  latestWeight: UserWeightLog | undefined;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<void>;
  updateGoals: (data: UpdateGoalInput) => Promise<void>;
  logWeight: (data: LogWeightInput) => Promise<void>;
  logHeight: (data: LogHeightInput) => Promise<void>;
  isLoading: boolean;
}

const UserStoreContext = createContext<UserStoreContextType | undefined>(undefined);

export const UserStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useStorage.object<UserProfile>('userProfile');
  const [userGoals, setUserGoals] = useStorage.object<UserGoal>('userGoals');
  const [latestWeight, setLatestWeight] = useStorage.object<UserWeightLog>('latestWeight');
  const [activityLevels, setActivityLevels] = useStorage.array<ActivityLevel>('activityLevels');
  const [lengthUnits, setLengthUnits] = useStorage.array<LengthUnit>('lengthUnits');
  const [weightUnits, setWeightUnits] = useStorage.array<WeightUnit>('weightUnits');

  const [isLoading, setIsLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    return onReconnect(() => setRefreshCount((c) => c + 1));
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setUserProfile(undefined);
      setUserGoals(undefined);
      setLatestWeight(undefined);
      setActivityLevels(undefined);
      setLengthUnits(undefined);
      setWeightUnits(undefined);
      setIsLoading(false);
      return;
    }

    let active = true;
    const shouldBlockWithoutProfile = !userProfile;
    (async () => {
      try {
        if (shouldBlockWithoutProfile) setIsLoading(true);
        const [profile, goals, weight, levels, lUnits, wUnits] = await Promise.all([
          userProfileService.getProfile(),
          userProfileService.getGoals(),
          userProfileService.getLatestWeight(),
          userProfileService.getActivityLevels(),
          userProfileService.getLengthUnits(),
          userProfileService.getWeightUnits(),
        ]);
        if (active) {
          setUserProfile(profile);
          setUserGoals(goals);
          setLatestWeight(weight);
          setActivityLevels(levels);
          setLengthUnits(lUnits);
          setWeightUnits(wUnits);
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Failed to fetch user data', e);
        if (active && !shouldBlockWithoutProfile) {
          setIsLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [authLoading, user, refreshCount]);

  const refreshProfile = useCallback(async () => {
    const profile = await userProfileService.getProfile();
    const goals = await userProfileService.getGoals();
    const weight = await userProfileService.getLatestWeight();
    setUserProfile(profile);
    setUserGoals(goals);
    setLatestWeight(weight);
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileInput) => {
    const updated = await userProfileService.updateProfile(data);
    setUserProfile(updated);
  }, []);

  const updateGoals = useCallback(async (data: UpdateGoalInput) => {
    const updated = await userProfileService.updateGoals(data);
    setUserGoals(updated);
  }, []);

  const logWeight = useCallback(async (data: LogWeightInput) => {
    const log = await userProfileService.logWeight(data);
    setLatestWeight(log);
  }, []);

  const logHeight = useCallback(async (data: LogHeightInput) => {
    await userProfileService.logHeight(data);
  }, []);

  const value = useMemo(() => ({
    userProfile: userProfile ?? undefined,
    userGoals: userGoals ?? undefined,
    activityLevels: activityLevels ?? [],
    lengthUnits: lengthUnits ?? [],
    weightUnits: weightUnits ?? [],
    latestWeight: latestWeight ?? undefined,
    refreshProfile,
    updateProfile,
    updateGoals,
    logWeight,
    logHeight,
    isLoading
  }), [userProfile, userGoals, activityLevels, lengthUnits, weightUnits, latestWeight, refreshProfile, updateProfile, updateGoals, logWeight, logHeight, isLoading]);

  return <UserStoreContext.Provider value={value}>{children}</UserStoreContext.Provider>;
};

export const useUserStore = () => {
  const context = useContext(UserStoreContext);
  if (!context) throw new Error('useUserStore must be used within UserStoreProvider');
  return context;
};
