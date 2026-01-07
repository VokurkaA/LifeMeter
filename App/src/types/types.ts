import { CreateMealInput, UpdateMealInput, UserFood, UserMeal } from '@/types/food.types';
import { FullWorkout } from '@/types/workout.types';
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
import React from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string;
  createdAt: string;
  updatedAt: string;
  role: string;
  banned: boolean;
  banReason: string;
  banExpires: string;
  lastLoginMethod: string;
  normalizedEmail: string;
}

export interface Session {
  id: string;
  expiresAt: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  ipAddress: string;
  userAgent: string;
  userId: string;
  impersonatedBy: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string, rememberMe?: boolean) => Promise<void>;
  signIn: (
    email: string,
    password: string,
    callbackURL?: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export interface StoreContextType {
  sleepSessions: SleepSession[];
  ongoingSleepSession: SleepSession | null;
  startSleep: () => Promise<void>;
  endSleep: () => Promise<void>;
  createSleepSession: (startAt: string, endAt?: string, note?: string) => Promise<void>;
  editSleepSession: (
    id: string,
    patch: {
      startAt?: string;
      endAt?: string | null;
      note?: string | null;
    },
  ) => Promise<void>;
  deleteSleepSession: (id: string) => Promise<void>;
  refreshSleepSessions: () => Promise<void>;

  userMeals: { userMeal: UserMeal; userFoods: UserFood[] }[];
  refreshUserMeals: () => Promise<void>;
  createUserMeal: (data: CreateMealInput) => Promise<void>;
  editUserMeal: (id: string, data: UpdateMealInput) => Promise<void>;
  deleteUserMeal: (id: string) => Promise<void>;

  userWorkouts: FullWorkout[];
  refreshUserWorkouts: () => Promise<void>;
  createUserWorkout: (data: FullWorkout) => Promise<FullWorkout | undefined>;
  editUserWorkout: (id: string, data: FullWorkout) => Promise<FullWorkout | undefined>;
  deleteUserWorkout: (id: string) => Promise<void>;
  userProfile: UserProfile | null;
  userGoals: UserGoal | null;
  activityLevels: ActivityLevel[];
  lengthUnits: LengthUnit[];
  weightUnits: WeightUnit[];
  latestWeight: UserWeightLog | null;

  refreshProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<void>;
  updateGoals: (data: UpdateGoalInput) => Promise<void>;
  logWeight: (data: LogWeightInput) => Promise<void>;
  logHeight: (data: LogHeightInput) => Promise<void>;
}

export interface NavigationItem {
  id: string;
  name: string;
  component?: React.ReactElement;
  params?: Record<string, unknown>;
}

export interface Tab extends NavigationItem {
  icon?: string;
  badge?: number;
}

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

export type Theme = 'light' | 'dark' | 'system';

export type OnboardingStackParamList = {
  Title: undefined;
  SignUp: undefined;
  Login: undefined;
  Preferences: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Training: undefined;
  Nutrition: undefined;
  Sleep: undefined;
};

export type SleepSession = {
  id: string;
  userId: string;
  startAt: string;
  endAt: string | null;
  note: string | null;
};

export type PaginationResult = {
  page: number;
  prevPage: number | null;
  nextPage: number | null;
  totalPages: number;
  totalRecords: number;
};

export type RootParamList = OnboardingStackParamList & AppStackParamList;
