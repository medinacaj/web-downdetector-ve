import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { incidents } from '@/lib/db/schema';
import { getServiceBySlug } from '@/lib/queries/services';
import { ok, apiError, parsePagination, withErrorHandling } from '@/lib/api/respond';

async function handleGET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service || !service.active) {
    return apiError('not_found', `El servicio "${slug}" no existe`);
  }

  const { searchParams } = new URL(request.url);
  const { limit, offset } = parsePagination(searchParams);

  const rows = await db
    .select()
    .from(incidents)
    .where(eq(incidents.serviceId, service.id))
    .orderBy(desc(incidents.startedAt))
    .limit(limit)
    .offset(offset);

  return ok(rows, { limit, offset });
}

export const GET = withErrorHandling(handleGET);
