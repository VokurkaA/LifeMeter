import {request} from '@/lib/net';
import type {SleepSession} from '@/types/types';

type SleepPatch = {
  startAt?: string; endAt?: string | null; note?: string | null;
};

type ServerSleepEntry = {
  id: string; user_id: string; sleep_start: string; sleep_end: string | null; note: string | null;
};

class SleepService {
  private baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/user/sleep';

  async startSleepSession(startAt?: string, note?: string): Promise<SleepSession> {
    return request<ServerSleepEntry>(this.baseUrl + '/start', {
      method: 'POST', body: JSON.stringify({
        startAt: startAt || new Date().toISOString(), note: note ?? null,
      }),
    }).then(this.toSleepSession);
  }

  async endSleepSession(endAt?: string): Promise<SleepSession> {
    return request<ServerSleepEntry>(this.baseUrl + '/end', {
      method: 'POST', body: JSON.stringify({
        endAt: endAt || new Date().toISOString(),
      }),
    }).then(this.toSleepSession);
  }

  async addSleepSession(startAt: string, endAt?: string, note?: string): Promise<SleepSession> {
    return request<ServerSleepEntry>(this.baseUrl + '/new', {
      method: 'POST', body: JSON.stringify({
        startAt, endAt: endAt ?? null, note: note ?? null,
      }),
    }).then(this.toSleepSession);
  }

  async getAllSleepSessions(): Promise<SleepSession[]> {
    return request<ServerSleepEntry[]>(this.baseUrl + '/').then((rows) => rows.map(this.toSleepSession));
  }

  async getSleepSession(id: string): Promise<SleepSession> {
    return request<ServerSleepEntry>(`${this.baseUrl}/${encodeURIComponent(id)}`).then(this.toSleepSession);
  }

  async editSleepSession(id: string, patch: SleepPatch): Promise<SleepSession> {
    return request<ServerSleepEntry>(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify(patch),
    }).then(this.toSleepSession);
  }

  async deleteSleepSession(id: string): Promise<void> {
    await request<void>(`${this.baseUrl}/${encodeURIComponent(id)}`, {method: 'DELETE'});
  }

  private toSleepSession = (e: ServerSleepEntry): SleepSession => ({
    id: e.id, userId: e.user_id, startAt: e.sleep_start, endAt: e.sleep_end, note: e.note,
  });
}

export const sleepService = new SleepService();
