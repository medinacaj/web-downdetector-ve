/** Pure hourly aggregation for detail charts; never creates activity not in the database. */
export type HistoryPeriod = '24h' | '7d' | '30d';
export interface HistoryPoint { label: string; reports: number; }
export type ServiceHistory = Record<HistoryPeriod, HistoryPoint[]>;
export interface HistoryHourRow { hour: Date | string; count: number; }

const HOUR_MS = 60 * 60 * 1000;
const PERIODS: readonly { key: HistoryPeriod; points: number; bucketHours: number }[] = [
  { key: '24h', points: 24, bucketHours: 1 },
  { key: '7d', points: 7, bucketHours: 24 },
  { key: '30d', points: 30, bucketHours: 24 },
];

export function historyLowerBound(now: Date): Date {
  const endHour = Math.floor(now.getTime() / HOUR_MS);
  return new Date((endHour - 30 * 24 + 1) * HOUR_MS);
}

/** Inclusive current hour, all chart buckets cover consecutive rolling hours. */
export function toServiceHistory(rows: readonly HistoryHourRow[], now: Date): ServiceHistory {
  const endHour = Math.floor(now.getTime() / HOUR_MS);
  const hourly = new Map<number, number>();
  for (const row of rows) {
    const timestamp = new Date(row.hour).getTime();
    if (!Number.isFinite(timestamp) || !Number.isFinite(row.count) || row.count <= 0) continue;
    const key = Math.floor(timestamp / HOUR_MS);
    if (key > endHour || key < endHour - 30 * 24 + 1) continue;
    hourly.set(key, (hourly.get(key) ?? 0) + Math.trunc(row.count));
  }
  const result = {} as ServiceHistory;
  for (const period of PERIODS) {
    const startHour = endHour - period.points * period.bucketHours + 1;
    const series: HistoryPoint[] = [];
    for (let index = 0; index < period.points; index++) {
      const lower = startHour + index * period.bucketHours;
      let count = 0;
      for (let hour = lower; hour < lower + period.bucketHours; hour++) {
        count += hourly.get(hour) ?? 0;
      }
      const bucketEnd = new Date((lower + period.bucketHours - 1) * HOUR_MS);
      const label = period.key === '24h'
        ? new Intl.DateTimeFormat('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', hour12: false }).format(bucketEnd)
        : new Intl.DateTimeFormat('es-VE', { timeZone: 'America/Caracas', day: '2-digit', month: 'short' }).format(bucketEnd);
      series.push({ label, reports: count });
    }
    result[period.key] = series;
  }
  return result;
}
