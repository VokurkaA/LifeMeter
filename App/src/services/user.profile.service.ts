import { request } from '@/lib/net';
import {
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
  WeightUnit,
} from '@/types/user.profile.types';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000') + '/api/user/data';

interface ServerUserProfile {
  user_id: string;
  date_of_birth: string | null;
  sex: 'M' | 'F' | null;
  current_activity_factor: number;
  current_bmr_calories: number | null;
  default_weight_unit_id: number | null;
  default_length_unit_id: number | null;
  finished_onboarding: boolean;
}

interface ServerUserGoal {
  user_id: string;
  daily_steps_goal: number | null;
  bedtime_goal: string | null;
  wakeup_goal: string | null;
  daily_protein_goal_grams: number | null;
  daily_fat_goal_grams: number | null;
  daily_carbs_goal_grams: number | null;
  target_weight_grams: number | null;
  target_weight_date: string | null;
}

interface ServerWeightLog {
  id: string;
  user_id: string;
  measured_at: string;
  weight_grams: number;
  body_fat_percentage: number | null;
  lean_tissue_percentage: number | null;
  water_percentage: number | null;
  bone_mass_percentage: number | null;
}

const mapProfileToClient = (server: ServerUserProfile): UserProfile => ({
  userId: server.user_id,
  dateOfBirth: server.date_of_birth,
  sex: server.sex,
  currentActivityFactor: server.current_activity_factor,
  currentBmrCalories: server.current_bmr_calories,
  defaultWeightUnitId: server.default_weight_unit_id,
  defaultLengthUnitId: server.default_length_unit_id,
  finishedOnboarding: server.finished_onboarding,
});

const mapGoalToClient = (server: ServerUserGoal): UserGoal => ({
  userId: server.user_id,
  dailyStepsGoal: server.daily_steps_goal,
  bedtimeGoal: server.bedtime_goal,
  wakeupGoal: server.wakeup_goal,
  dailyProteinGoalGrams: server.daily_protein_goal_grams,
  dailyFatGoalGrams: server.daily_fat_goal_grams,
  dailyCarbsGoalGrams: server.daily_carbs_goal_grams,
  targetWeightGrams: server.target_weight_grams,
  targetWeightDate: server.target_weight_date,
});

const mapWeightLogToClient = (server: ServerWeightLog): UserWeightLog => ({
  id: server.id,
  userId: server.user_id,
  measuredAt: server.measured_at,
  weightGrams: server.weight_grams,
  bodyFatPercentage: server.body_fat_percentage,
  leanTissuePercentage: server.lean_tissue_percentage,
  waterPercentage: server.water_percentage,
  boneMassPercentage: server.bone_mass_percentage,
});

const mapHeightLogToClient = (server: any): UserHeightLog => ({
  id: server.id,
  userId: server.user_id,
  measuredAt: server.measured_at,
  heightCm: server.height_cm,
});

export const userProfileService = {
  getActivityLevels: async (): Promise<ActivityLevel[]> => {
    const data = await request<any[]>(`${BASE_URL}/reference/activity-levels`, {
      method: 'GET',
    });
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      minFactor: item.min_factor,
      maxFactor: item.max_factor,
    }));
  },

  getLengthUnits: async (): Promise<LengthUnit[]> => {
    const data = await request<any[]>(`${BASE_URL}/reference/length-units`, {
      method: 'GET',
    });
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      meterConversionFactor: item.meter_conversion_factor,
    }));
  },

  getWeightUnits: async (): Promise<WeightUnit[]> => {
    const data = await request<any[]>(`${BASE_URL}/reference/weight-units`, {
      method: 'GET',
    });
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      gramConversionFactor: item.gram_conversion_factor,
    }));
  },

  getProfile: async (): Promise<UserProfile | null> => {
    const data = await request<ServerUserProfile>(`${BASE_URL}/profile`, { method: 'GET' });
    if (!data || Object.keys(data).length === 0) return null;
    return mapProfileToClient(data);
  },

  updateProfile: async (data: UpdateProfileInput): Promise<UserProfile> => {
    const payload = {
      date_of_birth: data.dateOfBirth,
      sex: data.sex,
      current_activity_factor: data.currentActivityFactor,
      current_bmr_calories: data.currentBmrCalories,
      default_weight_unit_id: data.defaultWeightUnitId,
      default_length_unit_id: data.defaultLengthUnitId,
      finished_onboarding: data.finishedOnboarding, 
    };

    const response = await request<ServerUserProfile>(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return mapProfileToClient(response);
  },

  getGoals: async (): Promise<UserGoal | null> => {
    const data = await request<ServerUserGoal>(`${BASE_URL}/goals`, { method: 'GET' });
    if (!data || Object.keys(data).length === 0) return null;
    return mapGoalToClient(data);
  },

  updateGoals: async (data: UpdateGoalInput): Promise<UserGoal> => {
    const payload = {
      daily_steps_goal: data.dailyStepsGoal,
      bedtime_goal: data.bedtimeGoal,
      wakeup_goal: data.wakeupGoal,
      daily_protein_goal_grams: data.dailyProteinGoalGrams,
      daily_fat_goal_grams: data.dailyFatGoalGrams,
      daily_carbs_goal_grams: data.dailyCarbsGoalGrams,
      target_weight_grams: data.targetWeightGrams,
      target_weight_date: data.targetWeightDate,
    };

    const response = await request<ServerUserGoal>(`${BASE_URL}/goals`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return mapGoalToClient(response);
  },

  logWeight: async (data: LogWeightInput): Promise<UserWeightLog> => {
    const payload = {
      measured_at: data.measuredAt,
      weight_grams: data.weightGrams,
      body_fat_percentage: data.bodyFatPercentage,
      lean_tissue_percentage: data.leanTissuePercentage,
      water_percentage: data.waterPercentage,
      bone_mass_percentage: data.boneMassPercentage,
    };

    const response = await request<ServerWeightLog>(`${BASE_URL}/log/weight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return mapWeightLogToClient(response);
  },

  getLatestWeight: async (): Promise<UserWeightLog | null> => {
    const response = await request<ServerWeightLog | null>(`${BASE_URL}/log/weight/latest`, {
      method: 'GET',
    });
    if (!response) return null;
    return mapWeightLogToClient(response);
  },

  logHeight: async (data: LogHeightInput): Promise<UserHeightLog> => {
    const payload = {
      measured_at: data.measuredAt,
      height_cm: data.heightCm,
    };

    const response = await request<any>(`${BASE_URL}/log/height`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return mapHeightLogToClient(response);
  },
};