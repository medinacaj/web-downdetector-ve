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
  // Additional locally vendored Simple Icons brand marks (CC0 graphics; trademark rights reserved).
  'cloudflare': '/brands/cloudflare.svg',
  'gmail': '/brands/gmail.svg',
  'fortnite': '/brands/fortnite.svg',
  'discord': '/brands/discord.svg',
  'github': '/brands/github.svg',
  'google-cloud': '/brands/google-cloud.svg',
  'vercel': '/brands/vercel.svg',
  'epic-games-store': '/brands/epic-games-store.svg',
  'steam': '/brands/steam.svg',
  'roblox': '/brands/roblox.svg',
  'valorant': '/brands/valorant.svg',
  'google-gemini': '/brands/google-gemini.svg',
  'paypal': '/brands/paypal.svg',
  'shopify': '/brands/shopify.svg',
  'stripe': '/brands/stripe.svg',
  'reddit': '/brands/reddit.svg',
  'twitch': '/brands/twitch.svg',
  'claude': '/brands/claude.svg',
  'zoom': '/brands/zoom.svg',
  'google-drive': '/brands/google-drive.svg',
});

export function logoForService(slug: string): string | null {
  return Object.prototype.hasOwnProperty.call(HOME_BRAND_LOGOS, slug)
    ? HOME_BRAND_LOGOS[slug]
    : null;
}
