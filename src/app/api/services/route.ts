import { and, asc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { services, categories } from '@/lib/db/schema';
import { ok, apiError, parsePagination, withErrorHandling } from '@/lib/api/respond';

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get('category');
  const q = searchParams.get('q')?.trim();
  const { limit, offset } = parsePagination(searchParams);

  const conditions = [eq(services.active, true)];
  if (categorySlug) conditions.push(eq(categories.slug, categorySlug));
  if (q) conditions.push(ilike(services.name, `%${q}%`));

  const where = and(...conditions);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: services.id,
        slug: services.slug,
        name: services.name,
        description: services.description,
        logoUrl: services.logoUrl,
        isDemo: services.isDemo,
        category: { slug: categories.slug, name: categories.name, icon: categories.icon },
      })
      .from(services)
      .innerJoin(categories, eq(categories.id, services.categoryId))
      .where(where)
      .orderBy(asc(services.name))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(services)
      .innerJoin(categories, eq(categories.id, services.categoryId))
      .where(where),
  ]);

  const total = totalRows[0]?.count ?? 0;

  if (categorySlug && total === 0 && rows.length === 0) {
    const categoryExists = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);
    if (categoryExists.length === 0) {
      return apiError('not_found', `La categoría "${categorySlug}" no existe`);
    }
  }

  return ok(rows, { total, limit, offset });
}

export const GET = withErrorHandling(handleGET);
