export interface LengthUnit {
    id: number;
    name: string;
    meter_conversion_factor: number;
}

export interface ActivityLevel {
    id: number;
    name: string;
    description: string | null;
    min_factor: number;
    max_factor: number;
}

export interface WeightUnit {
    id: number;
    name: string;
    gram_conversion_factor: number;
}

export interface UserProfile {
    user_id: string;
    date_of_birth: string | Date | null;
    sex: 'M' | 'F' | null;
    current_activity_factor: number;
    current_bmr_calories: number | null;
    default_weight_unit_id: number | null;
    default_length_unit_id: number | null;
    finished_onboarding: boolean;
}

export interface UserGoal {
    user_id: string;
    daily_steps_goal: number | null;
    bedtime_goal: string | null;
    wakeup_goal: string | null;
    daily_protein_goal_grams: number | null;
    daily_fat_goal_grams: number | null;
    daily_carbs_goal_grams: number | null;
    target_weight_grams: number | null;
    target_weight_date: string | Date | null;
}

export interface UserWeightLog {
    id: string;
    user_id: string;
    measured_at: string | Date;
    weight_grams: number;
    body_fat_percentage: number | null;
    lean_tissue_percentage: number | null;
    water_percentage: number | null;
    bone_mass_percentage: number | null;
}

export interface UserHeightLog {
    id: string;
    user_id: string;
    measured_at: string | Date;
    height_cm: number;
}