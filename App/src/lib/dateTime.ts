export function formatDate(d: Date): string {
    return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
}

export function formatTime(d: Date, showSeconds?:boolean): string {
    return d.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', second: showSeconds ? '2-digit' : undefined});
}

export const timeToDate = (time: string | undefined | null): Date | undefined => {
    if (!time) return undefined;
    if (/^\d{4}-\d{2}-\d{2}T/.test(time)) {
        const d = new Date(time);
        return Number.isFinite(d.getTime()) ? d : undefined;
    }
    const [h, m, s] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, s, 0);
    return d;
};

export const dateToTimestamp = (date: Date | undefined | null): string | undefined => {
    if (!date) return undefined;
    const t = date.getTime();
    return Number.isFinite(t) ? String(t) : undefined;
}

export const timestampToDate = (timestamp: string | undefined | null): Date | undefined => {
    if (!timestamp) return undefined;
    const d = new Date(timestamp);
    return Number.isFinite(d.getTime()) ? d : undefined;
};
