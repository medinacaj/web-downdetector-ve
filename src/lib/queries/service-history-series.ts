/** Timestamped buckets for service chart: never invent or interpolate reports. */
export type HistoryPeriod = '24h' | '7d' | '30d' | '90d';
export interface HistoryPoint {
  label: string;
  reports: number;
  startIso: string;
  endIso: string;
}
export type ServiceHistory = Record<HistoryPeriod, HistoryPoint[]>;
export interface HistoryHourRow { hour: Date | string; count: number; }

const HOUR_MS = 60 * 60 * 1000;
const PERIODS: readonly { key: HistoryPeriod; points: number; bucketHours: number }[] = [
  { key: '24h', points: 24, bucketHours: 1 },
  { key: '7d', points: 7, bucketHours: 24 },
  { key: '30d', points: 30, bucketHours: 24 },
  { key: '90d', points: 90, bucketHours: 24 },
];

export function historyLowerBound(now: Date): Date {
  const endHour = Math.floor(now.getTime() / HOUR_MS);
  return new Date((endHour - 90 * 24 + 1) * HOUR_MS);
}

export function toServiceHistory(rows: readonly HistoryHourRow[], now: Date): ServiceHistory {
  const endHour = Math.floor(now.getTime() / HOUR_MS);
  const hourly = new Map<number, number>();
  for (const row of rows) {
    const ms = new Date(row.hour).getTime();
    if (!Number.isFinite(ms) || !Number.isFinite(row.count) || row.count <= 0) continue;
    const hour = Math.floor(ms / HOUR_MS);
    if (hour > endHour || hour < endHour - 90 * 24 + 1) continue;
    hourly.set(hour, (hourly.get(hour) ?? 0) + Math.trunc(row.count));
  }
  const history = {} as ServiceHistory;
  for (const period of PERIODS) {
    const startHour = endHour - period.points * period.bucketHours + 1;
    history[period.key] = Array.from({ length: period.points }, (_, i) => {
      const lower = startHour + i * period.bucketHours;
      let reports = 0;
      for (let hour = lower; hour < lower + period.bucketHours; hour++) {
        reports += hourly.get(hour) ?? 0;
      }
      const from = new Date(lower * HOUR_MS);
      const until = new Date((lower + period.bucketHours) * HOUR_MS);
      const label = period.key === '24h'
        ? new Intl.DateTimeFormat('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: false }).format(from)
        : new Intl.DateTimeFormat('es-VE', { timeZone: 'America/Caracas', day: '2-digit', month: 'short' }).format(from);
      return { label, reports, startIso: from.toISOString(), endIso: until.toISOString() };
    });
  }
  return history;
}

/** UTC instant range check; avoids timezone-only comparisons and off-by-one days. */
export function incidentInBucket(incidentIso: string, point: Pick<HistoryPoint, 'startIso' | 'endIso'>): boolean {
  const ms = Date.parse(incidentIso);
  return Number.isFinite(ms) && ms >= Date.parse(point.startIso) && ms < Date.parse(point.endIso);
}

/**
 * Resolve chart clicks by their axis label rather than a visible-range index.
 * A Recharts Brush can shift the visible range and change tooltip indices.
 * Labels are unique within a 24h, 7d, 30d or 90d history series.
 */
export function historyIndexFromLabel(points: readonly HistoryPoint[], label: string | number | undefined): number {
  if (label === undefined) return -1;
  return points.findIndex((point) => point.label === String(label));
}
