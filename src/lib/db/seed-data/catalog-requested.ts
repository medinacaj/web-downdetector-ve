import { chileGroups } from './catalog-chile';
import { venezuelaGroups } from './catalog-venezuela';
import { globalGroups } from './catalog-global';

/** User-supplied catalog candidates; no live-status, legality or coverage claims. */
export const requestedGroups = [
  { source: 'Chile', groups: chileGroups },
  { source: 'Venezuela', groups: venezuelaGroups },
  { source: 'Internacional', groups: globalGroups },
] as const;

export interface RequestedService {
  slug: string;
  name: string;
  categorySlug: string;
  description: string;
}

const ALIASES: Readonly<Record<string, string>> = {
  "X (Twitter)": "x-twitter",
  "Facebook Messenger": "messenger",
  "Microsoft Outlook": "outlook",
  "Google": "google-search",
  "ChatGPT (OpenAI)": "chatgpt",
  "Claude AI": "claude",
  "Perplexity AI": "perplexity",
  "Character.ai": "character-ai",
  "Max (HBO)": "hbo-max",
  "FIFA / EA Sports FC": "ea-sports-fc",
  "EA Sports FC (FIFA)": "ea-sports-fc",
  "Electronic Arts (EA)": "ea-app",
  "Epic Games": "epic-games-store",
  "Xbox Live": "xbox",
  "Grand Theft Auto Online": "gta-online",
  "PUBG": "pubg-battlegrounds",
  "Call of Duty Warzone": "call-of-duty-warzone",
  "Amazon Web Services (AWS)": "amazon-web-services",
  "Google Gemini": "google-gemini",
  "npm": "npm-registry",
  "SimpleTV": "simple-tv",
  "Movistar Venezuela": "movistar",
  "Movistar Chile": "movistar-chile",
  "Banco Mercantil": "mercantil",
  "Banco Nacional de Crédito (BNC)": "bnc",
  "Fibex Telecom": "fibex",
  "Wally Tech": "wally",
  "Mercado Libre Venezuela": "mercado-libre",
  "DirecTV Go (DGO)": "dgo",
  "BCP (Banco de Crédito del Perú)": "bcp",
  "H&M": "h-and-m",
  "100% Banco": "100-banco",
  "Google Play": "google-play",
  "Banco Central de Venezuela": "bcv",
  "Microsoft 365": "microsoft-365",
  "Proton Mail": "proton-mail",
  "Google Workspace": "google-workspace",
  "Google Drive": "google-drive",
  "Google Meet": "google-meet",
  "Google Docs": "google-docs",
  "PlayStation Network": "playstation-network",
  "Facebook": "facebook",
  "Call of Duty: Warzone": "call-of-duty-warzone",
};

function normalizedName(name: string): string {
  return name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function slugForRequestedName(name: string): string {
  const alias = Object.prototype.hasOwnProperty.call(ALIASES, name) ? ALIASES[name] : undefined;
  if (alias) return alias;
  return name.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/&/g, ' and ').replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const CATEGORY_CONTEXT: Readonly<Record<string, string>> = {
  'telecomunicaciones': 'Internet, conectividad y telefonía',
  'banca-y-pagos': 'Canales digitales de banca, pagos o finanzas',
  'servicios-publicos': 'Trámites y servicios de administración pública',
  'plataformas-digitales': 'Redes, aplicaciones y plataformas digitales',
  'streaming': 'Contenido multimedia y reproducción en línea',
  'videojuegos': 'Servicios y videojuegos conectados',
  'delivery-y-movilidad': 'Pedidos, entregas o transporte por aplicación',
  'apuestas-y-loterias': 'Servicios de lotería o apuestas; autorización sin verificar',
  'correo-y-productividad': 'Correo, herramientas de trabajo y colaboración',
  'nube-e-infraestructura': 'Infraestructura y herramientas de desarrollo en línea',
  'inteligencia-artificial': 'Herramientas y aplicaciones de inteligencia artificial',
  'comercio-global': 'Tiendas, mercados y plataformas de comercio',
  'viajes-y-turismo': 'Reservas, aerolíneas y herramientas de viaje',
  'salud-y-farmacias': 'Portales de farmacias, bienestar y salud',
  'logistica-y-envios': 'Gestión, envío y seguimiento de encomiendas',
  'seguridad-y-privacidad': 'Conexión segura, autenticación y protección digital',
  'educacion-y-contenidos': 'Educación, aprendizaje y aulas digitales',
  'clima-y-datos': 'Información meteorológica y datos en línea',
};

export function expandRequestedServices(existing: readonly { slug: string; name: string }[]): RequestedService[] {
  const reservedSlugs = new Set(existing.map((s) => s.slug));
  const reservedNames = new Set(existing.map((s) => normalizedName(s.name)));
  const candidates = new Map<string, { name: string; slug: string; categorySlug: string; sources: Set<string> }>();
  const seenNames = new Set<string>();
  for (const { source, groups } of requestedGroups) {
    for (const [categorySlug, entries] of Object.entries(groups)) {
      for (const untrimmed of entries.split(';')) {
        const name = untrimmed.trim();
        if (!name) continue;
        const slug = slugForRequestedName(name);
        const prior = candidates.get(slug);
        if (prior) { prior.sources.add(source); continue; }
        if (reservedSlugs.has(slug) || reservedNames.has(normalizedName(name))) continue;
        if (seenNames.has(normalizedName(name))) continue;
        const candidate = { name, slug, categorySlug, sources: new Set([source]) };
        candidates.set(slug, candidate);
        seenNames.add(normalizedName(name));
      }
    }
  }
  return [...candidates.values()].map(({ name, slug, categorySlug, sources }) => {
    const context = CATEGORY_CONTEXT[categorySlug] ?? 'Servicio digital';
    const areas = [...sources].join(', ');
    const caution = ['skype', 'star-plus'].includes(slug)
      ? 'Marca histórica; servicio descontinuado, sin estado en vivo.'
      : slug === 'magis-tv'
        ? 'Licencia y distribución por verificar; sin aval de PulsoVE.'
        : 'Sin monitoreo técnico ni disponibilidad confirmada.';
    return { slug, name, categorySlug, description: context + '. Referencia solicitada: ' + areas + '. ' + caution };
  });
}
