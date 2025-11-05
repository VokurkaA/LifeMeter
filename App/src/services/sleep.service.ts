import type { SleepSession } from '@/types.ts';

type SleepPatch = {
  startAt?: string;
  endAt?: string | null;
  note?: string | null;
};

type ServerSleepEntry = {
  id: string;
  user_id: string;
  sleep_start: string;
  sleep_end: string | null;
  note: string | null;
};

class SleepService {
  private baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '') + '/api/sleep';

  private toSleepSession = (e: ServerSleepEntry): SleepSession => ({
    id: e.id,
    userId: e.user_id,
    startAt: e.sleep_start,
    endAt: e.sleep_end,
    note: e.note,
  });

  async startSleepSession(startAt?: string, note?: string): Promise<SleepSession> {
    return this.request<ServerSleepEntry>('/start', {
      method: 'POST',
      body: JSON.stringify({
        startAt: startAt || new Date().toISOString(),
        note: note ?? null,
      }),
    }).then(this.toSleepSession);
  }

  async endSleepSession(endAt?: string): Promise<SleepSession> {
    return this.request<ServerSleepEntry>('/end', {
      method: 'POST',
      body: JSON.stringify({
        endAt: endAt || new Date().toISOString(),
      }),
    }).then(this.toSleepSession);
  }

  async addSleepSession(startAt: string, endAt?: string, note?: string): Promise<SleepSession> {
    return this.request<ServerSleepEntry>('/new', {
      method: 'POST',
      body: JSON.stringify({
        startAt,
        endAt: endAt ?? null,
        note: note ?? null,
      }),
    }).then(this.toSleepSession);
  }

  async getAllSleepSessions(): Promise<SleepSession[]> {
    return this.request<ServerSleepEntry[]>('/').then((rows) => rows.map(this.toSleepSession));
  }

  async getSleepSession(id: string): Promise<SleepSession> {
    return this.request<ServerSleepEntry>(`/${encodeURIComponent(id)}`).then(this.toSleepSession);
  }

  async editSleepSession(id: string, patch: SleepPatch): Promise<SleepSession> {
    return this.request<ServerSleepEntry>(`/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then(this.toSleepSession);
  }

  async deleteSleepSession(id: string): Promise<void> {
    await this.request<void>(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(this.baseUrl + path, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      ...init,
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const text = await response.text();
        if (text) {
          try {
            const json = JSON.parse(text);
            message = json?.error || json?.message || text || message;
          } catch {
            message = text || message;
          }
        }
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    if (response.status === 204) return undefined as unknown as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }
}

export const sleepService = new SleepService();
