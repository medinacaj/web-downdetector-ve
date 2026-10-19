import { createHash, timingSafeEqual } from 'node:crypto';
import { ok, apiError, withErrorHandling } from '@/lib/api/respond';
import { DEFAULT_WINDOW_MINUTES } from '@/lib/engine/parameters';
import { lastCompletedWindowStart, runEngineCycle } from '@/lib/engine/cycle';

export const dynamic = 'force-dynamic';
// Un ciclo con 71 servicios tarda pocos segundos en local; margen para una base remota.
export const maxDuration = 60;

/** Compara en tiempo constante (los hashes igualan la longitud). */
function sameSecret(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Tarea programada del motor (GitHub Actions cada 15 min, ver
 * .github/workflows/engine-cron.yml). Procesa la última ventana cerrada.
 * Exige `Authorization: Bearer <CRON_SECRET>` (la misma convención que Vercel
 * Cron); sin CRON_SECRET configurada falla cerrada (503): nadie puede
 * dispararla.
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 32) {
    return apiError('service_unavailable', 'La tarea programada no está configurada.');
  }
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !sameSecret(token, secret)) {
    return apiError('unauthorized', 'No autorizado.');
  }

  const windowStart = lastCompletedWindowStart(new Date(), DEFAULT_WINDOW_MINUTES);
  const result = await runEngineCycle(windowStart, DEFAULT_WINDOW_MINUTES);
  return ok({
    windowStart: result.windowStart.toISOString(),
    windowMinutes: result.windowMinutes,
    servicesAggregated: result.servicesAggregated,
    servicesScored: result.servicesScored,
    incidentChanges: result.incidentActions.length,
  });
}

export const GET = withErrorHandling(handle);
export const POST = withErrorHandling(handle);
