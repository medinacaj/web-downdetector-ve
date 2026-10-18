/** Configuración SEO explícita. Nunca indexar demos/despliegues sin URL aprobada. */
export function siteUrl(env: Record<string, string | undefined> = process.env): URL | null {
  const value = (env.SITE_URL || '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash
        || url.pathname !== '/' || url.hostname === 'localhost') return null;
    return url;
  } catch { return null; }
}

export function indexable(env: Record<string, string | undefined> = process.env): boolean {
  return env.PUBLIC_INDEXABLE === 'true' && !!siteUrl(env);
}

export function canonical(pathname: string, env: Record<string, string | undefined> = process.env): string | null {
  const base = siteUrl(env);
  if (!base || !pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('?')
      || pathname.includes('#')) return null;
  return new URL(pathname, base).toString();
}
