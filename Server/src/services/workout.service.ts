import type {
    Exercise,
    FullWorkout,
    FullWorkoutTemplate,
    InputTemplateWorkoutSet,
    InputWorkoutSet,
    SetStyle,
    SetType,
    TemplateWorkoutSet,
    WeightUnit,
    Workout,
    WorkoutTemplate
} from "@/types/workout.types";
import type {CountRow, PaginatedResult, PaginationProps} from "@/types/pagination.types";
import {pool} from "@/config/db.config";

class WorkoutService {
    async getUserWorkoutTemplateById(userId: string, templateId: string): Promise<FullWorkoutTemplate> {
        const query = `
            SELECT to_jsonb(wt.*)                as "workoutTemplate",
                   COALESCE(s.data, '[]'::jsonb) as "sets"
            FROM workout_template wt
                     LEFT JOIN LATERAL (
                SELECT jsonb_agg(tws.* ORDER BY tws.seq_number) as data
                FROM template_workout_set tws
                WHERE tws.workout_template_id = wt.id
                ) s ON true
            WHERE wt.user_id = $1
              AND wt.id = $2
        `;
        const {rows} = await pool.query<{
            workoutTemplate: WorkoutTemplate; sets: TemplateWorkoutSet[]
        }>(query, [userId, templateId]);
        if (rows.length === 0) throw new Error("Workout template not found");
        return rows[0];
    }

    async getAllUserWorkoutTemplates(userId: string, paginationProps: PaginationProps): Promise<PaginatedResult<FullWorkoutTemplate>> {
        const {limit, offset} = paginationProps;

        const countQuery = `SELECT COUNT(id)::text AS total
                            FROM workout_template
                            WHERE user_id = $1`;

        const dataQuery = `
            SELECT to_jsonb(wt.*)                as "workoutTemplate",
                   COALESCE(s.data, '[]'::jsonb) as "sets"
            FROM workout_template wt
                     LEFT JOIN LATERAL (
                SELECT jsonb_agg(tws.* ORDER BY tws.seq_number) as data
                FROM template_workout_set tws
                WHERE tws.workout_template_id = wt.id
                ) s ON true
            WHERE wt.user_id = $1
            ORDER BY wt.updated_at DESC
            LIMIT $2 OFFSET $3
        `;

        const [countResult, dataResult] = await Promise.all([pool.query<CountRow>(countQuery, [userId]), pool.query<FullWorkoutTemplate>(dataQuery, [userId, limit, offset])]);

        return {rows: dataResult.rows, total: this.parseTotal(countResult.rows[0]?.total)};
    }

    async addUserWorkoutTemplate(userId: string, data: {
        name: string; description?: string | null; label?: string[] | null; sets: InputTemplateWorkoutSet[];
    }): Promise<FullWorkoutTemplate> {
        const templateQuery = `
            INSERT INTO workout_template (user_id, name, description, label)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const templateRes = await pool.query<WorkoutTemplate>(templateQuery, [userId, data.name, data.description ?? null, data.label ?? null]);
        const template = templateRes.rows[0];

        if (data.sets && data.sets.length > 0) {
            const values: any[] = [];
            const placeholders: string[] = [];
            let p = 1;

            for (const set of data.sets) {
                placeholders.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
                values.push(template.id, set.exercise_id, set.seq_number, set.repetitions ?? null, set.rir ?? null, set.rest_time ?? null, set.notes ?? null, set.style_id ?? null, set.set_type_id ?? null);
            }

            const setQuery = `
                INSERT INTO template_workout_set
                (workout_template_id, exercise_id, seq_number, repetitions, rir, rest_time, notes, style_id,
                 set_type_id) VALUES ${placeholders.join(", ")}
            `;
            await pool.query(setQuery, values);
        }

        return this.getUserWorkoutTemplateById(userId, template.id);
    }

    async updateUserWorkoutTemplate(userId: string, templateId: string, data: {
        name?: string; description?: string | null; label?: string[] | null; sets?: InputTemplateWorkoutSet[];
    }): Promise<FullWorkoutTemplate> {
        await this.getUserWorkoutTemplateById(userId, templateId);

        if (data.name !== undefined || data.description !== undefined || data.label !== undefined) {
            const updateQuery = `
                UPDATE workout_template
                SET name        = COALESCE($3, name),
                    description = COALESCE($4, description),
                    label       = COALESCE($5, label),
                    updated_at  = now()
                WHERE id = $1
                  AND user_id = $2
            `;
            await pool.query(updateQuery, [templateId, userId, data.name, data.description, data.label]);
        }

        if (data.sets !== undefined) {
            await pool.query(`DELETE
                              FROM template_workout_set
                              WHERE workout_template_id = $1`, [templateId]);

            if (data.sets.length > 0) {
                const values: any[] = [];
                const placeholders: string[] = [];
                let p = 1;

                for (const set of data.sets) {
                    placeholders.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
                    values.push(templateId, set.exercise_id, set.seq_number, set.repetitions ?? null, set.rir ?? null, set.rest_time ?? null, set.notes ?? null, set.style_id ?? null, set.set_type_id ?? null);
                }

                const insertQuery = `
                    INSERT INTO template_workout_set
                    (workout_template_id, exercise_id, seq_number, repetitions, rir, rest_time, notes, style_id,
                     set_type_id) VALUES ${placeholders.join(", ")}
                `;
                await pool.query(insertQuery, values);
            }
        }

        return this.getUserWorkoutTemplateById(userId, templateId);
    }

    async deleteUserWorkoutTemplate(userId: string, templateId: string): Promise<void> {
        const query = `DELETE
                       FROM workout_template
                       WHERE id = $1
                         AND user_id = $2`;
        const result = await pool.query(query, [templateId, userId]);
        if (result.rowCount === 0) {
            throw new Error("Workout template not found");
        }
    }

    async getUserWorkoutById(userId: string, workoutId: string): Promise<FullWorkout> {
        const query = `
            SELECT to_jsonb(w.*)                 as "workout",
                   COALESCE(s.data, '[]'::jsonb) as "sets"
            FROM workout w
                     LEFT JOIN LATERAL (
                SELECT jsonb_agg(ws.* ORDER BY ws.seq_number) as data
                FROM workout_set ws
                WHERE ws.workout_id = w.id
                ) s ON true
            WHERE w.user_id = $1
              AND w.id = $2
        `;
        const {rows} = await pool.query<FullWorkout>(query, [userId, workoutId]);
        if (rows.length === 0) throw new Error("Workout not found");
        return rows[0];
    }

    async getAllUserWorkouts(userId: string, paginationProps: PaginationProps): Promise<PaginatedResult<FullWorkout>> {
        const {limit, offset} = paginationProps;

        const countQuery = `SELECT COUNT(id)::text AS total
                            FROM workout
                            WHERE user_id = $1`;

        const dataQuery = `
            SELECT to_jsonb(w.*)                 as "workout",
                   COALESCE(s.data, '[]'::jsonb) as "sets"
            FROM workout w
                     LEFT JOIN LATERAL (
                SELECT jsonb_agg(ws.* ORDER BY ws.seq_number) as data
                FROM workout_set ws
                WHERE ws.workout_id = w.id
                ) s ON true
            WHERE w.user_id = $1
            ORDER BY w.start_date DESC
            LIMIT $2 OFFSET $3
        `;

        const [countResult, dataResult] = await Promise.all([pool.query<CountRow>(countQuery, [userId]), pool.query<FullWorkout>(dataQuery, [userId, limit, offset])]);

        return {rows: dataResult.rows, total: this.parseTotal(countResult.rows[0]?.total)};
    }

    async addUserWorkout(userId: string, data: {
        workout_template_id?: string | null;
        start_date: string;
        end_date?: string | null;
        label?: string[] | null;
        notes?: string | null;
        sets: InputWorkoutSet[];
    }): Promise<FullWorkout> {
        const workoutQuery = `
            INSERT INTO workout (user_id, workout_template_id, start_date, end_date, label, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const workoutRes = await pool.query<Workout>(workoutQuery, [userId, data.workout_template_id ?? null, data.start_date, data.end_date ?? null, data.label ?? null, data.notes ?? null]);
        const workout = workoutRes.rows[0];

        if (data.sets && data.sets.length > 0) {
            const values: any[] = [];
            const placeholders: string[] = [];
            let p = 1;

            for (const set of data.sets) {
                placeholders.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
                values.push(workout.id, set.exercise_id, set.seq_number, set.weight ?? null, set.weight_unit_id ?? null, set.repetitions, set.rir ?? null, set.rest_time ?? null, set.notes ?? null, set.style_id ?? null, set.set_type_id ?? null);
            }

            const setQuery = `
                INSERT INTO workout_set
                (workout_id, exercise_id, seq_number, weight, weight_unit_id, repetitions, rir, rest_time, notes,
                 style_id, set_type_id) VALUES ${placeholders.join(", ")}
            `;
            await pool.query(setQuery, values);
        }

        return this.getUserWorkoutById(userId, workout.id);
    }

    async updateUserWorkout(userId: string, workoutId: string, data: {
        start_date?: string;
        end_date?: string | null;
        label?: string[] | null;
        notes?: string | null;
        sets?: InputWorkoutSet[];
    }): Promise<FullWorkout> {
        await this.getUserWorkoutById(userId, workoutId);

        if (data.start_date !== undefined || data.end_date !== undefined || data.label !== undefined || data.notes !== undefined) {
            const updateQuery = `
                UPDATE workout
                SET start_date = COALESCE($3, start_date),
                    end_date   = COALESCE($4, end_date),
                    label      = COALESCE($5, label),
                    notes      = COALESCE($6, notes)
                WHERE id = $1
                  AND user_id = $2
            `;
            await pool.query(updateQuery, [workoutId, userId, data.start_date, data.end_date, data.label, data.notes]);
        }

        if (data.sets !== undefined) {
            await pool.query(`DELETE
                              FROM workout_set
                              WHERE workout_id = $1`, [workoutId]);

            if (data.sets.length > 0) {
                const values: any[] = [];
                const placeholders: string[] = [];
                let p = 1;

                for (const set of data.sets) {
                    placeholders.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
                    values.push(workoutId, set.exercise_id, set.seq_number, set.weight ?? null, set.weight_unit_id ?? null, set.repetitions, set.rir ?? null, set.rest_time ?? null, set.notes ?? null, set.style_id ?? null, set.set_type_id ?? null);
                }

                const insertQuery = `
                    INSERT INTO workout_set
                    (workout_id, exercise_id, seq_number, weight, weight_unit_id, repetitions, rir, rest_time, notes,
                     style_id, set_type_id) VALUES ${placeholders.join(", ")}
                `;
                await pool.query(insertQuery, values);
            }
        }

        return this.getUserWorkoutById(userId, workoutId);
    }

    async deleteUserWorkout(userId: string, workoutId: string): Promise<void> {
        const exists = await pool.query('SELECT id FROM workout WHERE id = $1 AND user_id = $2', [workoutId, userId]);
        if (exists.rowCount === 0) {
            throw new Error("Workout not found");
        }
        await pool.query('DELETE FROM workout_set WHERE workout_id = $1', [workoutId]);
        await pool.query('DELETE FROM workout WHERE id = $1', [workoutId]);
    }

    async getExercises(): Promise<Exercise[]> {
        const query = `
            SELECT e.id,
                   et.name AS type,
                   ev.name AS variant
            FROM exercise e
                     JOIN exercise_type et
                          ON e.exercise_type_id = et.id
                     JOIN exercise_variant ev
                          ON e.exercise_variant_id = ev.id;
        `
        const result = await pool.query(query);
        return result.rows;
    }

    async getWeightOptions(): Promise<WeightUnit[]> {
        const query = `
            SELECT id,
                   name,
                   gram_conversion_factor::float as gram_conversion_factor
            FROM weight_unit
            ORDER BY id;
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    async getSetStyles(): Promise<SetStyle[]> {
        const query = `
            SELECT id, name
            FROM set_style
            ORDER BY name;
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    async getSetTypes(): Promise<SetType[]> {
        const query = `
            SELECT id, name
            FROM set_type
            ORDER BY name;
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    private parseTotal(value?: string): number {
        const num = parseInt(value ?? "0", 10);
        return Number.isNaN(num) || num < 0 ? 0 : num;
    }
}

export const workoutService = new WorkoutService();