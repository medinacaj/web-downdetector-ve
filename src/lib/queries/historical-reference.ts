import { getCaracasWeekdayHour } from '@/lib/engine/time-bucket';
import type { HistoryPeriod, ServiceHistory } from './service-history-series';

export interface BaselineReferenceRow {
  weekday: number;
  hour: number;
  medianReports: number;
  sampleSize: number;
}

const HOUR_MS = 60 * 60_000;
const KEYS: readonly HistoryPeriod[] = ['24h', '7d', '30d', '90d'];
const MIN_SAMPLES = 3;

/**
 * Optional estimated comparison, not a measurement of availability.
 * A bucket is only comparable if EVERY hour in it has observed historical
 * reference samples. We never substitute zero for a missing observation.
 */
export function withHistoricalReference(
  history: ServiceHistory,
  baselineRows: readonly BaselineReferenceRow[],
  windowMinutes: number,
): ServiceHistory {
  if (!Number.isInteger(windowMinutes) || windowMinutes < 1 || HOUR_MS % (windowMinutes * 60_000) !== 0) {
    return history;
  }
  const windowsPerHour = 60 / windowMinutes;
  const baseline = new Map<string, number>();
  for (const row of baselineRows) {
    if (row.sampleSize < MIN_SAMPLES || !Number.isFinite(row.medianReports)
      || row.medianReports < 0 || row.weekday < 0 || row.weekday > 6
      || row.hour < 0 || row.hour > 23) continue;
    baseline.set(`${row.weekday}:${row.hour}`, row.medianReports * windowsPerHour);
  }

  const output = { ...history };
  for (const key of KEYS) {
    output[key] = history[key].map((point) => {
      const start = Date.parse(point.startIso);
      const end = Date.parse(point.endIso);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start
          || (end - start) % HOUR_MS !== 0) {
        return { ...point, typicalReports: null };
      }
      let typical = 0;
      for (let instant = start; instant < end; instant += HOUR_MS) {
        const { weekday, hour } = getCaracasWeekdayHour(new Date(instant));
        const expected = baseline.get(`${weekday}:${hour}`);
        if (expected === undefined) return { ...point, typicalReports: null };
        typical += expected;
      }
      return { ...point, typicalReports: Math.round(typical * 10) / 10 };
    });
  }
  return output;
}
