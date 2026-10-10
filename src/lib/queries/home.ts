import { and, asc, desc, eq, gte, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { services, categories, reports, incidents } from '@/lib/db/schema';
import { statusForService } from './status';
import type { OperationalStatus } from '@/lib/engine/status-bands';

export interface ServiceSummary {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  reportsLast24h: number;
  status: OperationalStatus;
}

export async function getHomeData() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const serviceRows = await db
    .select({
      id: services.id,
      slug: services.slug,
      name: services.name,
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
  const mostActive = hasAnyActivity
    ? [...servicesWithStatus].sort((a, b) => b.reportsLast24h - a.reportsLast24h).slice(0, 6)
    : servicesWithStatus.slice(0, 6);

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
