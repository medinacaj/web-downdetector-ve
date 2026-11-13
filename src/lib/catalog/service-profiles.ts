/**
 * Curated editorial context for platform pages. Entries are descriptive and
 * DO NOT imply operational monitoring, coverage, official endorsement or uptime.
 * Omitted owners must be shown as "Por verificar", never guessed from a slug.
 * Keep owner identity distinct from the owner of a domain or a reseller.
 */
export interface ServiceProfile {
  provider: string | null;
  type: string;
  description: string;
  tags: string[];
}

const PROVIDERS: Readonly<Record<string, string>> = {
  'cantv': 'CANTV',
  'digitel': 'Digitel',
  'movistar': 'Movistar',
  'movilnet': 'Movilnet',
  'corpoelec': 'CORPOELEC',
  'banco-de-venezuela': 'Banco de Venezuela',
  'banesco': 'Banesco',
  'mercantil': 'Mercantil',
  'whatsapp': 'WhatsApp (Meta)',
  'instagram': 'Meta Platforms',
  'cloudflare': 'Cloudflare, Inc.',
  'amazon-web-services': 'Amazon Web Services',
  'google-cloud': 'Google',
  'microsoft-azure': 'Microsoft',
  'github': 'GitHub (Microsoft)',
  'vercel': 'Vercel',
  'gmail': 'Google',
  'outlook': 'Microsoft',
  'microsoft-365': 'Microsoft',
  'google-drive': 'Google',
  'microsoft-teams': 'Microsoft',
  'zoom': 'Zoom',
  'fortnite': 'Epic Games',
  'roblox': 'Roblox Corporation',
  'steam': 'Valve',
  'valorant': 'Riot Games',
  'minecraft': 'Mojang Studios (Microsoft)',
  'epic-games-store': 'Epic Games',
  'chatgpt': 'OpenAI',
  'google-gemini': 'Google',
  'claude': 'Anthropic',
  'discord': 'Discord',
  'reddit': 'Reddit',
  'twitch': 'Twitch',
  'amazon': 'Amazon',
  'paypal': 'PayPal',
  'shopify': 'Shopify',
  'stripe': 'Stripe',
  'aliexpress': 'Alibaba Group',
  'ebay': 'eBay',
  'signal': 'Signal Foundation',
  'wechat': 'Tencent',
  'line': 'LY Corporation',
  'bluesky': 'Bluesky Social',
  'mastodon': 'Mastodon',
  'tumblr': 'Automattic',
  'apple-music': 'Apple',
  'youtube-music': 'Google',
  'crunchyroll': 'Crunchyroll',
  'pluto-tv': 'Pluto TV',
  'soundcloud': 'SoundCloud',
  'deezer': 'Deezer',
  'dota-2': 'Valve',
  'overwatch-2': 'Blizzard Entertainment',
  'gta-online': 'Rockstar Games',
  'brawl-stars': 'Supercell',
  'among-us': 'Innersloth',
  'fastly': 'Fastly',
  'railway': 'Railway',
  'render': 'Render',
  'mongodb-atlas': 'MongoDB',
  'airbnb': 'Airbnb',
  'uber': 'Uber',
  'wise': 'Wise',
  'etsy': 'Etsy',
  'figma': 'Figma',
  'trello': 'Atlassian',
  'asana': 'Asana',
};

const TAGS: Readonly<Record<string, readonly string[]>> = {
  cloudflare: ['CDN', 'DNS', 'Seguridad web'],
  gmail: ['Correo electrónico', 'Productividad'],
  outlook: ['Correo electrónico', 'Calendario'],
  fortnite: ['Videojuego', 'Multijugador'],
  'amazon-web-services': ['Computación en la nube', 'Infraestructura'],
  'google-cloud': ['Computación en la nube', 'Infraestructura'],
  'microsoft-azure': ['Computación en la nube', 'Infraestructura'],
  github: ['Código', 'Colaboración'],
  vercel: ['Despliegue web', 'Hosting'],
  'microsoft-365': ['Productividad', 'Colaboración'],
  'google-drive': ['Archivos', 'Almacenamiento'],
  'microsoft-teams': ['Videollamadas', 'Colaboración'],
  steam: ['Tienda de videojuegos', 'PC'],
  discord: ['Comunidad', 'Mensajería'],
  whatsapp: ['Mensajería', 'Llamadas'],
  instagram: ['Red social', 'Contenido'],
  'google-gemini': ['Inteligencia artificial', 'Asistente'],
  chatgpt: ['Inteligencia artificial', 'Asistente'],
  claude: ['Inteligencia artificial', 'Asistente'],
  cantv: ['Internet fijo', 'Telefonía'],
  digitel: ['Telefonía móvil', 'Datos móviles'],
  movistar: ['Telefonía móvil', 'Datos móviles'],
  movilnet: ['Telefonía móvil', 'Datos móviles'],
};

export function getServiceProfile(input: {
  slug: string;
  categoryName: string;
  description: string | null | undefined;
}): ServiceProfile {
  const tags = [input.categoryName, ...(TAGS[input.slug] ?? [])];
  return {
    provider: PROVIDERS[input.slug] ?? null,
    type: input.categoryName,
    description: input.description?.trim() || 'Descripción editorial pendiente de verificar para este servicio.',
    tags: [...new Set(tags)],
  };
}
