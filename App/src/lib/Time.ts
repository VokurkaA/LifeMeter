import { Timestamp } from '@/lib/Timestamp';

type DateInput = Date | string | number | null | undefined;
type TimeUnit = 'ms' | 's' | 'm' | 'h' | 'd';

type Additive = {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
};

const MS = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

function clampNum(n: unknown, d = 0) {
  return Number.isFinite(n as number) ? (n as number) : d;
}

function hasTZ(s: string) {
  return /[zZ]$|[+-]\d{2}:\d{2}$|[+-]\d{4}$/.test(s);
}

function normalizeDbString(s: string) {
  // Accept common DB formats: "YYYY-MM-DD HH:mm:ss[.SSS][+/-TZ]"
  let t = s.trim();
  if (!t) return t;
  // If it looks like "YYYY-MM-DD HH:mm:ss" without 'T', add it
  if (/^\d{4}-\d{2}-\d{2} /.test(t) && !t.includes('T')) {
    t = t.replace(' ', 'T');
  }
  // If no timezone info, leave as-is (treat as local) – OR force Z to be UTC:
  // We’ll prefer UTC if explicitly requested by user through options.
  return t;
}

function toDate(input: DateInput, opts?: { numericUnit?: 'ms' | 's'; assumeUTC?: boolean }): Date {
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === 'number') {
    const unit = opts?.numericUnit ?? 'ms';
    return new Date(unit === 's' ? input * 1000 : input);
  }
  if (typeof input === 'string') {
    const norm = normalizeDbString(input);
    if (!norm) return new Date(NaN);
    // Try as-is
    let d = new Date(norm);
    if (!Number.isFinite(d.getTime())) {
      // If still invalid, try appending 'Z' (treat as UTC)
      if (!hasTZ(norm)) d = new Date(norm + 'Z');
    }
    if (opts?.assumeUTC && !hasTZ(norm)) {
      // Interpret as UTC clock time (no offset in string)
      // Convert "YYYY-MM-DDTHH:mm:ss" into a Date using UTC parts
      const m = norm.match(
        /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/,
      );
      if (m) {
        const [, Y, MM, DD, hh, mm, ss = '0', ms = '0'] = m;
        const ms3 = ms.padEnd(3, '0').slice(0, 3);
        return new Date(Date.UTC(+Y, +MM - 1, +DD, +hh, +mm, +ss, +ms3));
      }
    }
    return d;
  }
  // null/undefined -> invalid if not explicitly wanted as "now"
  return new Date(NaN);
}

function pad(n: number, w: number) {
  const s = String(Math.trunc(Math.abs(n)));
  return s.length >= w ? s : '0'.repeat(w - s.length) + s;
}

function weekdayName(i: number) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]!;
}
function weekdayShort(i: number) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]!;
}
function monthName(i: number) {
  return [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ][i]!;
}
function monthShort(i: number) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]!;
}

function tzOffsetParts(d: Date, useUTC = false) {
  if (useUTC) return { sign: '+', hh: '00', mm: '00', compact: '+0000', pretty: '+00:00' };
  const off = -d.getTimezoneOffset(); // minutes east of UTC
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  const hh = pad(Math.floor(abs / 60), 2);
  const mm = pad(abs % 60, 2);
  return { sign, hh, mm, compact: `${sign}${hh}${mm}`, pretty: `${sign}${hh}:${mm}` };
}

function formatDate(d: Date, mask: string, opts?: { utc?: boolean }) {
  const utc = !!opts?.utc;

  const Y = utc ? d.getUTCFullYear() : d.getFullYear();
  const M = (utc ? d.getUTCMonth() : d.getMonth()) + 1;
  const D = utc ? d.getUTCDate() : d.getDate();
  const wd = utc ? d.getUTCDay() : d.getDay();

  const H24 = utc ? d.getUTCHours() : d.getHours();
  const m = utc ? d.getUTCMinutes() : d.getMinutes();
  const s = utc ? d.getUTCSeconds() : d.getSeconds();
  const S3 = utc ? d.getUTCMilliseconds() : d.getMilliseconds();

  const H12raw = H24 % 12;
  const H12 = H12raw === 0 ? 12 : H12raw;
  const meridiem = H24 < 12 ? 'AM' : 'PM';

  const tz = tzOffsetParts(d, utc);

  const tokens: Record<string, string> = {
    YYYY: String(Y),
    YY: pad(Y % 100, 2),
    MMMM: monthName(M - 1),
    MMM: monthShort(M - 1),
    MM: pad(M, 2),
    M: String(M),
    DD: pad(D, 2),
    D: String(D),
    dddd: weekdayName(wd),
    ddd: weekdayShort(wd),
    HH: pad(H24, 2),
    H: String(H24),
    hh: pad(H12, 2),
    h: String(H12),
    A: meridiem,
    a: meridiem.toLowerCase(),
    mm: pad(m, 2),
    m: String(m),
    ss: pad(s, 2),
    s: String(s),
    SSS: pad(S3, 3),
    SS: pad(Math.floor(S3 / 10), 2),
    S: String(Math.floor(S3 / 100)),
    Z: tz.pretty,
    ZZ: tz.compact,
    // aliases
    ms: pad(S3, 3),
    MS: pad(S3, 3),
  };

  // Longest-first to prevent partial matches (e.g., 'ZZ' before 'Z', 'ms' before 'm'/'s')
  const re = new RegExp(
    Object.keys(tokens)
      .sort((a, b) => b.length - a.length)
      .join('|'),
    'g',
  );

  return mask.replace(re, (t) => tokens[t] ?? t);
}

function floorDiv(a: number, b: number) {
  return Math.trunc(a / b);
}

// Cache compiled regex to avoid rebuilding on each format call
let DURATION_TOKEN_RE: RegExp | null = null;

function formatDuration(ms: number, mask: string) {
  const sign = ms < 0 ? '-' : '';
  let rem = Math.abs(ms);

  const years = floorDiv(rem, 365 * MS.d);
  rem -= years * 365 * MS.d;
  const months = floorDiv(rem, 30 * MS.d);
  rem -= months * 30 * MS.d;
  const days = floorDiv(rem, MS.d);
  rem -= days * MS.d;
  const hours = floorDiv(rem, MS.h);
  rem -= hours * MS.h;
  const minutes = floorDiv(rem, MS.m);
  rem -= minutes * MS.m;
  const seconds = floorDiv(rem, MS.s);
  rem -= seconds * MS.s;
  const millis = rem;

  const tokens: Record<string, string> = {
    YYYY: pad(years, 4),
    YY: pad(years, 2),
    Y: String(years),
    MM: pad(months, 2),
    M: String(months),
    DD: pad(days, 2),
    D: String(days),
    HH: pad(hours, 2),
    H: String(hours),
    hh: pad(hours % 12 || 12, 2),
    h: String(hours % 12 || 12),
    mm: pad(minutes, 2),
    m: String(minutes),
    ss: pad(seconds, 2),
    s: String(seconds),
    SSS: pad(millis, 3),
    SS: pad(Math.floor(millis / 10), 2),
    S: String(Math.floor(millis / 100)),
    ms: pad(millis, 3),
    MS: pad(millis, 3),
    // no-op meridiem for durations
    A: '',
    a: '',
  };

  const re =
    DURATION_TOKEN_RE ??
    (DURATION_TOKEN_RE = new RegExp(
      Object.keys(tokens)
        .sort((a, b) => b.length - a.length)
        .join('|'),
      'g',
    ));

  return sign + mask.replace(re, (t) => tokens[t] ?? t);
}

export class Time {
  private readonly d: Date;

  constructor(
    input: DateInput = new Date(),
    opts?: { numericUnit?: 'ms' | 's'; assumeUTC?: boolean },
  ) {
    this.d = toDate(input, opts);
  }

  static now() {
    return new Time(new Date());
  }

  static from(input: DateInput, opts?: { numericUnit?: 'ms' | 's'; assumeUTC?: boolean }) {
    return new Time(input, opts);
  }

  static parse(input: DateInput, opts?: { numericUnit?: 'ms' | 's'; assumeUTC?: boolean }) {
    return toDate(input, opts);
  }

  isValid() {
    return Number.isFinite(this.d.getTime());
  }

  toDate() {
    return new Date(this.d.getTime());
  }

  toUnixSeconds() {
    return Math.floor(this.d.getTime() / 1000);
  }

  toISOString() {
    return this.d.toISOString();
  }

  // Date-time formatting (calendar time)
  format(mask: string, opts?: { utc?: boolean }) {
    return formatDate(this.d, mask, opts);
  }

  // Add/subtract calendar/time parts
  add(delta: Additive): Time {
    const {
      years = 0,
      months = 0,
      days = 0,
      hours = 0,
      minutes = 0,
      seconds = 0,
      milliseconds = 0,
    } = delta;

    // Apply Y/M using UTC to avoid DST ambiguities in calendar math
    const y = this.d.getUTCFullYear() + years;
    const mo = this.d.getUTCMonth() + months;

    const dt = new Date(this.d.getTime());
    dt.setUTCFullYear(y, mo, dt.getUTCDate());
    dt.setUTCDate(dt.getUTCDate() + days);
    dt.setUTCHours(
      dt.getUTCHours() + hours,
      dt.getUTCMinutes() + minutes,
      dt.getUTCSeconds() + seconds,
      dt.getUTCMilliseconds() + milliseconds,
    );
    return new Time(dt);
  }

  subtract(delta: Additive): Time {
    const neg: Additive = {
      years: -clampNum(delta.years),
      months: -clampNum(delta.months),
      days: -clampNum(delta.days),
      hours: -clampNum(delta.hours),
      minutes: -clampNum(delta.minutes),
      seconds: -clampNum(delta.seconds),
      milliseconds: -clampNum(delta.milliseconds),
    };
    return this.add(neg);
  }

  // Difference (this - other) in a unit
  diff(other: DateInput, unit: TimeUnit = 'ms', abs = false): number {
    const a = this.d.getTime();
    const b = toDate(other).getTime();
    let diffMs = a - b;
    if (abs) diffMs = Math.abs(diffMs);
    switch (unit) {
      case 'ms':
        return diffMs;
      case 's':
        return diffMs / MS.s;
      case 'm':
        return diffMs / MS.m;
      case 'h':
        return diffMs / MS.h;
      case 'd':
        return diffMs / MS.d;
    }
  }

  // Human duration object via Timestamp (seconds)
  // Example: Time.since(date).format('hh:mm') – integrates with Timestamp
  static since(then: DateInput, now: DateInput = new Date()): Timestamp {
    const a = toDate(now).getTime();
    const b = toDate(then).getTime();
    const seconds = Math.floor((a - b) / 1000);
    return Timestamp.from(seconds);
  }

  static between(start: DateInput, end: DateInput): Timestamp {
    const a = toDate(end).getTime();
    const b = toDate(start).getTime();
    const seconds = Math.floor((a - b) / 1000);
    return Timestamp.from(seconds);
  }

  // Quick helpers

  // Date-time -> string using a mask (calendar time)
  static format(input: DateInput, mask: string, opts?: { utc?: boolean }) {
    return Time.from(input).format(mask, opts);
  }

  // Duration formatting from milliseconds with tokens:
  // Y, YY, YYYY, M, MM, D, DD, H, HH, h, hh, m, mm, s, ss, S, SS, SSS, ms, MS
  // Example: formatDurationMs(ms, 'YY:MM:DD:HH:mm:ss:SSS')
  static formatDurationMs(ms: number, mask: string) {
    return formatDuration(ms, mask);
  }

  // Relative string like "3h ago" / "in 5m"
  static relative(then: DateInput, now: DateInput = new Date()): string {
    const ms = toDate(now).getTime() - toDate(then).getTime();
    const abs = Math.abs(ms);
    const sign = ms >= 0 ? 'ago' : 'from now';

    const units: [number, string, string][] = [
      [MS.d, 'day', 'days'],
      [MS.h, 'hour', 'hours'],
      [MS.m, 'minute', 'minutes'],
      [MS.s, 'second', 'seconds'],
    ];
    for (const [unitMs, singular, plural] of units) {
      if (abs >= unitMs) {
        const v = Math.floor(abs / unitMs);
        return `${v} ${v === 1 ? singular : plural} ${sign}`;
      }
    }
    return `just now`;
  }
}

export type { TimeUnit, Additive };
