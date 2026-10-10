import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { aggregatedWindows, baselines, officialUpdates } from '@/lib/db/schema';
import { modifiedZScore } from './robust-stats';
import { getCaracasWeekdayHour } from './time-bucket';

/**
 * Pesos de la sección 9.4 del brief, vía .env (decisión ya tomada en
 * sesiones anteriores de este proyecto — no se mueve a tabla aquí, ver
 * docs/00-PLAN-MAESTRO.md sobre esa tensión sin resolver).
 */
const WEIGHTS = {
  deviation: Number(process.env.WEIGHT_DEVIATION ?? 0.4),
  uniqueSources: Number(process.env.WEIGHT_UNIQUE_SOURCES ?? 0.2),
  persistence: Number(process.env.WEIGHT_PERSISTENCE ?? 0.15),
  geoDispersion: Number(process.env.WEIGHT_GEO_DISPERSION ?? 0.1),
  technical: Number(process.env.WEIGHT_TECHNICAL ?? 0.1),
  official: Number(process.env.WEIGHT_OFFICIAL ?? 0.05),
};

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

export interface WeightedSignal {
  weight: number;
  score: number | null; // null = sin datos: se excluye y se renormaliza el resto
}

/**
 * Cuando una señal no tiene datos (technical/official, casi siempre hoy)
 * se excluye del promedio ponderado en vez de contar como 0 — un 0
 * silencioso diría "confirmado normal" cuando en realidad es "sin
 * evidencia", que no es lo mismo (brief: nunca afirmar sin evidencia
 * suficiente). Exportada (antes privada) para poder probarla sin BD.
 */
export function combineWeightedSignals(signals: WeightedSignal[]): number {
  const available = signals.filter((s): s is { weight: number; score: number } => s.score !== null);
  const totalWeight = available.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;
  const weightedSum = available.reduce((sum, s) => sum + s.weight * s.score, 0);
  return clamp(weightedSum / totalWeight);
}

/**
 * Cuánto confiar en el anomaly_score dado el tamaño de muestra de la línea
 * base — con 1-2 ventanas históricas, un desvío "extremo" puede ser
 * simplemente que el sistema es nuevo, no una anomalía real. Bandas fijas
 * documentadas como punto de partida, no calibradas con tráfico real.
 * Exportada (antes privada) para poder probarla sin BD.
 */
export function reliabilityFactor(sampleSize: number): number {
  if (sampleSize < 3) return 0.25;
  if (sampleSize < 8) return 0.55;
  if (sampleSize < 15) return 0.8;
  return 1.0;
}

export interface ScoreResult {
  anomalyScore: number;
  confidence: number;
  technicalScore: number;
  reliabilityFactor: number;
  baselineSampleSize: number;
}

export async function scoreWindow(
  serviceId: string,
  windowStart: Date,
  windowMinutes: number,
): Promise<ScoreResult | null> {
  const [current] = await db
    .select()
    .from(aggregatedWindows)
    .where(
      and(
        eq(aggregatedWindows.serviceId, serviceId),
        isNull(aggregatedWindows.stateId),
        eq(aggregatedWindows.windowStart, windowStart),
      ),
    )
    .limit(1);

  if (!current) return null; // aggregateWindow() no corrió para esta ventana todavía

  const { weekday, hour } = getCaracasWeekdayHour(windowStart);
  const [baseline] = await db
    .select()
    .from(baselines)
    .where(
      and(
        eq(baselines.serviceId, serviceId),
        isNull(baselines.stateId),
        eq(baselines.weekday, weekday),
        eq(baselines.hour, hour),
      ),
    )
    .limit(1);

  // Sin línea base todavía (primerísima ejecución para este bucket):
  // no hay con qué comparar. anomaly_score=0, confidence=0 — nunca "normal
  // confirmado", sino "sin evidencia" (lo refleja insufficient_data en la
  // capa API, no un 0 disfrazado de certeza).
  if (!baseline || baseline.sampleSize === 0) {
    return { anomalyScore: 0, confidence: 0, technicalScore: 0, reliabilityFactor: 0, baselineSampleSize: 0 };
  }

  // --- 1. Desviación (40%) ---
  const z = modifiedZScore(current.totalReports, baseline.medianReports, baseline.dispersion);
  const deviationScore = clamp((Math.max(z, 0) / 6) * 100); // z<=0 -> 0, z>=6 -> 100

  // --- 2. Diversidad de fuentes únicas (20%) ---
  const uniqueSourcesScore =
    current.totalReports > 0 ? clamp((current.uniqueReporters / current.totalReports) * 100) : null;

  // --- 3. Persistencia (15%): últimas 2 ventanas previas + la actual,
  // aproximando con el mismo baseline (simplificación documentada: cerca
  // de un cambio de hora, el bucket real podría diferir levemente) ---
  const priorWindows = await db
    .select({ totalReports: aggregatedWindows.totalReports, windowStart: aggregatedWindows.windowStart })
    .from(aggregatedWindows)
    .where(
      and(
        eq(aggregatedWindows.serviceId, serviceId),
        isNull(aggregatedWindows.stateId),
        lte(aggregatedWindows.windowStart, windowStart),
        gte(aggregatedWindows.windowStart, new Date(windowStart.getTime() - 2 * windowMinutes * 60_000)),
      ),
    )
    .orderBy(desc(aggregatedWindows.windowStart))
    .limit(3);

  const elevatedCount = priorWindows.filter(
    (w) => modifiedZScore(w.totalReports, baseline.medianReports, baseline.dispersion) >= 2,
  ).length;
  const persistenceScore = clamp((elevatedCount / 3) * 100);

  // --- 4. Dispersión geográfica (10%): estados distintos con reportes en
  // esta ventana. Bucket simple, no lineal: 1 estado ya puede ser una
  // falla regional legítima, no se penaliza fuerte por sí solo ---
  const perStateRows = await db
    .select({ stateId: aggregatedWindows.stateId })
    .from(aggregatedWindows)
    .where(
      and(
        eq(aggregatedWindows.serviceId, serviceId),
        eq(aggregatedWindows.windowStart, windowStart),
        gte(aggregatedWindows.totalReports, 1),
      ),
    );
  const distinctStates = new Set(perStateRows.map((r) => r.stateId).filter(Boolean)).size;
  const geoDispersionScore =
    current.totalReports === 0
      ? null
      : distinctStates <= 1
        ? 40
        : distinctStates <= 3
          ? 70
          : 100;

  // --- 5. Técnico (10%): sin fuente de datos todavía (ENABLE_TECHNICAL_
  // CHECKS=false, sin polling real implementado) — se excluye, no se
  // simula. Ver docs/00-PLAN-MAESTRO.md, pendientes de la Etapa 3. ---
  const technicalScoreSignal: number | null = null;

  // --- 6. Confirmación oficial (5%): ¿existe un OfficialUpdate verificado
  // reciente para este servicio? (no hay panel admin todavía para crear
  // uno — la consulta es real, simplemente no tendrá filas hasta la
  // Etapa 6) ---
  const recentOfficial = await db
    .select({ id: officialUpdates.id })
    .from(officialUpdates)
    .where(
      and(
        eq(officialUpdates.serviceId, serviceId),
        gte(officialUpdates.publishedAt, new Date(windowStart.getTime() - 24 * 60 * 60_000)),
      ),
    )
    .limit(1);
  const officialScore = recentOfficial.length > 0 ? 100 : null;

  const anomalyScore = combineWeightedSignals([
    { weight: WEIGHTS.deviation, score: deviationScore },
    { weight: WEIGHTS.uniqueSources, score: uniqueSourcesScore },
    { weight: WEIGHTS.persistence, score: persistenceScore },
    { weight: WEIGHTS.geoDispersion, score: geoDispersionScore },
    { weight: WEIGHTS.technical, score: technicalScoreSignal },
    { weight: WEIGHTS.official, score: officialScore },
  ]);

  const reliability = reliabilityFactor(baseline.sampleSize);
  const confidence = clamp(anomalyScore * reliability);

  return {
    anomalyScore,
    confidence,
    technicalScore: 0,
    reliabilityFactor: reliability,
    baselineSampleSize: baseline.sampleSize,
  };
}
