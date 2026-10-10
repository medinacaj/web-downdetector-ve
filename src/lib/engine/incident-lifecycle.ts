import { and, desc, eq, gte, isNull, ne } from 'drizzle-orm';
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
    .where(and(eq(aggregatedWindows.serviceId, serviceId), isNull(aggregatedWindows.stateId)))
    .orderBy(desc(aggregatedWindows.windowStart))
    .limit(MIN_CONSECUTIVE_WINDOWS);

  const shouldOpenOrEscalate =
    confidence >= OPEN_THRESHOLD &&
    uniqueReporters >= MIN_UNIQUE_REPORTERS &&
    recentWindows.length >= MIN_CONSECUTIVE_WINDOWS &&
    recentWindows.every((w) => w.confidence >= OPEN_THRESHOLD);

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
    const allLow =
      recentWindows.length >= MIN_CONSECUTIVE_WINDOWS && recentWindows.every((w) => w.confidence < CLOSE_THRESHOLD);

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
