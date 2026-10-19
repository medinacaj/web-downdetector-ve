import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { services, aggregatedWindows } from '@/lib/db/schema';
import { aggregateWindow } from './aggregate';
import { recomputeBaselines } from './baseline';
import { scoreWindow } from './anomaly';
import { updateIncidentLifecycle } from './incident-lifecycle';

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
): Promise<EngineCycleResult> {
  const windowStart = windowStartFor(at, windowMinutes);
  log(`→ Ciclo del motor — ventana ${windowMinutes}min, inicio ${windowStart.toISOString()}`);

  log('  1/4 agregando reportes por ventana...');
  const aggregated = await aggregateWindow(windowStart, windowMinutes);
  log(`      ${aggregated.length} servicios agregados`);

  log('  2/4 recalculando líneas base...');
  const { bucketsUpdated } = await recomputeBaselines(at);
  log(`      ${bucketsUpdated} buckets (servicio×estado×día×hora) actualizados`);

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
