import { and, desc, eq, gte, isNull, lte, ne } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { incidents, incidentRegions, aggregatedWindows } from '@/lib/db/schema';

// Umbral de apertura = límite inferior de "posible interrupción" (sección
// 9.6). Cierre una banda por debajo para evitar parpadeo en el límite.
const OPEN_THRESHOLD = Number(process.env.INCIDENT_OPEN_CONFIDENCE ?? 55);
const CLOSE_THRESHOLD = Number(process.env.INCIDENT_CLOSE_CONFIDENCE ?? 40);
const MIN_CONSECUTIVE_WINDOWS = Number(process.env.INCIDENT_MIN_CONSECUTIVE_WINDOWS ?? 2);
// Evita que un solo reportante (o un hash duplicado) abra un incidente por
// sí solo (brief, sección 9.7: "diversidad de reportantes suficiente").
const MIN_UNIQUE_REPORTERS = Number(process.env.INCIDENT_MIN_UNIQUE_REPORTERS ?? 2);

export interface ScoredWindow {
  windowStart: Date;
  confidence: number;
}

/**
 * Only fully scored, uninterrupted windows may open, escalate or resolve
 * incidents. An outage in the job scheduler must not make two distant
 * samples look consecutive.
 */
export function consecutiveConfidenceWindows(
  windows: readonly ScoredWindow[],
  currentStart: Date,
  windowMinutes: number,
  expectedCount: number,
  predicate: (confidence: number) => boolean,
): boolean {
  if (!Number.isInteger(windowMinutes) || windowMinutes <= 0
      || !Number.isInteger(expectedCount) || expectedCount < 1
      || !Number.isFinite(currentStart.getTime())
      || windows.length < expectedCount) return false;
  const interval = windowMinutes * 60_000;
  return windows.slice(0, expectedCount).every((window, index) =>
    Number.isFinite(window.confidence) && predicate(window.confidence)
    && window.windowStart.getTime() === currentStart.getTime() - index * interval
  );
}

function severityForConfidence(confidence: number): string {
  if (confidence >= 85) return 'critical';
  if (confidence >= 70) return 'major';
  return 'moderate'; // mismo valor que el default de la columna
}

async function upsertIncidentRegions(incidentId: string, serviceId: string, windowStart: Date, confidence: number) {
  const stateRows = await db
    .select({ stateId: aggregatedWindows.stateId, totalReports: aggregatedWindows.totalReports })
    .from(aggregatedWindows)
    .where(
      and(
        eq(aggregatedWindows.serviceId, serviceId),
        eq(aggregatedWindows.windowStart, windowStart),
        gte(aggregatedWindows.totalReports, 1),
      ),
    );

  for (const s of stateRows) {
    if (!s.stateId) continue;
    await db
      .insert(incidentRegions)
      .values({ incidentId, stateId: s.stateId, reportCount: s.totalReports, confidence })
      .onConflictDoUpdate({
        target: [incidentRegions.incidentId, incidentRegions.stateId],
        set: { reportCount: s.totalReports, confidence },
      });
  }
}

export interface LifecycleResult {
  action: 'opened' | 'updated' | 'resolved' | 'none';
  incidentId: string | null;
}

export async function updateIncidentLifecycle(
  serviceId: string,
  windowStart: Date,
  confidence: number,
  uniqueReporters: number,
  windowMinutes: number,
): Promise<LifecycleResult> {
  const [openIncident] = await db
    .select()
    .from(incidents)
    .where(and(eq(incidents.serviceId, serviceId), ne(incidents.status, 'resolved')))
    .orderBy(desc(incidents.startedAt))
    .limit(1);

  const recentWindows = await db
    .select({ confidence: aggregatedWindows.confidence, windowStart: aggregatedWindows.windowStart })
    .from(aggregatedWindows)
    .where(and(
      eq(aggregatedWindows.serviceId, serviceId),
      isNull(aggregatedWindows.stateId),
      lte(aggregatedWindows.windowStart, windowStart),
      gte(aggregatedWindows.windowStart,
        new Date(windowStart.getTime() - (MIN_CONSECUTIVE_WINDOWS - 1) * windowMinutes * 60_000)),
    ))
    .orderBy(desc(aggregatedWindows.windowStart))
    .limit(MIN_CONSECUTIVE_WINDOWS);

  const shouldOpenOrEscalate =
    confidence >= OPEN_THRESHOLD &&
    uniqueReporters >= MIN_UNIQUE_REPORTERS &&
    consecutiveConfidenceWindows(
      recentWindows, windowStart, windowMinutes, MIN_CONSECUTIVE_WINDOWS,
      (score) => score >= OPEN_THRESHOLD,
    );

  if (shouldOpenOrEscalate) {
    const status = confidence >= 85 ? 'high_confidence' : confidence >= 70 ? 'detected' : 'possible';

    if (openIncident) {
      const isNewPeak = confidence > openIncident.confidence;
      await db
        .update(incidents)
        .set({
          status,
          confidence,
          severity: severityForConfidence(confidence),
          peakAt: isNewPeak ? windowStart : openIncident.peakAt,
          updatedAt: new Date(),
        })
        .where(eq(incidents.id, openIncident.id));
      await upsertIncidentRegions(openIncident.id, serviceId, windowStart, confidence);
      return { action: 'updated', incidentId: openIncident.id };
    }

    const [created] = await db
      .insert(incidents)
      .values({
        serviceId,
        status,
        confidence,
        severity: severityForConfidence(confidence),
        startedAt: windowStart,
        peakAt: windowStart,
        officiallyConfirmed: false,
        createdBy: null, // generado por el motor, no por un administrador
      })
      .returning({ id: incidents.id });

    await upsertIncidentRegions(created.id, serviceId, windowStart, confidence);
    return { action: 'opened', incidentId: created.id };
  }

  if (openIncident && confidence < CLOSE_THRESHOLD) {
    const allLow = consecutiveConfidenceWindows(
      recentWindows, windowStart, windowMinutes, MIN_CONSECUTIVE_WINDOWS,
      (score) => score < CLOSE_THRESHOLD,
    );

    if (allLow) {
      await db
        .update(incidents)
        .set({ status: 'resolved', endedAt: windowStart, updatedAt: new Date() })
        .where(eq(incidents.id, openIncident.id));
      return { action: 'resolved', incidentId: openIncident.id };
    }

    await db
      .update(incidents)
      .set({ status: 'recovering', confidence, updatedAt: new Date() })
      .where(eq(incidents.id, openIncident.id));
    return { action: 'updated', incidentId: openIncident.id };
  }

  return { action: 'none', incidentId: openIncident?.id ?? null };
}
