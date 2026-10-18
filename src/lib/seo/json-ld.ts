import { absoluteUrl } from './site';
import { SITE_NAME } from './brand';

/**
 * Datos estructurados (schema.org, JSON-LD). Solo datos reales y visibles en la
 * página (regla de .claude/rules/seo-tecnico.md): nombre y URL del sitio, el logo
 * propio y migas de pan que la página muestra. Nada de teléfonos, direcciones,
 * redes sociales, `Rating` ni `Service` con datos demostrativos.
 */
type JsonLd = Record<string, unknown>;

/** Portada: el sitio y quien lo publica. */
export function siteJsonLd(origin: string): JsonLd {
  const url = absoluteUrl(origin, '/');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        name: SITE_NAME,
        url,
        inLanguage: 'es-VE',
        publisher: { '@id': `${url}#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${url}#organization`,
        name: SITE_NAME,
        url,
        // src/app/apple-icon.png (180×180): Google pide un logo de al menos 112×112.
        logo: absoluteUrl(origin, '/apple-icon.png'),
      },
    ],
  };
}

export interface Crumb {
  name: string;
  path: string;
}

/** Miga de pan: debe coincidir con la que la página muestra. */
export function breadcrumbJsonLd(origin: string, crumbs: readonly Crumb[]): JsonLd {
  if (crumbs.length === 0) throw new Error('Una miga de pan necesita al menos un elemento');
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(origin, c.path),
    })),
  };
}

/**
 * JSON para un <script type="application/ld+json">. Escapa `<` (guía de Next,
 * 02-guides/json-ld.md): un nombre con "</script>" no puede cerrar la etiqueta.
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
