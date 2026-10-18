/**
 * Orquesta un ciclo completo del motor de detección para todos los
 * servicios activos: agrega la ventana actual, recalcula líneas base,
 * puntúa anomalías y actualiza el ciclo de vida de incidentes.
 *
 * Uso: npm run aggregate:run -- --window=15 --at=2026-08-17T14:00:00Z
 * Pensado para invocarse periódicamente (cron externo, GitHub Actions
 * scheduled, etc.) — este proyecto no incluye un scheduler propio todavía
 * (ver docs/00-PLAN-MAESTRO.md, pendientes de la Etapa 3).
 */
import 'dotenv/config';
import { DEFAULT_WINDOW_MINUTES } from '../src/lib/engine/parameters';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/lib/db/client';
import { services, aggregatedWindows } from '../src/lib/db/schema';
import { aggregateWindow } from '../src/lib/engine/aggregate';
import { recomputeBaselines } from '../src/lib/engine/baseline';
import { scoreWindow } from '../src/lib/engine/anomaly';
import { updateIncidentLifecycle } from '../src/lib/engine/incident-lifecycle';

function parseArgs() {
  const args = process.argv.slice(2);
  const windowArg = args.find((a) => a.startsWith('--window='));
  const atArg = args.find((a) => a.startsWith('--at='));
  return {
    windowMinutes: windowArg ? Number(windowArg.split('=')[1]) : DEFAULT_WINDOW_MINUTES,
    at: atArg ? new Date(atArg.split('=')[1]) : new Date(),
  };
}

/** Redondea hacia abajo al múltiplo de windowMinutes más cercano, para que ventanas consecutivas no se solapen. */
function floorToWindow(date: Date, windowMinutes: number): Date {
  const ms = windowMinutes * 60_000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

async function main() {
  const { windowMinutes, at } = parseArgs();
  const windowStart = floorToWindow(at, windowMinutes);

  console.log(`→ Ciclo del motor — ventana ${windowMinutes}min, inicio ${windowStart.toISOString()}`);

  console.log('  1/4 agregando reportes por ventana...');
  const aggregated = await aggregateWindow(windowStart, windowMinutes);
  console.log(`      ${aggregated.length} servicios agregados`);

  console.log('  2/4 recalculando líneas base...');
  const { bucketsUpdated } = await recomputeBaselines(at);
  console.log(`      ${bucketsUpdated} buckets (servicio×estado×día×hora) actualizados`);

  console.log('  3/4 puntuando anomalías...');
  const activeServices = await db.select({ id: services.id, name: services.name }).from(services).where(eq(services.active, true));

  let scored = 0;
  const incidentActions: string[] = [];

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
      incidentActions.push(`${service.name}: ${lifecycle.action} (confianza ${result.confidence.toFixed(1)})`);
    }
  }
  console.log(`      ${scored} servicios puntuados`);

  console.log('  4/4 ciclo de incidentes...');
  if (incidentActions.length === 0) {
    console.log('      sin cambios de estado en incidentes');
  } else {
    incidentActions.forEach((line) => console.log(`      ${line}`));
  }

  console.log('✓ Ciclo completado.');
  process.exit(0);
}

main().catch((err) => {
  console.error('✗ Ciclo del motor falló:', err);
  process.exit(1);
});
