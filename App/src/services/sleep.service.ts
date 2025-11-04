import { fetchWithTimeout } from '@/lib/net';
import { SleepSession } from '@/types';

class SleepService {
  private appUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  private base = `${this.appUrl}/api/sleep`;

  // GET /sleep
  async getAllSleepSessions(): Promise<SleepSession[]> {
    const res = await fetchWithTimeout(`${this.base}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      timeout: 5000,
    });
    if (!res.ok) throw new Error(`List sleep sessions failed: ${res.status}`);
    const data = await res.json();
    return data ?? [];
  }

  // GET /sleep/current
  async getCurrentSleepSession(): Promise<SleepSession | null> {
    const res = await fetchWithTimeout(`${this.base}/current`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      timeout: 5000,
    });
    if (res.status === 204 || res.status === 404) return null;
    if (!res.ok) throw new Error(`Get current sleep session failed: ${res.status}`);
    return (await res.json()) as SleepSession;
  }

  // POST /sleep/start  { startAt?: string }
  async startSleepSession(startISO?: string): Promise<SleepSession> {
    const body: Record<string, unknown> = {};
    if (startISO) body.startAt = startISO;

    const res = await fetch(`${this.base}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Start sleep session failed: ${res.status}`);
    return (await res.json()) as SleepSession;
  }

  // POST /sleep/end  { endAt?: string }
  async endSleepSession(endISO?: string): Promise<SleepSession> {
    const body: Record<string, unknown> = {};
    if (endISO) body.endAt = endISO;

    const res = await fetch(`${this.base}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`End sleep session failed: ${res.status}`);
    return (await res.json()) as SleepSession;
  }

  // POST /sleep/add  { startAt: string, endAt: string, note?: string }
  async addSleepSession(startAt: string, endAt: string, note?: string): Promise<SleepSession> {
    const res = await fetch(`${this.base}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ startAt, endAt, note: note ?? null }),
    });
    if (!res.ok) throw new Error(`Add sleep session failed: ${res.status}`);
    return (await res.json()) as SleepSession;
  }

  // PATCH /sleep/:id  { ...partial }
  async updateSleepSession(id: string, patch: Partial<Pick<SleepSession, 'startAt' | 'endAt' | 'note'>>): Promise<SleepSession> {
    const res = await fetch(`${this.base}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`Update sleep session failed: ${res.status}`);
    return (await res.json()) as SleepSession;
  }

  // DELETE /sleep/:id
  async deleteSleepSession(id: string): Promise<{ status: boolean }> {
    const res = await fetch(`${this.base}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(`Delete sleep session failed: ${res.status}`);
    return (await res.json()) as { status: boolean };
  }
}

export default new SleepService();
