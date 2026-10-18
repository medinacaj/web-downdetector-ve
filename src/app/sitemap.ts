import type { MetadataRoute } from 'next';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { services } from '@/lib/db/schema';
import { canonical, indexable } from '@/lib/seo';
import { ROUTE, isRouteAvailable } from '@/lib/nav';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexable()) return [];
  const paths = Object.values(ROUTE).filter(isRouteAvailable).map(route => route.href);
  const rows = await db.select({ slug: services.slug, updatedAt: services.updatedAt })
    .from(services).where(eq(services.active, true));
  for (const item of rows) paths.push('/servicios/' + encodeURIComponent(item.slug));
  const unique = [...new Set(paths)].sort();
  return unique.map((path) => ({ url: canonical(path)!, changeFrequency: 'daily' as const,
    priority: path === '/' ? 1 : path === '/servicios' ? 0.8 : 0.6 }));
}
