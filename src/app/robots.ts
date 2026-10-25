import type { MetadataRoute } from 'next';
import { getSiteConfig } from '@/lib/seo/site';
import { buildRobots } from '@/lib/seo/crawl';

// Dinámico: refleja SITE_URL/SITE_INDEXING del servidor, no los del build.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return buildRobots(getSiteConfig());
}
