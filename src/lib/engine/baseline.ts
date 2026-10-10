import { and, eq, gte, isNull, lt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { services, aggregatedWindows, baselines } from '@/lib/db/schema';
import { getCaracasWeekdayHour } from './time-bucket';
import { median, medianAbsoluteDeviation } from './robust-stats';

const LOOKBACK_DAYS = Number(process.env.BASELINE_LOOKBACK_DAYS ?? 90);

/**
 * Recalcula baselines para todos los servicios activos a partir del
 * historial de aggregated_windows (service-wide y por estado por
 * separado). El bucketing por (weekday, hour) se hace en memoria, no en
 * SQL — con el volumen actual (MVP) es simple y suficiente; si el volumen
 * crece, migrar a EXTRACT(dow/hour FROM window_start AT TIME ZONE
 * 'America/Caracas') es la optimización natural, no resuelta aquí.
 *
 * Idempotente vía borrar-e-insertar por el mismo motivo que aggregate.ts:
 * `baselines_unique_bucket` sí es UNIQUE, pero con state_id nullable un
 * upsert dirigido a ese índice no deduplicaría correctamente las filas
 * service-wide (NULL != NULL en Postgres).
 */
export async function recomputeBaselines(now: Date = new Date()): Promise<{ bucketsUpdated: number }> {
  const since = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const activeServices = await db.select({ id: services.id }).from(services).where(eq(services.active, true));

  let bucketsUpdated = 0;

  for (const service of activeServices) {
    const historical = await db
      .select({
        stateId: aggregatedWindows.stateId,
        windowStart: aggregatedWindows.windowStart,
        totalReports: aggregatedWindows.totalReports,
      })
      .from(aggregatedWindows)
      .where(
        and(
          eq(aggregatedWindows.serviceId, service.id),
          gte(aggregatedWindows.windowStart, since),
          lt(aggregatedWindows.windowStart, now),
        ),
      );

    type Bucket = { stateId: string | null; weekday: number; hour: number; values: number[] };
    const buckets = new Map<string, Bucket>();

    for (const row of historical) {
      const { weekday, hour } = getCaracasWeekdayHour(row.windowStart);
      const key = `${row.stateId ?? 'null'}:${weekday}:${hour}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.values.push(row.totalReports);
      } else {
        buckets.set(key, { stateId: row.stateId, weekday, hour, values: [row.totalReports] });
      }
    }

    for (const bucket of buckets.values()) {
      const m = median(bucket.values);
      const mad = medianAbsoluteDeviation(bucket.values, m);

      await db
        .delete(baselines)
        .where(
          and(
            eq(baselines.serviceId, service.id),
            bucket.stateId ? eq(baselines.stateId, bucket.stateId) : isNull(baselines.stateId),
            eq(baselines.weekday, bucket.weekday),
            eq(baselines.hour, bucket.hour),
          ),
        );

      await db.insert(baselines).values({
        serviceId: service.id,
        stateId: bucket.stateId,
        weekday: bucket.weekday,
        hour: bucket.hour,
        medianReports: m,
        dispersion: mad > 0 ? mad : 1, // nunca 0 — evita división por cero en anomaly.ts
        sampleSize: bucket.values.length,
      });
      bucketsUpdated++;
    }
  }

  return { bucketsUpdated };
}
