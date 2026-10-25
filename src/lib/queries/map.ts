import { and, asc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { states, reports, services } from '@/lib/db/schema';

export interface StateActivity {
  code: string;
  name: string;
  gridRow: number;
  gridCol: number;
  totalReports: number;
  uniqueReporters: number;
}

/** Límite de la ventana consultable (30 días). */
export const MAX_MAP_HOURS = 24 * 30;

/**
 * Reportes agregados por estado en las últimas `hours` horas, opcionalmente de un
 * servicio. Solo agregados: nunca coordenadas ni reportes individuales (brief,
 * secciones 7.4 y 12). Lo usan GET /api/map y la página /mapa.
 *
 * Devuelve null si `serviceSlug` no existe.
 */
export async function getStateActivity(params: {
  hours: number;
  serviceSlug?: string | null;
  now?: Date;
}): Promise<StateActivity[] | null> {
  const hours = Math.min(Math.max(params.hours, 1), MAX_MAP_HOURS);
  const since = new Date((params.now ?? new Date()).getTime() - hours * 60 * 60 * 1000);

  let serviceId: string | undefined;
  if (params.serviceSlug) {
    const svc = await db.select({ id: services.id }).from(services).where(eq(services.slug, params.serviceSlug)).limit(1);
    if (svc.length === 0) return null;
    serviceId = svc[0].id;
  }

  // Los filtros sobre `reports` van en el ON del LEFT JOIN, no en un WHERE
  // aparte: si fueran WHERE, cualquier estado sin reportes en la ventana
  // quedaría excluido del resultado en vez de aparecer con conteo 0.
  const joinConditions = [eq(reports.stateId, states.id), gte(reports.createdAt, since)];
  if (serviceId) joinConditions.push(eq(reports.serviceId, serviceId));

  return db
    .select({
      code: states.code,
      name: states.name,
      gridRow: states.gridRow,
      gridCol: states.gridCol,
      totalReports: sql<number>`count(${reports.id})::int`,
      uniqueReporters: sql<number>`count(distinct ${reports.anonymousHash})::int`,
    })
    .from(states)
    .leftJoin(reports, and(...joinConditions))
    .where(eq(states.active, true))
    .groupBy(states.id)
    .orderBy(asc(states.name));
}
