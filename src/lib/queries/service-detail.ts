import { and, desc, eq, gte, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { issueTypes, reports, incidents, states } from '@/lib/db/schema';
import { getServiceBySlug } from './services';
import { getServiceStatusDetail } from './status';
import { getServiceHistory } from './service-history';
import { historyLowerBound } from './service-history-series';
import { getApprovedServiceComments } from './service-comments';

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

  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60_000);
  const since7d = new Date(now - 7 * 24 * 60 * 60_000);
  const since30d = new Date(now - 30 * 24 * 60 * 60_000);

  const [statusDetail, issueTypeOptions, history, issueBreakdown, recentIncidents, timelineIncidents, approvedComments] = await Promise.all([
    getServiceStatusDetail(service.id),
    getIssueTypesForCategory(service.category.id),
    getServiceHistory(service.id),
    db
      .select({
        name: issueTypes.name,
        last24h: sql<number>`count(*) filter (where ${reports.createdAt} >= ${since24h.toISOString()})::int`,
        last7d: sql<number>`count(*) filter (where ${reports.createdAt} >= ${since7d.toISOString()})::int`,
        last30d: sql<number>`count(*)::int`,
      })
      .from(reports)
      .innerJoin(issueTypes, eq(issueTypes.id, reports.issueTypeId))
      .where(and(
        eq(reports.serviceId, service.id),
        eq(reports.suspicious, false),
        gte(reports.createdAt, since30d),
      ))
      .groupBy(issueTypes.id, issueTypes.name),
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
    db
      .select({
        id: incidents.id,
        status: incidents.status,
        startedAt: incidents.startedAt,
        summary: incidents.summary,
        severity: incidents.severity,
        officiallyConfirmed: incidents.officiallyConfirmed,
      })
      .from(incidents)
      .where(and(eq(incidents.serviceId, service.id), gte(incidents.startedAt, historyLowerBound(new Date()))))
      .orderBy(desc(incidents.startedAt))
      .limit(100),
    getApprovedServiceComments(service.id),
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

  return { service, statusDetail, issueTypeOptions, issueBreakdown, recentIncidents, timelineIncidents, affectedStates, allStates, history, approvedComments };
}
