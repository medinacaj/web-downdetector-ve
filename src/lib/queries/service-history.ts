import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { aggregatedWindows, baselines, reports } from '@/lib/db/schema';
import { historyLowerBound, toServiceHistory } from './service-history-series';
import { withHistoricalReference } from './historical-reference';

/**
 * Return actual public per-service report counts. Optionally overlay
 * historically sampled medians, but never fabricate typical counts when
 * the engine has not accumulated enough completed windows.
 */
export async function getServiceHistory(serviceId: string) {
  const now = new Date();
  const hourBucket = sql<Date>`date_trunc('hour', ${reports.createdAt})`;
  const [rows, referenceRows, latestWindow] = await Promise.all([
    db.select({ hour: hourBucket, count: sql<number>`count(*)::int` })
      .from(reports)
      .where(and(eq(reports.serviceId, serviceId), gte(reports.createdAt, historyLowerBound(now))))
      .groupBy(hourBucket)
      .orderBy(hourBucket),
    db.select({
      weekday: baselines.weekday,
      hour: baselines.hour,
      medianReports: baselines.medianReports,
      sampleSize: baselines.sampleSize,
    }).from(baselines)
      .where(and(eq(baselines.serviceId, serviceId), isNull(baselines.stateId))),
    db.select({ windowStart: aggregatedWindows.windowStart, windowEnd: aggregatedWindows.windowEnd })
      .from(aggregatedWindows)
      .where(and(eq(aggregatedWindows.serviceId, serviceId), isNull(aggregatedWindows.stateId)))
      .orderBy(desc(aggregatedWindows.windowStart))
      .limit(1),
  ]);

  const latest = latestWindow[0];
  const durationMs = latest?.windowEnd.getTime() - latest?.windowStart.getTime();
  const durationMinutes = Number.isFinite(durationMs) ? durationMs / 60_000 : 0;

  return withHistoricalReference(toServiceHistory(rows, now), referenceRows, durationMinutes);
}
