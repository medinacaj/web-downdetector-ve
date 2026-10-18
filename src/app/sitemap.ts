import type { MetadataRoute } from 'next';
import { getSiteConfig } from '@/lib/seo/site';
import { buildSitemap } from '@/lib/seo/crawl';
import { getActiveServiceSlugs } from '@/lib/queries/services';
import { getCategorySlugsWithServices } from '@/lib/queries/directory';

// Dinámico: lee la base de datos en cada petición (si no, quedaría congelado en el build).
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteConfig();
  // Con el sitio en noindex no hace falta consultar la base.
  if (!site.indexable) return buildSitemap(site, { categories: [], services: [] });
  const [categories, services] = await Promise.all([getCategorySlugsWithServices(), getActiveServiceSlugs()]);
  return buildSitemap(site, { categories, services });
}
