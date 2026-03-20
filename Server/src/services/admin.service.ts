import { pool } from "@/config/db.config";
import { foodService } from "@/services/food.service";
import { userProfileService } from "@/services/user.profile.service";
import { workoutService } from "@/services/workout.service";
import type {
  AdminBloodPressureLog,
  AdminHeartRateLog,
  AdminOverview,
  AdminUserProfileBundle,
  AdminUserSummary,
} from "@/types/admin.types";
import type { CountRow, PaginationProps } from "@/types/pagination.types";
import type { SleepEntry } from "@/types/sleep.types";

class AdminService {
  async getOverview(): Promise<AdminOverview> {
    const [users, meals, sleepEntries, workouts, templates, activeSleep] =
      await Promise.all([
        this.getCount(`SELECT COUNT(id)::text AS total FROM "user"`),
        this.getCount(`SELECT COUNT(id)::text AS total FROM user_meal`),
        this.getCount(`SELECT COUNT(id)::text AS total FROM user_sleep`),
        this.getCount(`SELECT COUNT(id)::text AS total FROM workout`),
        this.getCount(`SELECT COUNT(id)::text AS total FROM workout_template`),
        this.getCount(
          `SELECT COUNT(id)::text AS total FROM user_sleep WHERE sleep_end IS NULL`,
        ),
      ]);

    return {
      totalUsers: users,
      totalMeals: meals,
      totalSleepEntries: sleepEntries,
      totalWorkouts: workouts,
      totalWorkoutTemplates: templates,
      activeSleepEntries: activeSleep,
    };
  }

  async getUsers(
    paginationProps: PaginationProps,
    query?: string,
  ): Promise<{ rows: AdminUserSummary[]; total: number }> {
    const filter = this.makeUserFilter(query);
    const params = filter.params.slice();
    const countParams = filter.params.slice();
    const { limit, offset } = paginationProps;

    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(u.id)::text AS total
      FROM "user" u
      ${filter.whereClause}
    `;

    const dataQuery = `
      SELECT u.id,
             u.name,
             u.email,
             u."emailVerified" AS "emailVerified",
             u.image,
             u.role,
             u.banned,
             u."banReason" AS "banReason",
             u."banExpires"::text AS "banExpires",
             u."createdAt"::text AS "createdAt",
             u."updatedAt"::text AS "updatedAt",
             u."lastLoginMethod" AS "lastLoginMethod",
             COALESCE(up.finished_onboarding, false) AS "finishedOnboarding",
             ls."createdAt"::text AS "lastSessionAt"
      FROM "user" u
      LEFT JOIN user_profile up
        ON up.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT s."createdAt"
        FROM session s
        WHERE s."userId" = u.id
        ORDER BY s."createdAt" DESC
        LIMIT 1
      ) ls ON true
      ${filter.whereClause}
      ORDER BY u."createdAt" DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query<CountRow>(countQuery, countParams),
      pool.query<AdminUserSummary>(dataQuery, params),
    ]);

    return {
      rows: dataResult.rows,
      total: this.parseTotal(countResult.rows[0]?.total),
    };
  }

  async getUserById(userId: string): Promise<AdminUserSummary> {
    const query = `
      SELECT u.id,
             u.name,
             u.email,
             u."emailVerified" AS "emailVerified",
             u.image,
             u.role,
             u.banned,
             u."banReason" AS "banReason",
             u."banExpires"::text AS "banExpires",
             u."createdAt"::text AS "createdAt",
             u."updatedAt"::text AS "updatedAt",
             u."lastLoginMethod" AS "lastLoginMethod",
             COALESCE(up.finished_onboarding, false) AS "finishedOnboarding",
             ls."createdAt"::text AS "lastSessionAt"
      FROM "user" u
      LEFT JOIN user_profile up
        ON up.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT s."createdAt"
        FROM session s
        WHERE s."userId" = u.id
        ORDER BY s."createdAt" DESC
        LIMIT 1
      ) ls ON true
      WHERE u.id = $1
      LIMIT 1
    `;
    const result = await pool.query<AdminUserSummary>(query, [userId]);
    if (result.rows.length === 0) {
      throw new Error("User not found");
    }
    return result.rows[0];
  }

  async getUserProfileBundle(userId: string): Promise<AdminUserProfileBundle> {
    const [
      user,
      profile,
      goals,
      latestWeight,
      latestHeight,
      latestBloodPressure,
      latestHeartRate,
    ] = await Promise.all([
      this.getUserById(userId),
      userProfileService.getProfile(userId),
      userProfileService.getGoals(userId),
      userProfileService.getLatestWeight(userId),
      userProfileService.getLatestHeight(userId),
      this.getLatestBloodPressure(userId),
      this.getLatestHeartRate(userId),
    ]);

    return {
      user,
      profile,
      goals,
      latestWeight,
      latestHeight,
      latestBloodPressure,
      latestHeartRate,
    };
  }

  async getUserMeals(userId: string, paginationProps: PaginationProps) {
    return foodService.getAllUserMeals(userId, paginationProps);
  }

  async getUserSleepEntries(userId: string, paginationProps: PaginationProps) {
    const { limit, offset } = paginationProps;
    const countQuery = `
      SELECT COUNT(id)::text AS total
      FROM user_sleep
      WHERE user_id = $1
    `;
    const dataQuery = `
      SELECT id, user_id, sleep_start, sleep_end, note
      FROM user_sleep
      WHERE user_id = $1
      ORDER BY sleep_start DESC
      LIMIT $2 OFFSET $3
    `;
    const [countResult, dataResult] = await Promise.all([
      pool.query<CountRow>(countQuery, [userId]),
      pool.query<SleepEntry>(dataQuery, [userId, limit, offset]),
    ]);

    return {
      rows: dataResult.rows,
      total: this.parseTotal(countResult.rows[0]?.total),
    };
  }

  async getUserWorkouts(userId: string, paginationProps: PaginationProps) {
    return workoutService.getAllUserWorkouts(userId, paginationProps);
  }

  async getUserWorkoutTemplates(
    userId: string,
    paginationProps: PaginationProps,
  ) {
    return workoutService.getAllUserWorkoutTemplates(userId, paginationProps);
  }

  private makeUserFilter(query?: string) {
    const trimmed = query?.trim();
    if (!trimmed) {
      return { whereClause: "", params: [] as any[] };
    }

    return {
      whereClause: `
        WHERE (
          u.name ILIKE $1
          OR u.email ILIKE $1
          OR COALESCE(u.role, '') ILIKE $1
        )
      `,
      params: [`%${trimmed}%`],
    };
  }

  private async getLatestBloodPressure(
    userId: string,
  ): Promise<AdminBloodPressureLog | null> {
    const query = `
      SELECT id,
             user_id,
             measured_at::text AS measured_at,
             systolic_mmhg,
             diastolic_mmhg
      FROM user_blood_pressure_log
      WHERE user_id = $1
      ORDER BY measured_at DESC
      LIMIT 1
    `;
    const result = await pool.query<AdminBloodPressureLog>(query, [userId]);
    return result.rows[0] ?? null;
  }

  private async getLatestHeartRate(
    userId: string,
  ): Promise<AdminHeartRateLog | null> {
    const query = `
      SELECT id,
             user_id,
             measured_at::text AS measured_at,
             bpm
      FROM user_heart_rate_log
      WHERE user_id = $1
      ORDER BY measured_at DESC
      LIMIT 1
    `;
    const result = await pool.query<AdminHeartRateLog>(query, [userId]);
    return result.rows[0] ?? null;
  }

  private async getCount(query: string): Promise<number> {
    const result = await pool.query<CountRow>(query);
    return this.parseTotal(result.rows[0]?.total);
  }

  private parseTotal(value?: string): number {
    const total = parseInt(value ?? "0", 10);
    return Number.isNaN(total) || total < 0 ? 0 : total;
  }
}

export const adminService = new AdminService();
