export function formatDateTime(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return "Not available";
  return new Intl.NumberFormat("en").format(value);
}

export function formatFileSize(bytes?: number | null) {
  if (bytes === null || bytes === undefined) return "Not available";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatWeightGrams(value?: number | null) {
  if (value === null || value === undefined) return "Not available";
  return `${(value / 1000).toFixed(1)} kg`;
}

export function formatDuration(start: string, end?: string | null) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate.getTime() < startDate.getTime()
  ) {
    return "Not available";
  }

  const diffMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m`;
}
