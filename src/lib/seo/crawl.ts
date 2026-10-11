import type { MetadataRoute } from 'next';
import { ROUTE, isRouteAvailable } from '@/lib/nav';
import { absoluteUrl, type SiteConfig } from './site';

/**
 * robots.txt. Nunca bloquea el sitio entero: con `noindex` global Google tiene
 * que poder rastrear las páginas para leer la etiqueta (un `Disallow: /` las
 * dejaría indexables por enlaces externos, sin contenido). `/api/` es JSON sin
 * valor de búsqueda. Nunca listar aquí rutas administrativas.
 */
export function buildRobots(site: SiteConfig): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    // Solo se anuncia el sitemap cuando trae URLs indexables.
    ...(site.indexable ? { sitemap: absoluteUrl(site.origin, '/sitemap.xml') } : {}),
  };
}

/** Páginas fijas del sitemap: las públicas ya disponibles en `src/lib/nav.ts`. */
const STATIC_ROUTES = [ROUTE.home, ROUTE.services];

/**
 * sitemap.xml: solo URLs indexables, absolutas y canónicas. Con el sitio en
 * `noindex` queda vacío (una URL con noindex no va en el sitemap).
 * Sin `lastModified`: `services.updated_at` aún no se actualiza al editar y una
 * fecha inventada es peor que ninguna.
 */
export function buildSitemap(site: SiteConfig, serviceSlugs: readonly string[]): MetadataRoute.Sitemap {
  if (!site.indexable) return [];
  const paths = [
    ...STATIC_ROUTES.filter(isRouteAvailable).map((r) => r.href),
    ...serviceSlugs.map((slug) => `${ROUTE.services.href}/${slug}`),
  ];
  return [...new Set(paths)].map((path) => ({ url: absoluteUrl(site.origin, path) }));
}
