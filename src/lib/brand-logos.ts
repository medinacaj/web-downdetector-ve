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

  // International additions from audited Simple Icons vector files.
  'signal': '/brands/signal.svg',
  'wechat': '/brands/wechat.svg',
  'bluesky': '/brands/bluesky.svg',
  'figma': '/brands/figma.svg',
  'apple-music': '/brands/apple-music.svg',
  'crunchyroll': '/brands/crunchyroll.svg',
  'dota-2': '/brands/dota-2.svg',
  'uber': '/brands/uber.svg',
  'railway': '/brands/railway.svg',
  'render': '/brands/render.svg',
  'fastly': '/brands/fastly.svg',
  'mongodb-atlas': '/brands/mongodb-atlas.svg',
  'soundcloud': '/brands/soundcloud.svg',
  'deezer': '/brands/deezer.svg',
  'airbnb': '/brands/airbnb.svg',
  'wise': '/brands/wise.svg',
  'etsy': '/brands/etsy.svg',
  'line': '/brands/line.svg',
  'mastodon': '/brands/mastodon.svg',
  'trello': '/brands/trello.svg',
  'asana': '/brands/asana.svg',
});

export function logoForService(slug: string): string | null {
  return Object.prototype.hasOwnProperty.call(HOME_BRAND_LOGOS, slug)
    ? HOME_BRAND_LOGOS[slug]
    : null;
}
