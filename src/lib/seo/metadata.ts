import type { Metadata } from 'next';
import { SHARE_IMAGE_ALT, SHARE_IMAGE_SIZE, SITE_NAME } from './brand';

export { SITE_NAME };

/**
 * Metadata de una página pública: title, description, canonical, Open Graph y
 * Twitter coherentes entre sí.
 *
 * La metadata de Next se fusiona de forma superficial: un `openGraph` en una
 * página reemplaza entero el del layout. Por eso cada página la construye aquí
 * completa, en vez de heredar a medias. Eso incluye la imagen para compartir:
 * la de archivo (`src/app/opengraph-image.tsx`, `twitter-image.tsx`) solo la
 * añade Next en las páginas que no definen su propio `openGraph`, así que aquí
 * se declara explícitamente, apuntando a esas mismas rutas. La política de
 * indexación (`robots`) NO va aquí: vive solo en el layout raíz (ver
 * src/lib/seo/site.ts).
 *
 * `path` es la URL canónica relativa, sin parámetros: con `metadataBase` Next la
 * convierte en absoluta. Así `/servicios?category=…` declara como canónica
 * `/servicios` y no compite con ella.
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  /** Título de la página; el layout le añade " | PulsoVE" salvo con `absoluteTitle`. */
  title: string;
  description: string;
  path: string;
  /** true cuando `title` ya es el título completo (la portada). */
  absoluteTitle?: boolean;
}): Metadata {
  if (!path.startsWith('/') || path.includes('?') || path.includes('#')) {
    throw new Error(`La ruta canónica debe empezar por "/" y no llevar parámetros: "${path}"`);
  }
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'es_VE',
      siteName: SITE_NAME,
      url: path,
      title: fullTitle,
      description,
      images: [{ url: '/opengraph-image', ...SHARE_IMAGE_SIZE, type: 'image/png', alt: SHARE_IMAGE_ALT }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [{ url: '/twitter-image', ...SHARE_IMAGE_SIZE, type: 'image/png', alt: SHARE_IMAGE_ALT }],
    },
  };
}
