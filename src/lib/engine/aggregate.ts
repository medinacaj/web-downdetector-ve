import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { services, reports, aggregatedWindows } from '@/lib/db/schema';

/**
 * Calcula UNA ventana [windowStart, windowEnd) por servicio, más una fila
 * por cada estado con actividad en esa ventana (brief, sección 9.2 —
 * ventanas configurables; aquí en minutos). La fila "service-wide" tiene
 * state_id = null; sirve tanto para el score general del servicio como
 * para poblar incident_regions cuando se abre un incidente.
 *
 * Idempotencia: se borran las filas existentes de (service_id,
 * window_start) antes de insertar — no se usa upsert porque el único
 * índice existente en aggregated_windows no es UNIQUE, y aunque lo fuera,
 * state_id nullable rompería la unicidad (NULL != NULL en Postgres). Borrar
 * y reinsertar es correcto y más simple para un job que recalcula la
 * ventana completa cada vez, no la actualiza incrementalmente.
 *
 * No escribe anomaly_score/confidence/technical_score aquí — eso es
 * anomaly.ts, que necesita el baseline ya calculado. Aquí solo se cuenta.
 */
export interface AggregateResult {
  serviceId: string;
  windowStart: Date;
  windowEnd: Date;
  totalReports: number;
  uniqueReporters: number;
  distinctStates: number;
}

export async function aggregateWindow(
  windowStart: Date,
  windowMinutes: number,
): Promise<AggregateResult[]> {
  const windowEnd = new Date(windowStart.getTime() + windowMinutes * 60_000);

  const activeServices = await db.select({ id: services.id }).from(services).where(eq(services.active, true));

  const results: AggregateResult[] = [];

  for (const service of activeServices) {
    const inWindow = and(
      eq(reports.serviceId, service.id),
      gte(reports.createdAt, windowStart),
      lt(reports.createdAt, windowEnd),
    );

    const [serviceWide] = await db
      .select({
        total: sql<number>`count(*)::int`,
        unique: sql<number>`count(distinct ${reports.anonymousHash})::int`,
        // weighted: pondera menos los reportes marcados sospechosos en vez
        // de excluirlos — se conservan para auditoría (sección 11) pero
        // pesan 0.2 en vez de 1 en el conteo ponderado.
        weighted: sql<number>`coalesce(sum(case when ${reports.suspicious} then 0.2 else 1 end), 0)::real`,
      })
      .from(reports)
      .where(inWindow);

    const perState = await db
      .select({
        stateId: reports.stateId,
        total: sql<number>`count(*)::int`,
        unique: sql<number>`count(distinct ${reports.anonymousHash})::int`,
        weighted: sql<number>`coalesce(sum(case when ${reports.suspicious} then 0.2 else 1 end), 0)::real`,
      })
      .from(reports)
      .where(inWindow)
      .groupBy(reports.stateId);

    await db
      .delete(aggregatedWindows)
      .where(and(eq(aggregatedWindows.serviceId, service.id), eq(aggregatedWindows.windowStart, windowStart)));

    await db.insert(aggregatedWindows).values({
      serviceId: service.id,
      stateId: null,
      windowStart,
      windowEnd,
      totalReports: serviceWide?.total ?? 0,
      uniqueReporters: serviceWide?.unique ?? 0,
      weightedReports: serviceWide?.weighted ?? 0,
      anomalyScore: 0, // lo completa anomaly.ts
      technicalScore: 0,
      confidence: 0,
    });

    for (const row of perState) {
      if (!row.stateId) continue;
      await db.insert(aggregatedWindows).values({
        serviceId: service.id,
        stateId: row.stateId,
        windowStart,
        windowEnd,
        totalReports: row.total,
        uniqueReporters: row.unique,
        weightedReports: row.weighted,
        anomalyScore: 0,
        technicalScore: 0,
        confidence: 0,
      });
    }

    results.push({
      serviceId: service.id,
      windowStart,
      windowEnd,
      totalReports: serviceWide?.total ?? 0,
      uniqueReporters: serviceWide?.unique ?? 0,
      distinctStates: perState.filter((r) => r.stateId).length,
    });
  }

  return results;
}
