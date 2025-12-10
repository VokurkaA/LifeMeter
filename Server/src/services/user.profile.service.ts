import {pool} from "@/config/db.config";
import type {
    ActivityLevel,
    LengthUnit,
    UserGoal,
    UserHeightLog,
    UserProfile,
    UserWeightLog,
    WeightUnit
} from "@/types/user.profile.types";

class UserProfileService {

    async getActivityLevels(): Promise<ActivityLevel[]> {
        const query = `SELECT id, name, description, min_factor, max_factor
                       FROM activity_level
                       ORDER BY min_factor`;
        const result = await pool.query<ActivityLevel>(query);
        return result.rows;
    }

    async getLengthUnits(): Promise<LengthUnit[]> {
        const query = `SELECT id, name, meter_conversion_factor
                       FROM length_unit
                       ORDER BY id`;
        const result = await pool.query<LengthUnit>(query);
        return result.rows;
    }

    async getWeightUnits(): Promise<WeightUnit[]> {
        const query = `SELECT id, name, gram_conversion_factor
                       FROM weight_unit
                       ORDER BY id`;
        const result = await pool.query<WeightUnit>(query);
        return result.rows;
    }


    async getProfile(userId: string): Promise<UserProfile | null> {
        const query = `SELECT user_id,
                              date_of_birth,
                              sex,
                              current_activity_factor,
                              current_bmr_calories,
                              default_weight_unit_id,
                              default_length_unit_id,
                              finished_onboarding
                       FROM user_profile
                       WHERE user_id = $1`;
        const result = await pool.query<UserProfile>(query, [userId]);
        return result.rows[0] || null;
    }

    async upsertProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
        const columns = ['user_id'];
        const values: any[] = [userId];
        const updateSets: string[] = [];

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                columns.push(key);
                values.push(value);
                updateSets.push(`${key} = EXCLUDED.${key}`);
            }
        });

        const query = `
            INSERT INTO user_profile (${columns.join(', ')})
            VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
            ON CONFLICT (user_id) DO UPDATE
                SET ${updateSets.join(', ')}
            RETURNING *
        `;

        const result = await pool.query<UserProfile>(query, values);
        return result.rows[0];
    }


    async getGoals(userId: string): Promise<UserGoal | null> {
        const query = `SELECT user_id,
                              daily_steps_goal,
                              bedtime_goal,
                              wakeup_goal,
                              daily_protein_goal_grams,
                              daily_fat_goal_grams,
                              daily_carbs_goal_grams,
                              target_weight_grams,
                              target_weight_date
                       FROM user_goal
                       WHERE user_id = $1`;
        const result = await pool.query<UserGoal>(query, [userId]);
        return result.rows[0] || null;
    }

    async upsertGoals(userId: string, data: Partial<UserGoal>): Promise<UserGoal> {
        const columns = ['user_id'];
        const values: any[] = [userId];
        const updateSets: string[] = [];

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                columns.push(key);
                values.push(value);
                updateSets.push(`${key} = EXCLUDED.${key}`);
            }
        });

        const query = `
            INSERT INTO user_goal (${columns.join(', ')})
            VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
            ON CONFLICT (user_id) DO UPDATE
                SET ${updateSets.join(', ')}
            RETURNING *
        `;

        const result = await pool.query<UserGoal>(query, values);
        return result.rows[0];
    }


    async logWeight(userId: string, data: Omit<UserWeightLog, 'id' | 'user_id'>): Promise<UserWeightLog> {
        const query = `
            INSERT INTO user_weight_log (user_id, measured_at, weight_grams, body_fat_percentage,
                                         lean_tissue_percentage, water_percentage, bone_mass_percentage)
            VALUES ($1, COALESCE($2, NOW()), $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [userId, data.measured_at || null, data.weight_grams, data.body_fat_percentage ?? null, data.lean_tissue_percentage ?? null, data.water_percentage ?? null, data.bone_mass_percentage ?? null];
        const result = await pool.query<UserWeightLog>(query, values);
        return result.rows[0];
    }

    async getLatestWeight(userId: string): Promise<UserWeightLog | null> {
        const query = `SELECT id,
                              user_id,
                              measured_at,
                              weight_grams,
                              body_fat_percentage,
                              lean_tissue_percentage,
                              water_percentage,
                              bone_mass_percentage
                       FROM user_weight_log
                       WHERE user_id = $1
                       ORDER BY measured_at DESC
                       LIMIT 1`;
        const result = await pool.query<UserWeightLog>(query, [userId]);
        return result.rows[0] || null;
    }

    async logHeight(userId: string, data: Omit<UserHeightLog, 'id' | 'user_id'>): Promise<UserHeightLog> {
        const query = `
            INSERT INTO user_height_log (user_id, measured_at, height_cm)
            VALUES ($1, COALESCE($2, NOW()), $3)
            RETURNING *
        `;
        const values = [userId, data.measured_at || null, data.height_cm];
        const result = await pool.query<UserHeightLog>(query, values);
        return result.rows[0];
    }

    async getLatestHeight(userId: string): Promise<UserHeightLog | null> {
        const query = `SELECT id, user_id, measured_at, height_cm
                       FROM user_height_log
                       WHERE user_id = $1
                       ORDER BY measured_at DESC
                       LIMIT 1`;
        const result = await pool.query<UserHeightLog>(query, [userId]);
        return result.rows[0] || null;
    }
}

export const userProfileService = new UserProfileService();