import { getServiceBySlug } from '@/lib/queries/services';
import { ok, apiError, withErrorHandling } from '@/lib/api/respond';

async function handleGET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service || !service.active) {
    return apiError('not_found', `El servicio "${slug}" no existe`);
  }

  return ok(service);
}

export const GET = withErrorHandling(handleGET);
