export type SessionUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  role?: string | null;
  createdAt: string;
  updatedAt: string;
  banExpires?: string | null;
};

export type SessionPayload = {
  session: {
    id: string;
    expiresAt: string;
    token: string;
    createdAt: string;
    updatedAt: string;
    ipAddress: string;
    userAgent: string;
    userId: string;
  };
  user: SessionUser;
};

export type PaginationResult = {
  page: number;
  prevPage: number | null;
  nextPage: number | null;
  totalPages: number;
  totalRecords: number;
};

export type PaginatedResponse<T> = {
  rows: T[];
  total: number;
  pagination: PaginationResult;
};

export type AdminOverview = {
  totalUsers: number;
  totalMeals: number;
  totalSleepEntries: number;
  totalWorkouts: number;
  totalWorkoutTemplates: number;
  activeSleepEntries: number;
};

export type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginMethod: string | null;
  finishedOnboarding: boolean;
  lastSessionAt: string | null;
};

export type UserProfileBundle = {
  user: AdminUserSummary;
  profile: {
    user_id: string;
    date_of_birth: string | null;
    sex: "M" | "F" | null;
    current_activity_factor: number;
    current_bmr_calories: number | null;
    default_weight_unit_id: number | null;
    default_length_unit_id: number | null;
    finished_onboarding: boolean;
  } | null;
  goals: {
    user_id: string;
    daily_steps_goal: number | null;
    bedtime_goal: string | null;
    wakeup_goal: string | null;
    daily_protein_goal_grams: number | null;
    daily_fat_goal_grams: number | null;
    daily_carbs_goal_grams: number | null;
    target_weight_grams: number | null;
    target_weight_date: string | null;
  } | null;
  latestWeight: {
    id: string;
    user_id: string;
    measured_at: string;
    weight_grams: number;
    body_fat_percentage: number | null;
    lean_tissue_percentage: number | null;
    water_percentage: number | null;
    bone_mass_percentage: number | null;
  } | null;
  latestHeight: {
    id: string;
    user_id: string;
    measured_at: string;
    height_cm: number;
  } | null;
  latestBloodPressure: {
    id: string;
    user_id: string;
    measured_at: string;
    systolic_mmhg: number;
    diastolic_mmhg: number;
  } | null;
  latestHeartRate: {
    id: string;
    user_id: string;
    measured_at: string;
    bpm: number;
  } | null;
};

export type MealListItem = {
  userMeal: {
    id: string;
    user_id: string;
    eaten_at: string;
    name: string;
  };
  userFoods: Array<{
    id: string;
    user_meal_id: string;
    food_id: number;
    total_grams: number;
    quantity: number;
    portion_id?: number | null;
    description?: string | null;
  }>;
};

export type SleepEntry = {
  id: string;
  user_id: string;
  sleep_start: string;
  sleep_end: string | null;
  note: string | null;
};

export type WorkoutListItem = {
  workout: {
    id: string;
    user_id: string;
    workout_template_id: string | null;
    start_date: string;
    end_date: string | null;
    label: string[] | null;
    notes: string | null;
  };
  sets: Array<{
    id: string;
    workout_id: string;
    exercise_id: string;
    seq_number: number;
    weight: number | null;
    weight_unit_id: number | null;
    repetitions: number;
    rir: number | null;
    rest_time: string | null;
    notes: string | null;
    style_id: string | null;
    set_type_id: string | null;
  }>;
};

export type WorkoutTemplateListItem = {
  workoutTemplate: {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    label: string[] | null;
    created_at: string;
    updated_at: string;
  };
  sets: Array<{
    id: string;
    workout_template_id: string;
    exercise_id: string;
    seq_number: number;
    repetitions: number | null;
    rir: number | null;
    rest_time: string | null;
    notes: string | null;
    style_id: string | null;
    set_type_id: string | null;
  }>;
};

export type LogEntry = {
  id: number | string;
  level: string;
  message: string;
  context: string;
  created_at: string;
  meta?: Record<string, unknown> | null;
};
