export interface SleepEntry {
    id: string;
    user_id: string;
    sleep_start: string;
    sleep_end: string | null;
    note: string | null;
}