import { eq } from 'drizzle-orm';
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
