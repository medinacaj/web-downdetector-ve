import { and, asc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { states, reports, services } from '@/lib/db/schema';
import { ok, apiError, withErrorHandling } from '@/lib/api/respond';

/**
 * Solo agregados por estado — nunca coordenadas ni reportes individuales
 * (brief, secciones 7.4 y 12). El drill-down municipal, con su propio
 * umbral mínimo de privacidad, queda pendiente hasta que existan datos de
 * municipios y volumen real de reportes (ver README, limitaciones).
 */
async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hoursParam = Number(searchParams.get('hours') ?? '24');
  const hours = Number.isFinite(hoursParam) && hoursParam > 0 ? Math.min(hoursParam, 24 * 30) : 24;
  const serviceSlug = searchParams.get('service');

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  let serviceId: string | undefined;
  if (serviceSlug) {
    const svc = await db.select({ id: services.id }).from(services).where(eq(services.slug, serviceSlug)).limit(1);
    if (svc.length === 0) return apiError('not_found', `El servicio "${serviceSlug}" no existe`);
    serviceId = svc[0].id;
  }

  // Los filtros sobre `reports` van en el ON del LEFT JOIN, no en un WHERE
  // aparte: si fueran WHERE, cualquier estado sin reportes en la ventana
  // quedaría excluido del resultado en vez de aparecer con conteo 0.
  const joinConditions = [eq(reports.stateId, states.id), gte(reports.createdAt, since)];
  if (serviceId) joinConditions.push(eq(reports.serviceId, serviceId));

  const rows = await db
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

  return ok(rows, { hours, service: serviceSlug ?? null });
}

export const GET = withErrorHandling(handleGET);
