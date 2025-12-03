export interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  seqNumber: number;
  weight?: number;
  weightUnitId?: string;
  repetitions: number;
  rir?: number;
  restTime?: string;
  notes?: string;
  styleId?: string;
  setTypeId?: string;
}

export interface TemplateWorkoutSet {
  id: string;
  workoutTemplateId: string;
  exerciseId: string;
  seqNumber: number;
  repetitions?: number;
  rir?: number;
  restTime?: string;
  notes?: string;
  styleId?: string;
  setTypeId?: string;
}
export interface Workout {
  id: string;
  userId: string;
  workoutTemplateId?: string;
  startDate: string;
  endDate?: string;
  label?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  label?: string[];
  createdAt?: string;
  updatedAt?: string;
}
export interface FullWorkout extends Omit<Workout, 'createdAt' | 'updatedAt'> {
  sets: WorkoutSet[];
  createdAt?: string;
  updatedAt?: string;
}
export interface FullWorkoutTemplate extends Omit<WorkoutTemplate, 'createdAt' | 'updatedAt'> {
  sets: TemplateWorkoutSet[];
  createdAt?: string;
  updatedAt?: string;
}
export interface InputTemplateWorkoutSet {
  id?: string;
  exercise_id: string;
  seq_number: number;
  repetitions?: number | null;
  rir?: number | null;
  rest_time?: string | null;
  notes?: string | null;
  style_id?: string | null;
  set_type_id?: string | null;
}
export interface InputWorkoutSet {
  id?: string;
  exercise_id: string;
  seq_number: number;
  weight?: number | null;
  weight_unit_id?: string | null;
  repetitions: number;
  rir?: number | null;
  rest_time?: string | null;
  notes?: string | null;
  style_id?: string | null;
  set_type_id?: string | null;
}

export type ServerPaginatedResponse<T> = {
  rows: T[];
  total: number;
};

export type ServerWorkoutSet = {
  id?: string;
  workout_id?: string;
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
};

export type ServerTemplateSet = {
  id?: string;
  workout_template_id?: string;
  exercise_id: string;
  seq_number: number;
  repetitions?: number | null;
  rir?: number | null;
  rest_time?: string | null;
  notes?: string | null;
  style_id?: string | null;
  set_type_id?: string | null;
};

export type ServerFullWorkout = {
  workout: {
    id: string;
    user_id: string;
    workout_template_id?: string | null;
    start_date: string;
    end_date?: string | null;
    label?: string[] | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  sets: ServerWorkoutSet[];
};

export type ServerFullWorkoutTemplate = {
  workoutTemplate: {
    id: string;
    user_id: string;
    name: string;
    description?: string | null;
    label?: string[] | null;
    created_at?: string;
    updated_at?: string;
  };
  sets: ServerTemplateSet[];
};

export type Exercise = {
  id: string;
  type: string;
  variant: string;
};

export type WeightUnit = {
  id: number;
  name: string;
  gramConversionFactor: number;
};

export type SetStyle = {
  id: string;
  name: string;
};

export type SetType = {
  id: string;
  name: string;
};
