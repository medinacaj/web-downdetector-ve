/**
 * Dominio canónico y política de indexación del sitio.
 *
 * Decisión de la persona propietaria (2026-10-11, opción A de
 * docs/SEO-PENDIENTE.md): mientras los servicios sean demostrativos, todo el
 * sitio va con `noindex, follow` y el sitemap queda vacío. La indexación se abre
 * el día que haya datos reales con `SITE_INDEXING="true"` y un `SITE_URL`
 * público en HTTPS; no hace falta tocar código.
 *
 * Las variables se leen al cargar el servidor: cambiarlas exige reiniciarlo.
 */
export interface SiteConfig {
  /** Origen canónico, sin barra final (p. ej. "https://pulsove.example"). */
  readonly origin: string;
  /** true solo si la indexación está abierta y el dominio es válido para ello. */
  readonly indexable: boolean;
  /** Motivo por el que se pidió indexar y no se pudo (configuración incorrecta). */
  readonly problem: string | null;
}

/** Origen usado cuando no hay dominio: solo sirve en local, nunca para indexar. */
export const LOCAL_ORIGIN = 'http://localhost:3000';

interface SiteEnv {
  SITE_URL?: string;
  SITE_INDEXING?: string;
}

function parseOrigin(raw: string | undefined): { origin: string | null; error: string | null } {
  const value = raw?.trim();
  if (!value) return { origin: null, error: 'SITE_URL no está definida' };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { origin: null, error: `SITE_URL no es una URL válida: "${value}"` };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { origin: null, error: `SITE_URL debe usar http(s): "${value}"` };
  }
  // Solo el origen: una ruta, parámetros o credenciales desplazarían todas las URL canónicas.
  if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    return { origin: null, error: `SITE_URL debe ser solo el origen, sin ruta ni parámetros: "${value}"` };
  }
  return { origin: url.origin, error: null };
}

function isPublicHttps(origin: string): boolean {
  const { protocol, hostname } = new URL(origin);
  const local = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.local');
  return protocol === 'https:' && !local;
}

/**
 * Resuelve la configuración. Nunca lanza: ante cualquier duda el sitio queda en
 * `noindex` (indexar un dominio equivocado es peor que no indexar) y `problem`
 * explica por qué, para registrarlo.
 */
export function resolveSiteConfig(env: SiteEnv): SiteConfig {
  const wantsIndexing = env.SITE_INDEXING?.trim().toLowerCase() === 'true';
  const { origin, error } = parseOrigin(env.SITE_URL);

  if (!wantsIndexing) {
    return { origin: origin ?? LOCAL_ORIGIN, indexable: false, problem: null };
  }
  if (!origin) {
    return { origin: LOCAL_ORIGIN, indexable: false, problem: `SITE_INDEXING="true" pero ${error}` };
  }
  if (!isPublicHttps(origin)) {
    return {
      origin,
      indexable: false,
      problem: `SITE_INDEXING="true" exige un SITE_URL público con https (recibido "${origin}")`,
    };
  }
  return { origin, indexable: true, problem: null };
}

let cached: SiteConfig | null = null;

/** Configuración del proceso actual (lee `process.env` una vez). */
export function getSiteConfig(): SiteConfig {
  if (!cached) {
    cached = resolveSiteConfig({ SITE_URL: process.env.SITE_URL, SITE_INDEXING: process.env.SITE_INDEXING });
    if (cached.problem) console.error(`[seo] Indexación desactivada: ${cached.problem}`);
  }
  return cached;
}

/** URL absoluta y canónica para una ruta interna ("/" → origen sin barra final). */
export function absoluteUrl(origin: string, path: string): string {
  if (!path.startsWith('/')) throw new Error(`La ruta debe empezar por "/": "${path}"`);
  return path === '/' ? origin : `${origin}${path}`;
}
