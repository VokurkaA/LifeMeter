export type TimestampInit =
  | string
  | number
  | { hours?: number; minutes?: number; seconds?: number }
  | Timestamp;

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * Represents a duration timestamp. Internally stores canonical "HH:MM:SS" string,
 * but supports arithmetic and formatting via a pattern (e.g. "hh:mm:ss", "hh:mm", "mm:ss").
 *
 * Notes:
 * - Negative durations are supported. They format with a leading "-".
 * - Parsing accepts:
 *   - number (seconds)
 *   - "hh:mm:ss"
 *   - "mm:ss"
 *   - "hh:mm" (interpreted as hours:minutes)
 *   - object { hours?, minutes?, seconds? }
 */
export class Timestamp {
  private readonly raw: string; // canonical "HH:MM:SS" with unlimited hours

  constructor(init: TimestampInit = 0) {
    this.raw = Timestamp.normalizeToCanonical(init);
  }

  static from(init: TimestampInit) {
    return new Timestamp(init);
  }

  static zero() {
    return new Timestamp(0);
  }

  // Arithmetic
  plus(value: TimestampInit): Timestamp {
    const total = this.totalSeconds() + Timestamp.secondsFrom(value);
    return Timestamp.from(total);
  }

  minus(value: TimestampInit): Timestamp {
    const total = this.totalSeconds() - Timestamp.secondsFrom(value);
    return Timestamp.from(total);
  }

  addHours(hours: number): Timestamp {
    return this.plus(hours * 3600);
  }

  addMinutes(minutes: number): Timestamp {
    return this.plus(minutes * 60);
  }

  addSeconds(seconds: number): Timestamp {
    return this.plus(seconds);
  }

  compareTo(other: TimestampInit): number {
    const a = this.totalSeconds();
    const b = Timestamp.secondsFrom(other);
    return a === b ? 0 : a < b ? -1 : 1;
  }

  isZero(): boolean {
    return this.totalSeconds() === 0;
  }

  isNegative(): boolean {
    return this.totalSeconds() < 0;
  }

  abs(): Timestamp {
    const s = Math.abs(this.totalSeconds());
    return Timestamp.from(s);
  }

  // Introspection and conversions
  totalSeconds(): number {
    return Timestamp.secondsFrom(this.raw);
  }

  totalMinutes(): number {
    return this.totalSeconds() / 60;
  }

  totalHours(): number {
    return this.totalSeconds() / 3600;
  }

  /**
   * - Years/Months/Days (approx): Y, YY, YYYY | M, MM | D, DD
   *   - Y/YY/YYY... pads to the token's length (e.g., YY => 2, YYYY => 4)
   *   - Months = 30 days, Years = 365 days (duration-approx, not calendar-accurate)
   * - Hours (24h remainder): H, HH
   * - Hours (12h remainder): h, hh  (+ meridiem A/a)
   * - Minutes: m, mm  (if no hour token present, minutes become total minutes)
   * - Seconds: s, ss
   * - Milliseconds: S, SS, SSS (always 0 with current seconds-only storage)
   * - Totals (un-padded): tH (total hours), tM (total minutes), tS (total seconds), tMS (total milliseconds)
   *
   * Examples:
   * - "hh:mm:ss"   -> 01:02:03
   * - "h:m:s"      -> 1:2:3
   * - "mm:ss"      -> 62:03  (minutes roll up if there’s no hour token)
   * - "tH:h A"     -> "49:1 AM" (for 2d+1h+…)
   * - "Y years, D days" -> "0 years, 3 days"
   */
  format(mask: string = 'hh:mm:ss'): string {
    const total = this.totalSeconds(); // may be negative
    const sign = total < 0 ? '-' : '';
    const absTotal = Math.abs(total);

    // Unit bases (approx)
    const SEC = 1;
    const MIN = 60 * SEC;
    const HOUR = 60 * MIN;
    const DAY = 24 * HOUR;
    const MONTH = 30 * DAY; // approx months (30d)
    const YEAR = 365 * DAY; // approx years (365d)

    // Remainder breakdown (years -> months -> days -> hours -> minutes -> seconds)
    let rem = absTotal;
    const years = Math.floor(rem / YEAR);
    rem -= years * YEAR;
    const months = Math.floor(rem / MONTH);
    rem -= months * MONTH;
    const days = Math.floor(rem / DAY);
    rem -= days * DAY;
    const hours24 = Math.floor(rem / HOUR);
    rem -= hours24 * HOUR;
    const minutesRemainder = Math.floor(rem / MIN);
    rem -= minutesRemainder * MIN;
    const secondsRemainder = Math.floor(rem / SEC);
    const millis = 0; // seconds-only storage => 0ms

    // 12-hour clock-style hours within the day
    const hour12Raw = hours24 % 12;
    const hour12 = hour12Raw === 0 ? 12 : hour12Raw;
    const meridiem = hours24 < 12 ? 'AM' : 'PM';

    // Totals
    const totalHours = Math.floor(absTotal / HOUR);
    const totalMinutes = Math.floor(absTotal / MIN);
    const totalSeconds = Math.floor(absTotal);
    const totalMillis = totalSeconds * 1000;

    // Helper zero-padding
    const pad = (n: number, w: number) => Timestamp.pad(n, w);

    // Whether mask contains any hour token (affects minute token semantics)
    const hasHourToken = /(HH|H|hh|h)/.test(mask);

    // Minutes token value (total if no hour token)
    const minutesForToken = hasHourToken ? minutesRemainder : totalMinutes;

    // Token map (compute both padded and non-padded)
    const tokenMap: Record<string, string> = {
      // Years
      YYYY: pad(years, 4),
      YY: pad(years, 2),
      Y: String(years),

      // Months (uppercase M) – remainder after years
      MM: pad(months, 2),
      M: String(months),

      // Days – remainder after months
      DD: pad(days, 2),
      D: String(days),

      // 24-hour remainder within day
      HH: pad(hours24, 2),
      H: String(hours24),

      // 12-hour remainder within day + meridiem
      hh: pad(hour12, 2),
      h: String(hour12),
      A: meridiem,
      a: meridiem.toLowerCase(),

      // Minutes
      mm: pad(minutesForToken, 2),
      m: String(minutesForToken),

      // Seconds (remainder)
      ss: pad(secondsRemainder, 2),
      s: String(secondsRemainder),

      // Milliseconds (always zero with current storage)
      SSS: pad(millis, 3),
      SS: pad(millis, 2),
      S: String(millis),

      // Totals (un-padded)
      tH: String(totalHours),
      tM: String(totalMinutes),
      tS: String(totalSeconds),
      tMS: String(totalMillis),
    };

    // Replace tokens – order matters (longest first to avoid partial overlaps)
    const tokens = [
      'tMS',
      'YYYY',
      'SSS',
      'YY',
      'HH',
      'hh',
      'MM',
      'DD',
      'mm',
      'ss',
      'SS',
      'tH',
      'tM',
      'tS',
      'Y',
      'H',
      'h',
      'M',
      'D',
      'm',
      's',
      'S',
      'A',
      'a',
    ];
    const re = new RegExp(tokens.join('|'), 'g');

    const replaced = mask.replace(re, (t) => tokenMap[t] ?? t);

    // If no known tokens were present, return canonical string
    const containsAnyToken = re.test(mask);
    return sign + (containsAnyToken ? replaced : this.toString());
  }

  toString(): string {
    return this.raw;
  }

  toJSON(): string {
    return this.toString();
  }

  valueOf(): number {
    return this.totalSeconds();
  }

  // Helpers

  private static normalizeToCanonical(init: TimestampInit): string {
    const s = this.secondsFrom(init);
    return this.canonicalFromSeconds(s);
  }

  private static secondsFrom(init: TimestampInit): number {
    if (init instanceof Timestamp) return init.totalSeconds();

    if (typeof init === 'string') {
      const s = init.trim();
      if (s.length === 0) return 0;

      // Accept integer-like seconds (e.g., "1234")
      if (/^-?\d+$/.test(s)) {
        return Number(s);
      }

      // Accept "hh:mm:ss", "mm:ss", or "hh:mm"
      if (s.includes(':')) {
        const parts = s.split(':').map((p) => p.trim());
        if (parts.length === 3) {
          const [h, m, sec] = parts.map(Number);
          if ([h, m, sec].every(isFiniteNumber)) {
            return Math.trunc(h) * 3600 + Math.trunc(m) * 60 + Math.trunc(sec);
          }
        } else if (parts.length === 2) {
          const [a, b] = parts.map(Number);
          if ([a, b].every(isFiniteNumber)) {
            // Default behavior: interpret as mm:ss
            // If you need hours:minutes, pass an object or 3-part string
            return Math.trunc(a) * 60 + Math.trunc(b);
          }
        }
      }

      // Fallback: not parseable, treat as 0
      return 0;
    }

    if (typeof init === 'number') {
      return Math.trunc(init);
    }

    if (typeof init === 'object' && init != null) {
      const {
        hours = 0,
        minutes = 0,
        seconds = 0,
      } = init as {
        hours?: number;
        minutes?: number;
        seconds?: number;
      };
      return Math.trunc(hours) * 3600 + Math.trunc(minutes) * 60 + Math.trunc(seconds);
    }

    return 0;
  }

  private static canonicalFromSeconds(totalSeconds: number): string {
    const sign = totalSeconds < 0 ? '-' : '';
    const abs = Math.abs(Math.trunc(totalSeconds));
    const hours = Math.floor(abs / 3600);
    const minutes = Math.floor((abs % 3600) / 60);
    const seconds = Math.floor(abs % 60);
    return sign + `${hours}:${this.pad(minutes, 2)}:${this.pad(seconds, 2)}`;
  }

  private static pad(n: number, width: number): string {
    const s = String(Math.trunc(Math.abs(n)));
    return s.length >= width ? s : '0'.repeat(width - s.length) + s;
  }
}
