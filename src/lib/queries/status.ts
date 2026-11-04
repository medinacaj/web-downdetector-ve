import { and, desc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { incidents, aggregatedWindows } from '@/lib/db/schema';
import { STATUS_LABELS_ES, type OperationalStatus } from '@/lib/engine/status-bands';
import { statusFromWindow } from '@/lib/engine/window-status';

/**
 * Estado visible de un servicio cuando no se necesita el detalle completo
 * (confianza, incidentId, etc. — eso lo da getServiceStatusDetail). Para
 * listados (inicio, directorio) basta con el estado derivado de un
 * incidente abierto, o insufficient_data si no hay ninguno.
 */
export async function statusForService(serviceId: string): Promise<OperationalStatus> {
  return (await statusesForServices([serviceId])).get(serviceId) ?? 'insufficient_data';
}

/** Una lectura por listado; cada servicio conserva su entrada aunque no tenga incidente. */
export async function statusesForServices(serviceIds: string[]): Promise<Map<string, OperationalStatus>> {
  const statuses = new Map<string, OperationalStatus>(serviceIds.map(id => [id, 'insufficient_data']));
  if (!statuses.size) return statuses;

  const openIncidents = await db
    .selectDistinctOn([incidents.serviceId], { serviceId: incidents.serviceId, status: incidents.status })
    .from(incidents)
    .where(and(inArray(incidents.serviceId, [...statuses.keys()]), ne(incidents.status, 'resolved')))
    .orderBy(incidents.serviceId, desc(incidents.startedAt), desc(incidents.id));

  for (const incident of openIncidents) {
    statuses.set(incident.serviceId, INCIDENT_STATUS_TO_OPERATIONAL[incident.status]);
  }
  return statuses;
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
    .orderBy(desc(incidents.startedAt), desc(incidents.id))
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
    .where(and(eq(aggregatedWindows.serviceId, serviceId), isNull(aggregatedWindows.stateId)))
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

  const status = statusFromWindow(latestWindow);
  return {
    status,
    label: STATUS_LABELS_ES[status],
    confidence: status === 'insufficient_data' ? null : latestWindow.confidence,
    officiallyConfirmed: false,
    incidentId: null,
    since: latestWindow.windowStart,
    lastUpdated: latestWindow.createdAt,
  };
}
