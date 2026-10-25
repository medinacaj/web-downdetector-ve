import { and, asc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { services, categories, reports, incidents } from '@/lib/db/schema';
import { statusForService } from './status';
import type { OperationalStatus } from '@/lib/engine/status-bands';

export type DirectorySort = 'activity' | 'alphabetical' | 'stability';

export interface DirectoryService {
  slug: string;
  name: string;
  description: string | null;
  categorySlug: string;
  categoryName: string;
  isDemo: boolean;
  reportsLast24h: number;
  incidentsAllTime: number;
  status: OperationalStatus;
}

export async function getCategories() {
  return db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder));
}

/** Una categoría por slug (para su página), o null si no existe. */
export async function getCategoryBySlug(slug: string) {
  const rows = await db
    .select({ slug: categories.slug, name: categories.name, description: categories.description })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

/** Slugs de las categorías con al menos un servicio activo (las demás responden 404). */
export async function getCategorySlugsWithServices(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ slug: categories.slug, sortOrder: categories.sortOrder })
    .from(categories)
    .innerJoin(services, and(eq(services.categoryId, categories.id), eq(services.active, true)))
    .orderBy(asc(categories.sortOrder));
  return rows.map((r) => r.slug);
}

export async function getDirectoryServices(params: {
  q?: string;
  category?: string;
  status?: OperationalStatus;
  sort?: DirectorySort;
}): Promise<{ services: DirectoryService[]; total: number }> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const conditions = [eq(services.active, true)];
  if (params.q) conditions.push(ilike(services.name, `%${params.q}%`));
  if (params.category) conditions.push(eq(categories.slug, params.category));

  const rows = await db
    .select({
      id: services.id,
      slug: services.slug,
      name: services.name,
      description: services.description,
      categorySlug: categories.slug,
      categoryName: categories.name,
      isDemo: services.isDemo,
      reportsLast24h: sql<number>`count(distinct ${reports.id}) filter (where ${reports.createdAt} >= ${since24h})::int`,
      incidentsAllTime: sql<number>`count(distinct ${incidents.id})::int`,
    })
    .from(services)
    .innerJoin(categories, eq(categories.id, services.categoryId))
    .leftJoin(reports, eq(reports.serviceId, services.id))
    .leftJoin(incidents, eq(incidents.serviceId, services.id))
    .where(and(...conditions))
    .groupBy(services.id, categories.slug, categories.name)
    .orderBy(asc(services.name));

  let withStatus: DirectoryService[] = await Promise.all(
    rows.map(async ({ id, ...rest }) => ({ ...rest, status: await statusForService(id) })),
  );

  if (params.status) {
    withStatus = withStatus.filter((s) => s.status === params.status);
  }

  const sort = params.sort ?? 'alphabetical';
  if (sort === 'activity') {
    withStatus.sort((a, b) => b.reportsLast24h - a.reportsLast24h);
  } else if (sort === 'stability') {
    withStatus.sort((a, b) => a.incidentsAllTime - b.incidentsAllTime || a.name.localeCompare(b.name));
  } else {
    withStatus.sort((a, b) => a.name.localeCompare(b.name));
  }

  return { services: withStatus, total: withStatus.length };
}
