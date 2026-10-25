import { ok, apiError, withErrorHandling } from '@/lib/api/respond';
import { getStateActivity, MAX_MAP_HOURS } from '@/lib/queries/map';

/**
 * Solo agregados por estado — nunca coordenadas ni reportes individuales
 * (brief, secciones 7.4 y 12). El drill-down municipal, con su propio
 * umbral mínimo de privacidad, queda pendiente hasta que existan datos de
 * municipios y volumen real de reportes (ver README, limitaciones).
 */
async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hoursParam = Number(searchParams.get('hours') ?? '24');
  const hours = Number.isFinite(hoursParam) && hoursParam > 0 ? Math.min(hoursParam, MAX_MAP_HOURS) : 24;
  const serviceSlug = searchParams.get('service');

  const rows = await getStateActivity({ hours, serviceSlug });
  if (rows === null) return apiError('not_found', `El servicio "${serviceSlug}" no existe`);

  return ok(rows, { hours, service: serviceSlug ?? null });
}

export const GET = withErrorHandling(handleGET);
