import type { SleepEntry } from "@/types/sleep.types";
import { pool } from "@/config/db.config";

class SleepService {
    async getAllSleepEntries(userId: string): Promise<SleepEntry[]> {
        const dataQuery = `
            SELECT id, user_id, sleep_start, sleep_end, note
            FROM user_sleep
            WHERE user_id = $1
            ORDER BY sleep_start DESC
        `;
        const {rows} = await pool.query<SleepEntry>(dataQuery, [userId]);
        return rows;
    }

    async getSleepEntry(userId: string, sleepEntryId: string): Promise<SleepEntry> {
        const dataQuery = `
            SELECT id, user_id, sleep_start, sleep_end, note
            FROM user_sleep
            WHERE user_id = $1
              AND id = $2
        `;
        const {rows} = await pool.query<SleepEntry>(dataQuery, [userId, sleepEntryId]);
        if (rows.length === 0) throw new Error("Sleep entry not found");
        return rows[0];
    }

    async addSleepEntry(userId: string, startAt: string, endAt: string | null, note: string | null): Promise<SleepEntry> {
        if (endAt && new Date(endAt).getTime() < new Date(startAt).getTime()) {
            throw new Error("sleep_end cannot be earlier than sleep_start");
        }

        const dataQuery = `
            INSERT INTO user_sleep (user_id, sleep_start, sleep_end, note)
            VALUES ($1, $2, $3, $4)
            RETURNING id, user_id, sleep_start, sleep_end, note
        `;
        const {rows} = await pool.query<SleepEntry>(dataQuery, [userId, startAt, endAt, note]);
        return rows[0];
    }

    async alterSleepEntry(userId: string, sleepEntryId: string, startAt: string, endAt: string | null, note: string | null): Promise<SleepEntry> {
        if (endAt && new Date(endAt).getTime() < new Date(startAt).getTime()) {
            throw new Error("sleep_end cannot be earlier than sleep_start");
        }

        const dataQuery = `
            UPDATE user_sleep
            SET sleep_start = $3,
                sleep_end   = $4,
                note        = $5
            WHERE user_id = $1
              AND id = $2
            RETURNING id, user_id, sleep_start, sleep_end, note
        `;
        const {rows} = await pool.query<SleepEntry>(dataQuery, [userId, sleepEntryId, startAt, endAt, note]);
        if (rows.length === 0) throw new Error("Sleep entry not found");
        return rows[0];
    }

    async deleteSleepEntry(userId: string, sleepEntryId: string): Promise<void> {
        const dataQuery = `
            DELETE
            FROM user_sleep
            WHERE user_id = $1
              AND id = $2
        `;
        const result = await pool.query(dataQuery, [userId, sleepEntryId]);
        if (result.rowCount === 0) {
            throw new Error("Sleep entry not found");
        }
    }

    async startSleep(userId: string, startAt: string = new Date().toISOString(), note: string | null = null): Promise<SleepEntry> {
        return this.addSleepEntry(userId, startAt, null, note);
    }

    async endSleep(userId: string, endAt: string = new Date().toISOString()): Promise<SleepEntry> {
        const dataQuery = `
            WITH open_entry AS (SELECT id
                                FROM user_sleep
                                WHERE user_id = $1
                                  AND sleep_end IS NULL
                                ORDER BY sleep_start DESC
                                LIMIT 1)
            UPDATE user_sleep us
            SET sleep_end = $2
            FROM open_entry oe
            WHERE us.id = oe.id
            RETURNING us.id, us.user_id, us.sleep_start, us.sleep_end, us.note
        `;
        const {rows} = await pool.query<SleepEntry>(dataQuery, [userId, endAt]);
        if (rows.length === 0) {
            throw new Error("No active sleep entry to end");
        }
        const updated = rows[0];

        if (new Date(updated.sleep_end as unknown as string).getTime() < new Date(updated.sleep_start as unknown as string).getTime()) {
            throw new Error("Computed sleep_end is earlier than sleep_start");
        }

        return updated;
    }
}

export const sleepService = new SleepService();