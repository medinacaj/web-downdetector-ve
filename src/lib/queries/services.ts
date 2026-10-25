import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { services, categories } from '@/lib/db/schema';

export async function getServiceBySlug(slug: string) {
  const rows = await db
    .select({
      id: services.id,
      slug: services.slug,
      name: services.name,
      description: services.description,
      logoUrl: services.logoUrl,
      officialUrl: services.officialUrl,
      active: services.active,
      isDemo: services.isDemo,
      createdAt: services.createdAt,
      updatedAt: services.updatedAt,
      category: {
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        icon: categories.icon,
      },
    })
    .from(services)
    .innerJoin(categories, eq(categories.id, services.categoryId))
    .where(eq(services.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

/** Slugs de los servicios activos (los inactivos responden 404), para el sitemap. */
export async function getActiveServiceSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: services.slug })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.slug));
  return rows.map((r) => r.slug);
}

/** Servicios activos para un selector (nombre y slug), en orden alfabético. */
export async function getActiveServiceOptions(): Promise<{ slug: string; name: string }[]> {
  return db
    .select({ slug: services.slug, name: services.name })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.name));
}
