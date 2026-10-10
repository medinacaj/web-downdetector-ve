import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { incidents, aggregatedWindows } from '@/lib/db/schema';
import { scoreToStatus, STATUS_LABELS_ES, type OperationalStatus } from '@/lib/engine/status-bands';

/**
 * Estado visible de un servicio cuando no se necesita el detalle completo
 * (confianza, incidentId, etc. — eso lo da getServiceStatusDetail). Para
 * listados (inicio, directorio) basta con el estado derivado de un
 * incidente abierto, o insufficient_data si no hay ninguno.
 */
export async function statusForService(serviceId: string): Promise<OperationalStatus> {
  const [openIncident] = await db
    .select({ status: incidents.status })
    .from(incidents)
    .where(and(eq(incidents.serviceId, serviceId), ne(incidents.status, 'resolved')))
    .limit(1);

  if (!openIncident) return 'insufficient_data';

  switch (openIncident.status) {
    case 'possible':
      return 'possible_outage';
    case 'detected':
      return 'outage_detected';
    case 'high_confidence':
    case 'confirmed':
      return 'outage_high_confidence';
    case 'recovering':
      return 'possible_outage';
    default:
      return 'insufficient_data';
  }
}

// incidents.status (brief, sección 7.5/9.6) -> OperationalStatus visible.
// 'resolved' no debería llegar aquí (se filtra antes con ne('resolved')),
// pero se mapea a 'normal' como red de seguridad, no como caso esperado.
const INCIDENT_STATUS_TO_OPERATIONAL: Record<
  'possible' | 'detected' | 'high_confidence' | 'confirmed' | 'recovering' | 'resolved',
  OperationalStatus
> = {
  possible: 'possible_outage',
  detected: 'outage_detected',
  high_confidence: 'outage_high_confidence',
  confirmed: 'outage_high_confidence',
  recovering: 'possible_outage',
  resolved: 'normal',
};

export interface ServiceStatusDetail {
  status: OperationalStatus;
  label: string;
  confidence: number | null;
  officiallyConfirmed: boolean;
  incidentId: string | null;
  since: Date | null;
  lastUpdated: Date | null;
}

/**
 * Detalle completo de estado para un servicio (usado por
 * GET /api/services/:slug/status y por la página individual del
 * servicio) — una sola fuente de verdad para ambos.
 */
export async function getServiceStatusDetail(serviceId: string): Promise<ServiceStatusDetail> {
  const [openIncident] = await db
    .select()
    .from(incidents)
    .where(and(eq(incidents.serviceId, serviceId), ne(incidents.status, 'resolved')))
    .orderBy(desc(incidents.startedAt))
    .limit(1);

  if (openIncident) {
    const status = INCIDENT_STATUS_TO_OPERATIONAL[openIncident.status];
    return {
      status,
      label: STATUS_LABELS_ES[status],
      confidence: openIncident.confidence,
      officiallyConfirmed: openIncident.officiallyConfirmed,
      incidentId: openIncident.id,
      since: openIncident.startedAt,
      lastUpdated: openIncident.updatedAt,
    };
  }

  const [latestWindow] = await db
    .select()
    .from(aggregatedWindows)
    .where(eq(aggregatedWindows.serviceId, serviceId))
    .orderBy(desc(aggregatedWindows.windowStart))
    .limit(1);

  if (!latestWindow) {
    return {
      status: 'insufficient_data',
      label: STATUS_LABELS_ES.insufficient_data,
      confidence: null,
      officiallyConfirmed: false,
      incidentId: null,
      since: null,
      lastUpdated: null,
    };
  }

  const status = scoreToStatus(latestWindow.confidence);
  return {
    status,
    label: STATUS_LABELS_ES[status],
    confidence: latestWindow.confidence,
    officiallyConfirmed: false,
    incidentId: null,
    since: latestWindow.windowStart,
    lastUpdated: latestWindow.createdAt,
  };
}
