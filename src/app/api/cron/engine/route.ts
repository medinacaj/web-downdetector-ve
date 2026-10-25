import { createHash, timingSafeEqual } from 'node:crypto';
import { ok, apiError, withErrorHandling } from '@/lib/api/respond';
import { DEFAULT_WINDOW_MINUTES } from '@/lib/engine/parameters';
import { lastProcessedWindowStart, runEngineCycle, windowsToProcess } from '@/lib/engine/cycle';

export const dynamic = 'force-dynamic';
// Un ciclo con 71 servicios tarda alrededor de 1 s en local; margen para una base remota
// y para recuperar varias ventanas. Si se acerca al límite, se detiene y la siguiente
// ejecución continúa desde la última ventana procesada.
export const maxDuration = 60;
const TIME_BUDGET_MS = 40_000;

/** Compara en tiempo constante (los hashes igualan la longitud). */
function sameSecret(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Tarea programada del motor (GitHub Actions cada 15 min, ver
 * .github/workflows/engine-cron.yml). Procesa la última ventana cerrada y,
 * si se perdieron ejecuciones, las ventanas cerradas pendientes (windowsToProcess).
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

  const started = Date.now();
  const pending = windowsToProcess(await lastProcessedWindowStart(), new Date(started), DEFAULT_WINDOW_MINUTES);
  const processed: { windowStart: string; servicesScored: number; incidentChanges: number }[] = [];
  for (const [i, windowStart] of pending.entries()) {
    if (i > 0 && Date.now() - started > TIME_BUDGET_MS) break;
    // Las líneas base se recalculan una vez por ejecución, no por cada ventana recuperada.
    const result = await runEngineCycle(windowStart, DEFAULT_WINDOW_MINUTES, undefined, { recomputeBaselines: i === 0 });
    processed.push({
      windowStart: result.windowStart.toISOString(),
      servicesScored: result.servicesScored,
      incidentChanges: result.incidentActions.length,
    });
  }
  return ok({ windowMinutes: DEFAULT_WINDOW_MINUTES, pending: pending.length, processed });
}

export const GET = withErrorHandling(handle);
export const POST = withErrorHandling(handle);
