import { Time } from '@/lib/Time';
import { SleepSession } from '@/types';

export function minutesSinceMidnight(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

export function circularMeanMinutes(values: number[]): number | null {
  if (!values.length) return null;
  const toRad = (m: number) => (2 * Math.PI * m) / (24 * 60);
  let sx = 0,
    sy = 0;
  for (const m of values) {
    const a = toRad(m);
    sx += Math.cos(a);
    sy += Math.sin(a);
  }
  if (sx === 0 && sy === 0) return null;
  const meanAngle = Math.atan2(sy, sx);
  const wrapped = meanAngle < 0 ? meanAngle + 2 * Math.PI : meanAngle;
  const minutes = Math.round((wrapped * 24 * 60) / (2 * Math.PI));
  return minutes % (24 * 60);
}

export function formatMinutesAsTime(minutes: number | null, mask = 'h:mm A') {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return Time.format(d, mask);
}

export function averageSleepDurationMs(
  sessions: SleepSession[],
  daysWindow: number,
): number | null {
  const now = Date.now();
  const windowStart = now - daysWindow * 24 * 60 * 60 * 1000;
  const finished = sessions.filter((s) => s.endAt && new Date(s.startAt).getTime() >= windowStart);
  if (!finished.length) return null;
  let total = 0;
  for (const s of finished) {
    total += new Date(s.endAt!).getTime() - new Date(s.startAt).getTime();
  }
  return Math.round(total / finished.length);
}

export function averageTimeOfDayMinutes(
  sessions: SleepSession[],
  daysWindow: number,
  pick: 'start' | 'end',
): number | null {
  const now = Date.now();
  const windowStart = now - daysWindow * 24 * 60 * 60 * 1000;
  const filtered = sessions.filter((s) => {
    if (pick === 'end') {
      return s.endAt && new Date(s.endAt).getTime() >= windowStart;
    }
    return new Date(s.startAt).getTime() >= windowStart;
  });
  const minutes = filtered
    .map((s) => new Date(pick === 'end' ? s.endAt! : s.startAt))
    .map(minutesSinceMidnight);
  if (!minutes.length) return null;
  return circularMeanMinutes(minutes);
}
