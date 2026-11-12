/**
 * Hourly reports are grouped in PostgreSQL after a rolling 24h filter.
 * Because the first and last hour are partial, there are up to 25 clock-hour buckets.
 * Never fabricate a chart when all counts are zero.
 */
export const HOUR_MS = 60 * 60 * 1000;

export interface HourlyReportRow {
  hour: Date | string;
  count: number;
}

export function toHourlySeries(rows: readonly HourlyReportRow[], now: Date): number[] {
  const end = Math.floor(now.getTime() / HOUR_MS);
  const start = end - 24;
  const points = Array<number>(25).fill(0);

  for (const row of rows) {
    const ms = new Date(row.hour).getTime();
    const hour = Math.floor(ms / HOUR_MS);
    if (!Number.isFinite(ms) || hour < start || hour > end) continue;
    if (!Number.isFinite(row.count) || row.count <= 0) continue;
    points[hour - start] += Math.trunc(row.count);
  }
  return points;
}

export function sparklinePolyline(counts: readonly number[], width = 300, height = 64): string | null {
  if (counts.length < 2 || counts.every((count) => count <= 0)) return null;
  const padding = 5;
  const peak = Math.max(1, ...counts);
  return counts.map((count, index) => {
    const x = padding + (index / (counts.length - 1)) * (width - padding * 2);
    const y = height - padding - (Math.max(0, count) / peak) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

/** Curated order applies only when all services have zero recent reports. */
export const HOME_SERVICE_SLUGS = [
  'cantv', 'movistar', 'digitel', 'movilnet', 'corpoelec', 'banco-de-venezuela',
  'banesco', 'mercantil', 'whatsapp', 'instagram', 'sistema-patria', 'seniat',
] as const;

export function pickFeaturedServices<T extends { slug: string; reportsLast24h: number; name: string }>(
  services: readonly T[],
  limit = 12,
): T[] {
  const priority = new Map<string, number>(HOME_SERVICE_SLUGS.map((slug, index) => [slug, index]));
  return [...services].sort((a, b) =>
    (b.reportsLast24h - a.reportsLast24h)
    || ((priority.get(a.slug) ?? Number.MAX_SAFE_INTEGER) - (priority.get(b.slug) ?? Number.MAX_SAFE_INTEGER))
    || a.name.localeCompare(b.name, 'es')
  ).slice(0, limit);
}

/**
 * Global catalogue spotlight. Explicitly grouped so popular cloud, mail and
 * gaming platforms remain discoverable even when Venezuela has no reports.
 * Editorial order is not a worldwide usage ranking.
 */
export const WORLDWIDE_SPOTLIGHT = [
  { id: 'nube', title: 'Nube e infraestructura', description: 'Cloudflare, infraestructura, repositorios y despliegues.', slugs: [
    'cloudflare', 'amazon-web-services', 'google-cloud', 'microsoft-azure', 'github', 'vercel',
  ] },
  { id: 'correo', title: 'Correo y productividad', description: 'Correo, reuniones y herramientas de trabajo.', slugs: [
    'gmail', 'outlook', 'microsoft-365', 'google-drive', 'microsoft-teams', 'zoom',
  ] },
  { id: 'juegos', title: 'Videojuegos y plataformas de juego', description: 'Títulos multijugador y plataformas de acceso.', slugs: [
    'fortnite', 'roblox', 'steam', 'valorant', 'minecraft', 'epic-games-store',
  ] },
  { id: 'ia-comunidad', title: 'Inteligencia artificial y comunidades', description: 'Asistentes, mensajería y comunidades en línea.', slugs: [
    'chatgpt', 'google-gemini', 'claude', 'discord', 'reddit', 'twitch',
  ] },
  { id: 'comercio', title: 'Comercio y pagos internacionales', description: 'Tiendas y servicios de transacciones globales.', slugs: [
    'amazon', 'paypal', 'shopify', 'stripe', 'aliexpress', 'ebay',
  ] },
] as const;

export function selectWorldwideSpotlights<T extends { slug: string }>(
  services: readonly T[],
): { id: string; title: string; description: string; services: T[] }[] {
  const lookup = new Map(services.map((service) => [service.slug, service]));
  return WORLDWIDE_SPOTLIGHT.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    services: section.slugs.map((slug) => lookup.get(slug)).filter((service): service is T => !!service),
  })).filter((section) => section.services.length > 0);
}
