import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { incidents, services, categories, incidentStatusEnum } from '@/lib/db/schema';
import { ok, apiError, parsePagination, withErrorHandling } from '@/lib/api/respond';

const VALID_STATUSES = new Set(incidentStatusEnum.enumValues);

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { limit, offset } = parsePagination(searchParams);
  const serviceSlug = searchParams.get('service');
  const categorySlug = searchParams.get('category');
  const statusParam = searchParams.get('status'); // coma-separado, ej. "possible,detected"

  const conditions = [];

  if (statusParam) {
    const statuses = statusParam.split(',').map((s) => s.trim());
    const invalid = statuses.filter((s) => !VALID_STATUSES.has(s as never));
    if (invalid.length > 0) {
      return apiError('validation_error', `Estado(s) de incidente inválido(s): ${invalid.join(', ')}`);
    }
    conditions.push(inArray(incidents.status, statuses as (typeof incidentStatusEnum.enumValues)[number][]));
  }

  if (serviceSlug) {
    const svc = await db.select({ id: services.id }).from(services).where(eq(services.slug, serviceSlug)).limit(1);
    if (svc.length === 0) return apiError('not_found', `El servicio "${serviceSlug}" no existe`);
    conditions.push(eq(incidents.serviceId, svc[0].id));
  }

  if (categorySlug) {
    const svcIdsInCategory = db
      .select({ id: services.id })
      .from(services)
      .innerJoin(categories, eq(categories.id, services.categoryId))
      .where(eq(categories.slug, categorySlug));
    conditions.push(inArray(incidents.serviceId, svcIdsInCategory));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: incidents.id,
      status: incidents.status,
      confidence: incidents.confidence,
      severity: incidents.severity,
      startedAt: incidents.startedAt,
      peakAt: incidents.peakAt,
      endedAt: incidents.endedAt,
      summary: incidents.summary,
      officiallyConfirmed: incidents.officiallyConfirmed,
      service: { slug: services.slug, name: services.name },
    })
    .from(incidents)
    .innerJoin(services, eq(services.id, incidents.serviceId))
    .where(where)
    .orderBy(desc(incidents.startedAt))
    .limit(limit)
    .offset(offset);

  return ok(rows, { limit, offset });
}

export const GET = withErrorHandling(handleGET);
