import { and, asc, desc, eq, gte, inArray, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { services, categories, reports, incidents } from '@/lib/db/schema';
import { statusForService } from './status';
import type { OperationalStatus } from '@/lib/engine/status-bands';
import { pickFeaturedServices, selectWorldwideSpotlights, toHourlySeries, type HourlyReportRow } from './home-trends';

export interface ServiceSummary {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  reportsLast24h: number;
  status: OperationalStatus;
  isDemo: boolean;
}

export async function getHomeData() {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const serviceRows = await db
    .select({
      id: services.id,
      slug: services.slug,
      name: services.name,
      isDemo: services.isDemo,
      categorySlug: categories.slug,
      categoryName: categories.name,
      reportsLast24h: sql<number>`count(${reports.id}) filter (where ${reports.createdAt} >= ${since24h.toISOString()})::int`,
    })
    .from(services)
    .innerJoin(categories, eq(categories.id, services.categoryId))
    .leftJoin(reports, eq(reports.serviceId, services.id))
    .where(eq(services.active, true))
    .groupBy(services.id, categories.slug, categories.name)
    .orderBy(asc(services.name));

  const servicesWithStatus: ServiceSummary[] = await Promise.all(
    serviceRows.map(async ({ id, ...rest }) => ({
      ...rest,
      status: await statusForService(id),
    })),
  );

  const hasAnyActivity = servicesWithStatus.some((s) => s.reportsLast24h > 0);
  // Activity is real data, not fabricated example curves. With no reports, show
  // a curated cross-category selection of services relevant to Venezuela.
  const mostActive = pickFeaturedServices(servicesWithStatus);
  const worldwideServices = selectWorldwideSpotlights(servicesWithStatus);
  const idBySlug = new Map(serviceRows.map((row) => [row.slug, row.id]));
  const chartSlugs = new Set([
    ...mostActive.map((service) => service.slug),
    ...worldwideServices.flatMap((section) => section.services.map((service) => service.slug)),
  ]);
  const selectedIds = [...chartSlugs].map((slug) => idBySlug.get(slug)).filter((id): id is string => !!id);
  const hourBucket = sql<Date>`date_trunc('hour', ${reports.createdAt})`;
  const activityRows = selectedIds.length
    ? await db.select({
        serviceId: reports.serviceId,
        hour: hourBucket,
        count: sql<number>`count(*)::int`,
      })
      .from(reports)
      .where(and(gte(reports.createdAt, since24h), inArray(reports.serviceId, selectedIds)))
      .groupBy(reports.serviceId, hourBucket)
    : [];

  const byService = new Map<string, HourlyReportRow[]>();
  for (const row of activityRows) {
    const entries = byService.get(row.serviceId) ?? [];
    entries.push({ hour: row.hour, count: row.count });
    byService.set(row.serviceId, entries);
  }
  const withTrend = (service: ServiceSummary) => ({
    ...service,
    hourlyReports: toHourlySeries(byService.get(idBySlug.get(service.slug) ?? '') ?? [], now),
  });
  const featuredServices = mostActive.map(withTrend);
  const globalServiceSections = worldwideServices.map((section) => ({
    ...section,
    services: section.services.map(withTrend),
  }));

  const [reportsAllTime] = await db.select({ n: sql<number>`count(*)::int` }).from(reports);
  const [reportsLast24h] = await db.select({ n: sql<number>`count(*)::int` }).from(reports).where(gte(reports.createdAt, since24h));
  const [incidentsOpen] = await db.select({ n: sql<number>`count(*)::int` }).from(incidents).where(ne(incidents.status, 'resolved'));
  const [incidentsAllTime] = await db.select({ n: sql<number>`count(*)::int` }).from(incidents);

  const activeIncidents = await db
    .select({
      id: incidents.id,
      status: incidents.status,
      startedAt: incidents.startedAt,
      serviceName: services.name,
      serviceSlug: services.slug,
    })
    .from(incidents)
    .innerJoin(services, eq(services.id, incidents.serviceId))
    .where(ne(incidents.status, 'resolved'))
    .orderBy(desc(incidents.startedAt))
    .limit(5);

  return {
    services: servicesWithStatus,
    mostActive,
    featuredServices,
    globalServiceSections,
    hasAnyActivity,
    totals: {
      reportsAllTime: reportsAllTime?.n ?? 0,
      reportsLast24h: reportsLast24h?.n ?? 0,
      incidentsOpen: incidentsOpen?.n ?? 0,
      incidentsAllTime: incidentsAllTime?.n ?? 0,
      servicesCount: servicesWithStatus.length,
    },
    activeIncidents,
    generatedAt: new Date(),
  };
}
