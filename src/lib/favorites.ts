/** Personal favorites are browser-local only: no account, no backend and no tracking. */
export const FAVORITES_KEY = 'pulsove:favorites:v1';
/** localStorage storage events fire in other tabs, never the writing tab. */
export const FAVORITES_CHANGE_EVENT = 'pulsove:favorites:change';
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseFavoriteSlugs(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((value): value is string =>
      typeof value === 'string' && value.length <= 96 && SAFE_SLUG.test(value)
    ))].slice(0, 80);
  } catch {
    return [];
  }
}

export function toggleFavorite(slugs: readonly string[], slug: string): string[] {
  if (!SAFE_SLUG.test(slug) || slug.length > 96) return [...slugs];
  return slugs.includes(slug)
    ? slugs.filter((item) => item !== slug)
    : [...slugs.filter((item) => item !== slug), slug].slice(-80);
}
