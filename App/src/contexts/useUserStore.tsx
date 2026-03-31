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
  UserHeightLog,
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
  latestHeight: UserHeightLog | undefined;
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
  const [latestHeight, setLatestHeight] = useStorage.object<UserHeightLog>('latestHeight');
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
      setLatestHeight(undefined);
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

        // Fetch reference data independently to ensure onboarding works for new users
        const [levels, lUnits, wUnits] = await Promise.all([
          userProfileService.getActivityLevels().catch(e => { console.error('Failed to fetch activity levels', e); return []; }),
          userProfileService.getLengthUnits().catch(e => { console.error('Failed to fetch length units', e); return []; }),
          userProfileService.getWeightUnits().catch(e => { console.error('Failed to fetch weight units', e); return []; }),
        ]);

        if (active) {
          setActivityLevels(levels);
          setLengthUnits(lUnits);
          setWeightUnits(wUnits);
        }

        // Fetch user-specific data
        const latestHeightPromise = userProfileService.getLatestHeight().catch((error) => {
          console.warn('Failed to fetch latest height', error);
          return undefined;
        });

        const [profile, goals, weight, height] = await Promise.all([
          userProfileService.getProfile().catch(() => undefined),
          userProfileService.getGoals().catch(() => undefined),
          userProfileService.getLatestWeight().catch(() => undefined),
          latestHeightPromise,
        ]);

        if (active) {
          setUserProfile(profile);
          setUserGoals(goals);
          setLatestWeight(weight);
          setLatestHeight(height);
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Failed to fetch user data', e);
        if (active) {
          setIsLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [authLoading, user, refreshCount]);

  const refreshProfile = useCallback(async () => {
    const latestHeight = await userProfileService.getLatestHeight().catch((error) => {
      console.warn('Failed to fetch latest height', error);
      return undefined;
    });
    const profile = await userProfileService.getProfile();
    const goals = await userProfileService.getGoals();
    const weight = await userProfileService.getLatestWeight();
    setUserProfile(profile);
    setUserGoals(goals);
    setLatestWeight(weight);
    setLatestHeight(latestHeight);
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
    const log = await userProfileService.logHeight(data);
    setLatestHeight(log);
  }, []);

  const value = useMemo(() => ({
    userProfile: userProfile ?? undefined,
    userGoals: userGoals ?? undefined,
    activityLevels: activityLevels ?? [],
    lengthUnits: lengthUnits ?? [],
    weightUnits: weightUnits ?? [],
    latestWeight: latestWeight ?? undefined,
    latestHeight: latestHeight ?? undefined,
    refreshProfile,
    updateProfile,
    updateGoals,
    logWeight,
    logHeight,
    isLoading
  }), [userProfile, userGoals, activityLevels, lengthUnits, weightUnits, latestWeight, latestHeight, refreshProfile, updateProfile, updateGoals, logWeight, logHeight, isLoading]);

  return <UserStoreContext.Provider value={value}>{children}</UserStoreContext.Provider>;
};

export const useUserStore = () => {
  const context = useContext(UserStoreContext);
  if (!context) throw new Error('useUserStore must be used within UserStoreProvider');
  return context;
};
