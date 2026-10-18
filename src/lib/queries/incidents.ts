import { and, asc, desc, eq, gte, inArray, ne } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { incidents, incidentRegions, services, categories, states } from '@/lib/db/schema';

export interface IncidentListItem {
  id: string;
  status: string;
  confidence: number;
  startedAt: Date;
  peakAt: Date | null;
  endedAt: Date | null;
  officiallyConfirmed: boolean;
  service: { slug: string; name: string; isDemo: boolean };
  category: { slug: string; name: string };
  states: string[];
}

/** Días hacia atrás que muestra /incidentes para los resueltos. */
export const RESOLVED_LOOKBACK_DAYS = 30;
const RESOLVED_LIMIT = 50;

async function withStates(rows: Omit<IncidentListItem, 'states'>[]): Promise<IncidentListItem[]> {
  if (rows.length === 0) return [];
  const regionRows = await db
    .select({ incidentId: incidentRegions.incidentId, name: states.name })
    .from(incidentRegions)
    .innerJoin(states, eq(states.id, incidentRegions.stateId))
    .where(
      inArray(
        incidentRegions.incidentId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(asc(states.name));
  const byIncident = new Map<string, string[]>();
  for (const r of regionRows) byIncident.set(r.incidentId, [...(byIncident.get(r.incidentId) ?? []), r.name]);
  return rows.map((r) => ({ ...r, states: byIncident.get(r.id) ?? [] }));
}

const SELECTION = {
  id: incidents.id,
  status: incidents.status,
  confidence: incidents.confidence,
  startedAt: incidents.startedAt,
  peakAt: incidents.peakAt,
  endedAt: incidents.endedAt,
  officiallyConfirmed: incidents.officiallyConfirmed,
  service: { slug: services.slug, name: services.name, isDemo: services.isDemo },
  category: { slug: categories.slug, name: categories.name },
};

/** Incidentes abiertos (todo estado salvo "resuelto") y resueltos recientes, de servicios activos. */
export async function getIncidentsOverview(now: Date = new Date()) {
  const since = new Date(now.getTime() - RESOLVED_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const base = () =>
    db
      .select(SELECTION)
      .from(incidents)
      .innerJoin(services, eq(services.id, incidents.serviceId))
      .innerJoin(categories, eq(categories.id, services.categoryId));

  const [active, resolved] = await Promise.all([
    base()
      .where(and(eq(services.active, true), ne(incidents.status, 'resolved')))
      .orderBy(desc(incidents.confidence), desc(incidents.startedAt)),
    base()
      .where(and(eq(services.active, true), eq(incidents.status, 'resolved'), gte(incidents.endedAt, since)))
      .orderBy(desc(incidents.endedAt))
      .limit(RESOLVED_LIMIT),
  ]);

  return { active: await withStates(active), resolved: await withStates(resolved) };
}
