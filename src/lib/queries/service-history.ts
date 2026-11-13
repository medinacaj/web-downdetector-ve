import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { reports } from '@/lib/db/schema';
import { historyLowerBound, toServiceHistory } from './service-history-series';

/** Only aggregate per-service public counts; never expose identities or comments. */
export async function getServiceHistory(serviceId: string) {
  const now = new Date();
  const hourBucket = sql<Date>`date_trunc('hour', ${reports.createdAt})`;
  const rows = await db
    .select({ hour: hourBucket, count: sql<number>`count(*)::int` })
    .from(reports)
    .where(and(eq(reports.serviceId, serviceId), gte(reports.createdAt, historyLowerBound(now))))
    .groupBy(hourBucket)
    .orderBy(hourBucket);
  return toServiceHistory(rows, now);
}
