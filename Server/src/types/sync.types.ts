export type HealthSyncProvider = "health-connect" | "apple-health";

export type HealthSyncSourceType =
  | "sleep"
  | "weight"
  | "height"
  | "heart_rate"
  | "blood_pressure";

export interface HealthSyncStateRow {
  user_id: string;
  provider: HealthSyncProvider;
  sync_state: unknown | null;
  last_success_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface HealthSyncPendingRunRow {
  user_id: string;
  provider: HealthSyncProvider;
  sync_run_id: string;
  expected_batch_index: number;
  current_sync_state: unknown | null;
  next_sync_state: unknown | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface HealthSyncSourceItemRow {
  id: string;
  user_id: string;
  provider: HealthSyncProvider;
  source_type: HealthSyncSourceType;
  source_item_id: string;
  target_table: string | null;
  target_row_id: string | null;
  raw_payload: unknown;
  checksum: string;
  source_start_at: string | Date | null;
  source_end_at: string | Date | null;
  source_last_modified_at: string | Date | null;
  owns_target: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}
