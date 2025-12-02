export interface WorkoutTemplate {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    label: string[] | null;
    created_at: string;
    updated_at: string;
}

export interface TemplateWorkoutSet {
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
}

export interface InputTemplateWorkoutSet {
    exercise_id: string;
    seq_number: number;
    repetitions?: number | null;
    rir?: number | null;
    rest_time?: string | null;
    notes?: string | null;
    style_id?: string | null;
    set_type_id?: string | null;
}

export interface FullWorkoutTemplate {
    workoutTemplate: WorkoutTemplate;
    sets: TemplateWorkoutSet[];
}

export interface Workout {
    id: string;
    user_id: string;
    workout_template_id: string | null;
    start_date: string;
    end_date: string | null;
    label: string[] | null;
    notes: string | null;
}

export interface WorkoutSet {
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
}

export interface InputWorkoutSet {
    exercise_id: string;
    seq_number: number;
    weight?: number | null;
    weight_unit_id?: number | null;
    repetitions: number;
    rir?: number | null;
    rest_time?: string | null;
    notes?: string | null;
    style_id?: string | null;
    set_type_id?: string | null;
}

export interface FullWorkout {
    workout: Workout;
    sets: WorkoutSet[];
}

export type Exercise = {
    id: string;
    type: string;
    variant: string;
};

export type WeightUnit = {
    id: number;
    name: string;
    gram_conversion_factor: number;
};

export type SetStyle = {
    id: string;
    name: string;
};

export type SetType = {
    id: string;
    name: string;
};