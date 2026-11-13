import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { reports } from '@/lib/db/schema';
import { reportSurgeScore } from './home-trends';

/**
 * Surge is a relative increase of non-suspicious, distinct-user reports,
 * not a statement of service availability. One grouped query for all services.
 */
export async function getRecentSurgeScores(now = new Date()): Promise<Map<string, number>> {
  const since30m = new Date(now.getTime() - 30 * 60 * 1000);
  const since150m = new Date(now.getTime() - 150 * 60 * 1000);

  const rows = await db.select({
    serviceId: reports.serviceId,
    recent30m: sql<number>`count(*) filter (where ${reports.createdAt} >= ${since30m.toISOString()})::int`,
    previous2h: sql<number>`count(*) filter (where ${reports.createdAt} < ${since30m.toISOString()})::int`,
    uniqueReporters30m: sql<number>`count(distinct ${reports.anonymousHash}) filter (where ${reports.createdAt} >= ${since30m.toISOString()})::int`,
  })
    .from(reports)
    .where(and(gte(reports.createdAt, since150m), eq(reports.suspicious, false)))
    .groupBy(reports.serviceId);
  return new Map(rows.map((row) => [row.serviceId, reportSurgeScore(row)]));
}
