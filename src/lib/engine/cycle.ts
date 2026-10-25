import { and, eq, isNull, max } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { services, aggregatedWindows } from '@/lib/db/schema';
import { aggregateWindow } from './aggregate';
import { recomputeBaselines } from './baseline';
import { scoreWindow } from './anomaly';
import { updateIncidentLifecycle } from './incident-lifecycle';
import { ENGINE_MAX_CATCH_UP_WINDOWS } from './parameters';

/** Redondea hacia abajo al múltiplo de windowMinutes, para que ventanas consecutivas no se solapen. */
export function windowStartFor(date: Date, windowMinutes: number): Date {
  const ms = windowMinutes * 60_000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

/**
 * Inicio de la última ventana **cerrada** en `now`. Es la que procesa la tarea
 * programada: una ejecución que llega con retraso (GitHub Actions puede tardar
 * varios minutos) sigue agregando la ventana completa, en vez de una a medias.
 */
export function lastCompletedWindowStart(now: Date, windowMinutes: number): Date {
  return new Date(windowStartFor(now, windowMinutes).getTime() - windowMinutes * 60_000);
}

/**
 * Ventanas a procesar, en orden cronológico: las cerradas posteriores a la última
 * procesada, hasta la última cerrada (como mucho `maxWindows`, las más recientes).
 * Si no hay ninguna pendiente devuelve [] (una ejecución duplicada no hace nada).
 * Nunca reprocesa una ventana anterior o igual a la última procesada: el ciclo de
 * incidentes debe ver las ventanas en orden.
 */
export function windowsToProcess(
  lastProcessedStart: Date | null,
  now: Date,
  windowMinutes: number,
  maxWindows: number = ENGINE_MAX_CATCH_UP_WINDOWS,
): Date[] {
  const target = lastCompletedWindowStart(now, windowMinutes).getTime();
  const step = windowMinutes * 60_000;
  if (!lastProcessedStart) return [new Date(target)];
  if (lastProcessedStart.getTime() >= target) return [];
  const first = Math.max(windowStartFor(lastProcessedStart, windowMinutes).getTime() + step, target - (maxWindows - 1) * step);
  const out: Date[] = [];
  for (let t = first; t <= target; t += step) out.push(new Date(t));
  return out;
}

/** Inicio de la ventana más reciente que el motor ha procesado (null si ninguna). */
export async function lastProcessedWindowStart(): Promise<Date | null> {
  const [row] = await db
    .select({ last: max(aggregatedWindows.windowStart) })
    .from(aggregatedWindows)
    .where(isNull(aggregatedWindows.stateId));
  return row?.last ?? null;
}

export interface EngineCycleResult {
  windowStart: Date;
  windowMinutes: number;
  servicesAggregated: number;
  baselineBuckets: number;
  servicesScored: number;
  incidentActions: { service: string; action: string; confidence: number }[];
}

/**
 * Un ciclo completo del motor para todos los servicios activos: agrega la
 * ventana que contiene `at`, recalcula líneas base, puntúa anomalías y
 * actualiza el ciclo de vida de incidentes. Lo usan `npm run aggregate:run` y
 * `/api/cron/engine`. Repetirlo sobre la misma ventana no duplica filas
 * (la agregación borra e inserta por ventana).
 */
export async function runEngineCycle(
  at: Date,
  windowMinutes: number,
  log: (line: string) => void = () => {},
  { recomputeBaselines: recompute = true }: { recomputeBaselines?: boolean } = {},
): Promise<EngineCycleResult> {
  const windowStart = windowStartFor(at, windowMinutes);
  log(`→ Ciclo del motor — ventana ${windowMinutes}min, inicio ${windowStart.toISOString()}`);

  log('  1/4 agregando reportes por ventana...');
  const aggregated = await aggregateWindow(windowStart, windowMinutes);
  log(`      ${aggregated.length} servicios agregados`);

  let bucketsUpdated = 0;
  if (recompute) {
    log('  2/4 recalculando líneas base...');
    ({ bucketsUpdated } = await recomputeBaselines(at));
    log(`      ${bucketsUpdated} buckets (servicio×estado×día×hora) actualizados`);
  } else {
    log('  2/4 líneas base: se reutilizan las de esta ejecución');
  }

  log('  3/4 puntuando anomalías...');
  const activeServices = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(eq(services.active, true));

  let scored = 0;
  const incidentActions: EngineCycleResult['incidentActions'] = [];

  for (const service of activeServices) {
    const result = await scoreWindow(service.id, windowStart, windowMinutes);
    if (!result) continue;

    await db
      .update(aggregatedWindows)
      .set({ anomalyScore: result.anomalyScore, confidence: result.confidence, technicalScore: result.technicalScore })
      .where(and(eq(aggregatedWindows.serviceId, service.id), eq(aggregatedWindows.windowStart, windowStart)));
    scored++;

    const [current] = await db
      .select({ uniqueReporters: aggregatedWindows.uniqueReporters })
      .from(aggregatedWindows)
      .where(and(eq(aggregatedWindows.serviceId, service.id), eq(aggregatedWindows.windowStart, windowStart)))
      .limit(1);

    const lifecycle = await updateIncidentLifecycle(
      service.id,
      windowStart,
      result.confidence,
      current?.uniqueReporters ?? 0,
    );
    if (lifecycle.action !== 'none') {
      incidentActions.push({ service: service.name, action: lifecycle.action, confidence: result.confidence });
    }
  }
  log(`      ${scored} servicios puntuados`);

  log('  4/4 ciclo de incidentes...');
  if (incidentActions.length === 0) {
    log('      sin cambios de estado en incidentes');
  } else {
    for (const a of incidentActions) log(`      ${a.service}: ${a.action} (confianza ${a.confidence.toFixed(1)})`);
  }

  return {
    windowStart,
    windowMinutes,
    servicesAggregated: aggregated.length,
    baselineBuckets: bucketsUpdated,
    servicesScored: scored,
    incidentActions,
  };
}
