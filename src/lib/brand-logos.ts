/** Explicit first-party-hosted brand marks. Never derive image URLs from service data. */
export const HOME_BRAND_LOGOS: Readonly<Record<string, string>> = Object.freeze({
  'cantv': '/brands/cantv.png',
  'movistar': '/brands/movistar.png',
  'digitel': '/brands/digitel.png',
  'movilnet': '/brands/movilnet.png',
  'corpoelec': '/brands/corpoelec.png',
  'banco-de-venezuela': '/brands/banco-de-venezuela.png',
  'banesco': '/brands/banesco.png',
  'whatsapp': '/brands/whatsapp.svg',
  'instagram': '/brands/instagram.svg',
});

export function logoForService(slug: string): string | null {
  return Object.prototype.hasOwnProperty.call(HOME_BRAND_LOGOS, slug)
    ? HOME_BRAND_LOGOS[slug]
    : null;
}
