import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { reports, issueTypes, states } from '@/lib/db/schema';
import { getServiceBySlug } from '@/lib/queries/services';
import { ok, apiError, parsePagination, withErrorHandling } from '@/lib/api/respond';

/**
 * Deliberadamente NO expone: anonymous_hash, ip_prefix_hash, comment,
 * suspicious. `comment` queda fuera hasta que exista moderación (Etapa 6/7,
 * brief sección 7.3: "sin moderación no se publican comentarios"). El resto
 * son campos de identidad pseudónima que nunca se sirven por la API
 * pública (brief, sección 12.2).
 */
async function handleGET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service || !service.active) {
    return apiError('not_found', `El servicio "${slug}" no existe`);
  }

  const { searchParams } = new URL(request.url);
  const { limit, offset } = parsePagination(searchParams);

  const rows = await db
    .select({
      id: reports.id,
      createdAt: reports.createdAt,
      issueType: { slug: issueTypes.slug, name: issueTypes.name },
      state: { code: states.code, name: states.name },
      cityText: reports.cityText,
      networkCarrier: reports.networkCarrier,
    })
    .from(reports)
    .innerJoin(issueTypes, eq(issueTypes.id, reports.issueTypeId))
    .innerJoin(states, eq(states.id, reports.stateId))
    .where(eq(reports.serviceId, service.id))
    .orderBy(desc(reports.createdAt))
    .limit(limit)
    .offset(offset);

  return ok(rows, { limit, offset });
}

export const GET = withErrorHandling(handleGET);
