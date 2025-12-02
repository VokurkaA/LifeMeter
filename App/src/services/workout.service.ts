import { request } from '@/lib/net';
import type {
  Exercise,
  FullWorkout,
  FullWorkoutTemplate,
  ServerFullWorkout,
  ServerFullWorkoutTemplate,
  ServerPaginatedResponse,
  ServerTemplateSet,
  ServerWorkoutSet,
  SetStyle,
  SetType,
  TemplateWorkoutSet,
  WeightUnit,
  WorkoutSet,
} from '@/types/workout.types';

class WorkoutService {
  private baseUrl =
    (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/user/workout';
  private templateUrl =
    (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/user/template/workout';
  private basicUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/workout';
  async getAllUserWorkouts(): Promise<FullWorkout[]> {
    return request<ServerPaginatedResponse<ServerFullWorkout>>(this.baseUrl + '/').then((res) =>
      res.rows.map(this.toClientWorkout),
    );
  }

  async getUserWorkoutById(id: string): Promise<FullWorkout | null> {
    return request<ServerFullWorkout>(`${this.baseUrl}/${encodeURIComponent(id)}`).then(
      this.toClientWorkout,
    );
  }

  async addUserWorkout(fullWorkout: FullWorkout): Promise<FullWorkout> {
    const body = {
      workout_template_id: fullWorkout.workoutTemplateId ?? null,
      start_date: fullWorkout.startDate || new Date().toISOString(),
      end_date: fullWorkout.endDate ?? null,
      label: fullWorkout.label ?? null,
      notes: fullWorkout.notes ?? null,
      sets: fullWorkout.sets.map(this.toServerWorkoutSet),
    };

    return request<ServerFullWorkout>(this.baseUrl + '/', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(this.toClientWorkout);
  }

  async editUserWorkout(id: string, fullWorkout: FullWorkout): Promise<FullWorkout> {
    const body = {
      start_date: fullWorkout.startDate,
      end_date: fullWorkout.endDate,
      label: fullWorkout.label,
      notes: fullWorkout.notes,
      sets: fullWorkout.sets.map(this.toServerWorkoutSet),
    };

    return request<ServerFullWorkout>(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then(this.toClientWorkout);
  }

  async deleteUserWorkout(id: string): Promise<void> {
    await request<void>(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async getAllUserWorkoutTemplates(): Promise<FullWorkoutTemplate[]> {
    const query = '?limit=100&offset=0';
    return request<ServerPaginatedResponse<ServerFullWorkoutTemplate>>(
      this.templateUrl + '/' + query,
    ).then((res) => res.rows.map(this.toClientTemplate));
  }

  async getUserWorkoutTemplateById(id: string): Promise<FullWorkoutTemplate | null> {
    return request<ServerFullWorkoutTemplate>(`${this.templateUrl}/${encodeURIComponent(id)}`).then(
      this.toClientTemplate,
    );
  }

  async addUserWorkoutTemplate(
    fullWorkoutTemplate: FullWorkoutTemplate,
  ): Promise<FullWorkoutTemplate> {
    const body = {
      name: fullWorkoutTemplate.name,
      description: fullWorkoutTemplate.description ?? null,
      label: fullWorkoutTemplate.label ?? null,
      sets: fullWorkoutTemplate.sets.map(this.toServerTemplateSet),
    };

    return request<ServerFullWorkoutTemplate>(this.templateUrl + '/', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(this.toClientTemplate);
  }

  async editUserWorkoutTemplate(
    id: string,
    fullWorkoutTemplate: FullWorkoutTemplate,
  ): Promise<FullWorkoutTemplate> {
    const body = {
      name: fullWorkoutTemplate.name,
      description: fullWorkoutTemplate.description,
      label: fullWorkoutTemplate.label,
      sets: fullWorkoutTemplate.sets.map(this.toServerTemplateSet),
    };

    return request<ServerFullWorkoutTemplate>(`${this.templateUrl}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then(this.toClientTemplate);
  }

  async deleteUserWorkoutTemplate(id: string): Promise<void> {
    await request<void>(`${this.templateUrl}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async getExercises(): Promise<Exercise[]> {
    return await request<Exercise[]>(`${this.basicUrl}/exercises`, {
      method: 'GET'
    })

  }
  async getWeightOptions(): Promise<WeightUnit[]> {
    return await request<WeightUnit[]>(`${this.basicUrl}/weight-options`, {
      method: 'GET'
    })
  }
  async getSetStyles(): Promise<SetStyle[]> {
    return await request<SetStyle[]>(`${this.basicUrl}/set-styles`, {
      method: 'GET'
    })
  }
  async getSetTypes(): Promise<SetType[]> {
    return await request<SetType[]>(`${this.basicUrl}/set-types`, {
      method: 'GET'
    })
  }

  private toClientWorkout = (serverData: ServerFullWorkout): FullWorkout => {
    const { workout, sets } = serverData;
    return {
      id: workout.id,
      userId: workout.user_id,
      workoutTemplateId: workout.workout_template_id || undefined,
      startDate: workout.start_date,
      endDate: workout.end_date || undefined,
      label: workout.label || undefined,
      notes: workout.notes || undefined,
      sets: sets.map(
        (s) =>
          ({
            id: s.id!,
            workoutId: s.workout_id!,
            exerciseId: s.exercise_id,
            seqNumber: s.seq_number,
            weight: s.weight ?? undefined,
            weightUnitId: s.weight_unit_id ?? undefined,
            repetitions: s.repetitions,
            rir: s.rir ?? undefined,
            restTime: s.rest_time ?? undefined,
            notes: s.notes ?? undefined,
            styleId: s.style_id ?? undefined,
            setTypeId: s.set_type_id ?? undefined,
          }) as WorkoutSet,
      ),
    };
  };

  private toClientTemplate = (serverData: ServerFullWorkoutTemplate): FullWorkoutTemplate => {
    const { workoutTemplate, sets } = serverData;
    return {
      id: workoutTemplate.id,
      userId: workoutTemplate.user_id,
      name: workoutTemplate.name,
      description: workoutTemplate.description || undefined,
      label: workoutTemplate.label || undefined,
      sets: sets.map(
        (s) =>
          ({
            id: s.id!,
            workoutTemplateId: s.workout_template_id!,
            exerciseId: s.exercise_id,
            seqNumber: s.seq_number,
            repetitions: s.repetitions ?? undefined,
            rir: s.rir ?? undefined,
            restTime: s.rest_time ?? undefined,
            notes: s.notes ?? undefined,
            styleId: s.style_id ?? undefined,
            setTypeId: s.set_type_id ?? undefined,
          }) as TemplateWorkoutSet,
      ),
    };
  };

  private toServerWorkoutSet = (set: WorkoutSet): ServerWorkoutSet => ({
    exercise_id: set.exerciseId,
    seq_number: set.seqNumber,
    weight: set.weight ?? null,
    weight_unit_id: set.weightUnitId ?? null,
    repetitions: set.repetitions,
    rir: set.rir ?? null,
    rest_time: set.restTime ?? null,
    notes: set.notes ?? null,
    style_id: set.styleId ?? null,
    set_type_id: set.setTypeId ?? null,
  });

  private toServerTemplateSet = (set: TemplateWorkoutSet): ServerTemplateSet => ({
    exercise_id: set.exerciseId,
    seq_number: set.seqNumber,
    repetitions: set.repetitions ?? null,
    rir: set.rir ?? null,
    rest_time: set.restTime ?? null,
    notes: set.notes ?? null,
    style_id: set.styleId ?? null,
    set_type_id: set.setTypeId ?? null,
  });
}

export const workoutService = new WorkoutService();
