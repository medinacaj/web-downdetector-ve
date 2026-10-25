import { getServiceBySlug } from '@/lib/queries/services';
import { getServiceStatusDetail } from '@/lib/queries/status';
import { getEngineFreshness } from '@/lib/queries/engine';
import { ok, apiError, withErrorHandling } from '@/lib/api/respond';

async function handleGET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service || !service.active) {
    return apiError('not_found', `El servicio "${slug}" no existe`);
  }

  const [detail, engine] = await Promise.all([getServiceStatusDetail(service.id), getEngineFreshness()]);
  // Si el motor está detenido el estado puede estar desactualizado: el cliente debe poder saberlo.
  return ok(detail, { engine: { state: engine.state, lastRunAt: engine.lastRunAt?.toISOString() ?? null } });
}

export const GET = withErrorHandling(handleGET);
