import { and, eq, gte, isNull, lt, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { reports, baselines, incidents } from '@/lib/db/schema';
import { getCaracasWeekdayHour } from '@/lib/engine/time-bucket';
import { MIN_BASELINE_SAMPLES_FOR_STATUS } from '@/lib/engine/parameters';
import {
  buildHistorySeries,
  clipToRange,
  floorToWindow,
  HISTORY_HOURS,
  HISTORY_WINDOW_MINUTES,
  type HistoryPoint,
} from '@/lib/history';

export interface ServiceHistory {
  points: HistoryPoint[];
  incidents: { from: number; to: number; status: string }[];
  rangeStart: number;
  rangeEnd: number;
  totalReports: number;
  hasExpected: boolean;
}

/**
 * Reportes por ventana de 15 minutos en las últimas 24 horas, con "lo habitual" (la
 * mediana de la línea base de esa franja día×hora de Caracas, la misma que usa el
 * motor) solo donde hay historia suficiente, y los incidentes que se solapan.
 */
export async function getServiceHistory(serviceId: string, now: Date = new Date()): Promise<ServiceHistory> {
  const windowMs = HISTORY_WINDOW_MINUTES * 60_000;
  const rangeEnd = floorToWindow(now).getTime() + windowMs;
  const rangeStart = rangeEnd - HISTORY_HOURS * 60 * 60_000;
  const since = new Date(rangeStart);
  const until = new Date(rangeEnd);

  const [countRows, baselineRows, incidentRows] = await Promise.all([
    db
      .select({
        windowStart: sql<number>`(floor(extract(epoch from ${reports.createdAt}) / ${windowMs / 1000}) * ${windowMs})::bigint`,
        n: sql<number>`count(*)::int`,
      })
      .from(reports)
      .where(and(eq(reports.serviceId, serviceId), gte(reports.createdAt, since), lt(reports.createdAt, until)))
      .groupBy(sql`1`),
    db
      .select({
        weekday: baselines.weekday,
        hour: baselines.hour,
        median: baselines.medianReports,
        sampleSize: baselines.sampleSize,
      })
      .from(baselines)
      .where(and(eq(baselines.serviceId, serviceId), isNull(baselines.stateId))),
    db
      .select({ startedAt: incidents.startedAt, endedAt: incidents.endedAt, status: incidents.status })
      .from(incidents)
      .where(
        and(
          eq(incidents.serviceId, serviceId),
          lt(incidents.startedAt, until),
          or(isNull(incidents.endedAt), gte(incidents.endedAt, since)),
        ),
      ),
  ]);

  const counts = new Map(countRows.map((r) => [Number(r.windowStart), r.n]));
  const expectedByBucket = new Map(
    baselineRows
      .filter((b) => b.sampleSize >= MIN_BASELINE_SAMPLES_FOR_STATUS)
      .map((b) => [`${b.weekday}-${b.hour}`, b.median]),
  );
  const points = buildHistorySeries(now, counts, (d) => {
    const { weekday, hour } = getCaracasWeekdayHour(d);
    return expectedByBucket.get(`${weekday}-${hour}`) ?? null;
  });

  return {
    points,
    incidents: incidentRows.flatMap((i) => {
      const clipped = clipToRange(i.startedAt, i.endedAt, rangeStart, rangeEnd);
      return clipped ? [{ ...clipped, status: i.status as string }] : [];
    }),
    rangeStart,
    rangeEnd,
    totalReports: points.reduce((sum, p) => sum + p.reports, 0),
    hasExpected: points.some((p) => p.expected !== null),
  };
}
