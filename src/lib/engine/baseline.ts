import { and, eq, gte, lt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { services, aggregatedWindows, baselines } from '@/lib/db/schema';
import { getCaracasWeekdayHour } from './time-bucket';
import { median, medianAbsoluteDeviation } from './robust-stats';

const LOOKBACK_DAYS = Number(process.env.BASELINE_LOOKBACK_DAYS ?? 90);
const INSERT_BATCH_SIZE = 200;

export interface HistoricalWindow {
  stateId: string | null;
  windowStart: Date;
  totalReports: number;
}

export interface BaselineBucket {
  stateId: string | null;
  weekday: number;
  hour: number;
  medianReports: number;
  dispersion: number;
  sampleSize: number;
}

/**
 * Compute the robust reference from windows actually processed by the engine.
 * Missing scheduler runs are missing evidence, NOT zero-report observations.
 * Zero-report windows are valid only when they were really aggregated.
 */
export function buildBaselineBuckets(historical: readonly HistoricalWindow[]): BaselineBucket[] {
  type Bucket = { stateId: string | null; weekday: number; hour: number; values: number[] };
  const buckets = new Map<string, Bucket>();
  for (const row of historical) {
    if (!Number.isFinite(row.totalReports) || row.totalReports < 0
        || !Number.isFinite(row.windowStart.getTime())) continue;
    const { weekday, hour } = getCaracasWeekdayHour(row.windowStart);
    const key = `${row.stateId ?? 'null'}:${weekday}:${hour}`;
    const existing = buckets.get(key);
    if (existing) existing.values.push(row.totalReports);
    else buckets.set(key, { stateId: row.stateId, weekday, hour, values: [row.totalReports] });
  }
  return [...buckets.values()].map(({ stateId, weekday, hour, values }) => {
    const m = median(values);
    const mad = medianAbsoluteDeviation(values, m);
    return {
      stateId, weekday, hour, medianReports: m,
      dispersion: mad > 0 ? mad : 1,
      sampleSize: values.length,
    };
  });
}

/**
 * Refresh baselines from the last LOOKBACK_DAYS, excluding the current
 * evaluation window. This prevents an incident from contaminating its own
 * reference. A per-service transaction atomically replaces old buckets,
 * removing stale references when observations age out of the lookback.
 */
export async function recomputeBaselines(now: Date = new Date()): Promise<{ bucketsUpdated: number }> {
  const since = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const activeServices = await db.select({ id: services.id })
    .from(services).where(eq(services.active, true));

  let bucketsUpdated = 0;
  for (const service of activeServices) {
    const historical = await db.select({
      stateId: aggregatedWindows.stateId,
      windowStart: aggregatedWindows.windowStart,
      totalReports: aggregatedWindows.totalReports,
    }).from(aggregatedWindows).where(and(
      eq(aggregatedWindows.serviceId, service.id),
      gte(aggregatedWindows.windowStart, since),
      lt(aggregatedWindows.windowStart, now),
    ));

    const rows = buildBaselineBuckets(historical).map((bucket) => ({
      ...bucket, serviceId: service.id,
    }));

    await db.transaction(async (tx) => {
      await tx.delete(baselines).where(eq(baselines.serviceId, service.id));
      for (let index = 0; index < rows.length; index += INSERT_BATCH_SIZE) {
        await tx.insert(baselines).values(rows.slice(index, index + INSERT_BATCH_SIZE));
      }
    });
    bucketsUpdated += rows.length;
  }

  return { bucketsUpdated };
}
