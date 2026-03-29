
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

type DbNumeric = number | string;

type DbActivityLevel = Omit<ActivityLevel, "min_factor" | "max_factor"> & {
    min_factor: DbNumeric;
    max_factor: DbNumeric;
};

type DbLengthUnit = Omit<LengthUnit, "meter_conversion_factor"> & {
    meter_conversion_factor: DbNumeric;
};

type DbWeightUnit = Omit<WeightUnit, "gram_conversion_factor"> & {
    gram_conversion_factor: DbNumeric;
};

type DbUserProfile = Omit<UserProfile, "current_activity_factor"> & {
    current_activity_factor: DbNumeric;
};

type DbUserGoal = Omit<UserGoal, "target_weight_grams"> & {
    target_weight_grams: DbNumeric | null;
};

type DbUserWeightLog = Omit<
    UserWeightLog,
    "weight_grams" | "body_fat_percentage" | "lean_tissue_percentage" | "water_percentage" | "bone_mass_percentage"
> & {
    weight_grams: DbNumeric;
    body_fat_percentage: DbNumeric | null;
    lean_tissue_percentage: DbNumeric | null;
    water_percentage: DbNumeric | null;
    bone_mass_percentage: DbNumeric | null;
};

type DbUserHeightLog = Omit<UserHeightLog, "height_cm"> & {
    height_cm: DbNumeric;
};

function toNumber(value: DbNumeric): number {
    return typeof value === "number" ? value : Number(value);
}

function toNullableNumber(value: DbNumeric | null): number | null {
    if (value == null) return null;
    return toNumber(value);
}

function mapActivityLevel(row: DbActivityLevel): ActivityLevel {
    return {
        ...row,
        min_factor: toNumber(row.min_factor),
        max_factor: toNumber(row.max_factor),
    };
}

function mapLengthUnit(row: DbLengthUnit): LengthUnit {
    return {
        ...row,
        meter_conversion_factor: toNumber(row.meter_conversion_factor),
    };
}

function mapWeightUnit(row: DbWeightUnit): WeightUnit {
    return {
        ...row,
        gram_conversion_factor: toNumber(row.gram_conversion_factor),
    };
}

function mapUserProfile(row: DbUserProfile): UserProfile {
    return {
        ...row,
        current_activity_factor: toNumber(row.current_activity_factor),
    };
}

function mapUserGoal(row: DbUserGoal): UserGoal {
    return {
        ...row,
        target_weight_grams: toNullableNumber(row.target_weight_grams),
    };
}

function mapUserWeightLog(row: DbUserWeightLog): UserWeightLog {
    return {
        ...row,
        weight_grams: toNumber(row.weight_grams),
        body_fat_percentage: toNullableNumber(row.body_fat_percentage),
        lean_tissue_percentage: toNullableNumber(row.lean_tissue_percentage),
        water_percentage: toNullableNumber(row.water_percentage),
        bone_mass_percentage: toNullableNumber(row.bone_mass_percentage),
    };
}

function mapUserHeightLog(row: DbUserHeightLog): UserHeightLog {
    return {
        ...row,
        height_cm: toNumber(row.height_cm),
    };
}

class UserProfileService {

    async getActivityLevels(): Promise<ActivityLevel[]> {
        const query = `SELECT id, name, description, min_factor, max_factor
                       FROM activity_level
                       ORDER BY min_factor`;
        const result = await pool.query<DbActivityLevel>(query);
        return result.rows.map(mapActivityLevel);
    }

    async getLengthUnits(): Promise<LengthUnit[]> {
        const query = `SELECT id, name, meter_conversion_factor
                       FROM length_unit
                       ORDER BY id`;
        const result = await pool.query<DbLengthUnit>(query);
        return result.rows.map(mapLengthUnit);
    }

    async getWeightUnits(): Promise<WeightUnit[]> {
        const query = `SELECT id, name, gram_conversion_factor
                       FROM weight_unit
                       ORDER BY id`;
        const result = await pool.query<DbWeightUnit>(query);
        return result.rows.map(mapWeightUnit);
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
        const result = await pool.query<DbUserProfile>(query, [userId]);
        return result.rows[0] ? mapUserProfile(result.rows[0]) : null;
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

        const result = await pool.query<DbUserProfile>(query, values);
        return mapUserProfile(result.rows[0]);
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
        const result = await pool.query<DbUserGoal>(query, [userId]);
        return result.rows[0] ? mapUserGoal(result.rows[0]) : null;
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

        const result = await pool.query<DbUserGoal>(query, values);
        return mapUserGoal(result.rows[0]);
    }


    async logWeight(userId: string, data: Omit<UserWeightLog, 'id' | 'user_id'>): Promise<UserWeightLog> {
        const query = `
            INSERT INTO user_weight_log (user_id, measured_at, weight_grams, body_fat_percentage,
                                         lean_tissue_percentage, water_percentage, bone_mass_percentage)
            VALUES ($1, COALESCE($2, NOW()), $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [userId, data.measured_at || null, data.weight_grams, data.body_fat_percentage ?? null, data.lean_tissue_percentage ?? null, data.water_percentage ?? null, data.bone_mass_percentage ?? null];
        const result = await pool.query<DbUserWeightLog>(query, values);
        return mapUserWeightLog(result.rows[0]);
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
        const result = await pool.query<DbUserWeightLog>(query, [userId]);
        return result.rows[0] ? mapUserWeightLog(result.rows[0]) : null;
    }

    async logHeight(userId: string, data: Omit<UserHeightLog, 'id' | 'user_id'>): Promise<UserHeightLog> {
        const query = `
            INSERT INTO user_height_log (user_id, measured_at, height_cm)
            VALUES ($1, COALESCE($2, NOW()), $3)
            RETURNING *
        `;
        const values = [userId, data.measured_at || null, data.height_cm];
        const result = await pool.query<DbUserHeightLog>(query, values);
        return mapUserHeightLog(result.rows[0]);
    }

    async getLatestHeight(userId: string): Promise<UserHeightLog | null> {
        const query = `SELECT id, user_id, measured_at, height_cm
                       FROM user_height_log
                       WHERE user_id = $1
                       ORDER BY measured_at DESC
                       LIMIT 1`;
        const result = await pool.query<DbUserHeightLog>(query, [userId]);
        return result.rows[0] ? mapUserHeightLog(result.rows[0]) : null;
    }
}

export const userProfileService = new UserProfileService();
