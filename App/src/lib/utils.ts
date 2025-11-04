
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formats a variety of date-like inputs defensively
export type FormatDateOptions = {
  format?: 'datetime' | 'date' | 'time' | 'iso' | 'utc' | 'duration';
  locale?: string | string[];
  options?: Intl.DateTimeFormatOptions;
  dateStyle?: Intl.DateTimeFormatOptions['dateStyle'];
  timeStyle?: Intl.DateTimeFormatOptions['timeStyle'];
};

export function formatDateLike(value: unknown, opts: FormatDateOptions = {}): string {
  const d = toValidDate(value);
  if (!d) return 'N/A';

  const { format = 'datetime', locale, options, dateStyle, timeStyle } = opts;
  const fmt: Intl.DateTimeFormatOptions | undefined =
    options || dateStyle || timeStyle ? { ...options, dateStyle, timeStyle } : options;

  try {
    switch (format) {
      case 'duration':
        const now = new Date();
        const diffMs = Math.abs(now.getTime() - d.getTime());
        const diffSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(diffSecs / 3600);
        const minutes = Math.floor((diffSecs % 3600) / 60);
        const seconds = diffSecs % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
      case 'iso':
        return d.toISOString();
      case 'utc':
        return d.toUTCString();
      case 'date':
        return d.toLocaleDateString(locale, fmt);
      case 'time':
        return d.toLocaleTimeString(locale, fmt);
      case 'datetime':
      default:
        return d.toLocaleString(locale, fmt);
    }
  } catch {
    return 'N/A';
  }
}

function toValidDate(value: unknown): Date | null {
  try {
    if (value == null) return null;

    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'number') {
      const ms = value < 1e12 ? value * 1000 : value;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }

    if (typeof value === 'string') {
      const s = value.trim();
      if (/^\d+$/.test(s)) {
        const num = Number(s);
        const ms = num < 1e12 ? num * 1000 : num;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) return d;
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }

    if (typeof value === 'object') {
      const d = (value as any)?.toDate?.();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    }
  } catch {
    // ignore
  }
  return null;
}
