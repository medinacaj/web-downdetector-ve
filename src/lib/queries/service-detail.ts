import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { issueTypes, reports, incidents, states } from '@/lib/db/schema';
import { getServiceBySlug } from './services';
import { getServiceStatusDetail } from './status';

/** Tipos de problema de la categoría del servicio + los transversales (category_id null). */
export async function getIssueTypesForCategory(categoryId: string) {
  return db
    .select({ slug: issueTypes.slug, name: issueTypes.name })
    .from(issueTypes)
    .where(or(eq(issueTypes.categoryId, categoryId), isNull(issueTypes.categoryId)))
    .orderBy(issueTypes.name);
}

export async function getServiceDetailData(slug: string) {
  const service = await getServiceBySlug(slug);
  if (!service || !service.active) return null;

  const [statusDetail, issueTypeOptions, issueBreakdown, recentIncidents] = await Promise.all([
    getServiceStatusDetail(service.id),
    getIssueTypesForCategory(service.category.id),
    db
      .select({ name: issueTypes.name, count: sql<number>`count(${reports.id})::int` })
      .from(reports)
      .innerJoin(issueTypes, eq(issueTypes.id, reports.issueTypeId))
      .where(eq(reports.serviceId, service.id))
      .groupBy(issueTypes.id, issueTypes.name)
      .orderBy(desc(sql`count(${reports.id})`))
      .limit(6),
    db
      .select({
        id: incidents.id,
        status: incidents.status,
        startedAt: incidents.startedAt,
        endedAt: incidents.endedAt,
        peakAt: incidents.peakAt,
        confidence: incidents.confidence,
        severity: incidents.severity,
        summary: incidents.summary,
        officiallyConfirmed: incidents.officiallyConfirmed,
      })
      .from(incidents)
      .where(eq(incidents.serviceId, service.id))
      .orderBy(desc(incidents.startedAt))
      .limit(10),
  ]);

  const affectedStates = await db
    .select({ name: states.name, code: states.code, reports: sql<number>`count(${reports.id})::int` })
    .from(reports)
    .innerJoin(states, eq(states.id, reports.stateId))
    .where(eq(reports.serviceId, service.id))
    .groupBy(states.id)
    .orderBy(desc(sql`count(${reports.id})`))
    .limit(8);

  const allStates = await db.select({ code: states.code, name: states.name }).from(states).orderBy(states.name);

  return { service, statusDetail, issueTypeOptions, issueBreakdown, recentIncidents, affectedStates, allStates };
}
