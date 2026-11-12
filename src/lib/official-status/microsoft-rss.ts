/**
 * Public Microsoft status RSS feeds. These report provider statements, NOT
 * citizen reports or independent uptime measurements.
 * All endpoints are fixed constants: never accept a user-provided URL.
 */
export type OfficialStatus = 'available' | 'degraded' | 'interrupted' | 'incident_reported' | 'no_public_incidents' | 'unknown';

export interface OfficialFeed {
  id: 'microsoft-365-admin' | 'power-platform-admin' | 'azure';
  name: string;
  feedUrl: string;
  statusUrl: string;
  scope: string;
  expectedTitle: string;
}

export interface OfficialFeedResult {
  id: OfficialFeed['id'];
  name: string;
  status: OfficialStatus;
  scope: string;
  statusUrl: string;
  observedAt: string;
  publishedAt: string | null;
  updatedAt: string | null;
  summary: string | null;
  incidentId: string | null;
}

export const MICROSOFT_FEEDS: readonly OfficialFeed[] = [
  {
    id: 'microsoft-365-admin',
    name: 'Microsoft 365 Admin Center',
    feedUrl: 'https://status.cloud.microsoft/api/feed/mac',
    statusUrl: 'https://status.cloud.microsoft/',
    scope: 'Estado público del centro de administración; no equivale a la salud individual de todas las aplicaciones Microsoft 365.',
    expectedTitle: 'Microsoft Admin Center Status',
  },
  {
    id: 'power-platform-admin',
    name: 'Power Platform Admin Center',
    feedUrl: 'https://status.cloud.microsoft/api/feed/ppac',
    statusUrl: 'https://status.cloud.microsoft/',
    scope: 'Acceso al centro de administración; no acredita la disponibilidad de Power Apps, Power Automate o Dynamics 365.',
    expectedTitle: 'Power Platform Admin Center Status',
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    feedUrl: 'https://rssfeed.azure.status.microsoft/en-us/status/feed/',
    statusUrl: 'https://azure.status.microsoft/en-us/status/',
    scope: 'Avisos públicos de impacto amplio; no sustituye el Azure Service Health del cliente.',
    expectedTitle: 'Azure Status',
  },
];

const MAX_FEED_CHARS = 512_000;
const MAX_ITEMS = 20;
const STATUS_MAP: Record<string, OfficialStatus> = {
  available: 'available',
  operational: 'available',
  servicedegradation: 'degraded',
  degraded: 'degraded',
  serviceinterruption: 'interrupted',
  serviceoutage: 'interrupted',
  outage: 'interrupted',
  restored: 'available',
  servicerestored: 'available',
};

function xmlTag(source: string, tag: string): string | null {
  const pattern = new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + tag + '>', 'i');
  return pattern.exec(source)?.[1]?.trim() ?? null;
}

function xmlDecode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, name: string) => {
    const fixed: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    const normalized = name.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(fixed, normalized)) return fixed[normalized];
    const code = normalized.startsWith('#x')
      ? Number.parseInt(normalized.slice(2), 16)
      : Number.parseInt(normalized.slice(1), 10);
    if (!Number.isFinite(code) || code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return '';
    return String.fromCodePoint(code);
  });
}

function plainText(text: string): string {
  // RSS descriptions sometimes contain HTML escaped as XML text.
  return xmlDecode(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 350);
}

function dateOrNull(input: string | null): string | null {
  if (!input) return null;
  const date = new Date(xmlDecode(input));
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export function parseMicrosoftRss(feed: OfficialFeed, xml: string, observedAt: string): OfficialFeedResult {
  const base: OfficialFeedResult = {
    id: feed.id, name: feed.name, scope: feed.scope, statusUrl: feed.statusUrl,
    status: 'unknown', observedAt, publishedAt: null, updatedAt: null,
    summary: null, incidentId: null,
  };
  if (xml.length > MAX_FEED_CHARS || /<!DOCTYPE|<!ENTITY/i.test(xml) || !/<rss(?:\s|>)/i.test(xml)) return base;
  const channel = xmlTag(xml, 'channel');
  if (!channel || plainText(xmlTag(channel, 'title') ?? '') !== feed.expectedTitle) return base;
  base.updatedAt = dateOrNull(xmlTag(channel, 'lastBuildDate'));
  const itemMatches = [...channel.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0, MAX_ITEMS);
  if (!itemMatches.length) {
    // An empty Azure public feed only means it contains no published incident items.
    if (feed.id === 'azure') base.status = 'no_public_incidents';
    return base;
  }
  const items = itemMatches.map((match) => {
    const body = match[1];
    return {
      status: plainText(xmlTag(body, 'status') ?? ''),
      description: plainText(xmlTag(body, 'description') ?? ''),
      title: plainText(xmlTag(body, 'title') ?? ''),
      publishedAt: dateOrNull(xmlTag(body, 'pubDate')),
      guid: plainText(xmlTag(body, 'guid') ?? ''),
    };
  });
  items.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
  const latest = items[0];
  base.publishedAt = latest.publishedAt;
  base.incidentId = latest.guid || null;
  base.summary = latest.description || latest.title || null;
  if (feed.id === 'azure') {
    // Azure RSS does not include the <status> element; item presence is not
    // proof the event is currently active or that a given region is affected.
    base.status = 'incident_reported';
  } else {
    base.status = STATUS_MAP[latest.status.toLowerCase().replace(/[^a-z]/g, '')] ?? 'unknown';
  }
  return base;
}

async function readLimited(response: Response): Promise<string> {
  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_FEED_CHARS) throw Error('RSS response too large');
  if (!response.body) throw Error('RSS response has no body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      if (text.length > MAX_FEED_CHARS) throw Error('RSS response too large');
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel().catch(() => {});
  }
}

export async function getMicrosoftOfficialStatuses(): Promise<OfficialFeedResult[]> {
  // Cache per URL for five minutes in Next.js; network errors remain explicit.
  return Promise.all(MICROSOFT_FEEDS.map(async (feed) => {
    const observedAt = new Date().toISOString();
    try {
      const response = await fetch(feed.feedUrl, {
        headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
        signal: AbortSignal.timeout(6500),
        next: { revalidate: 300 },
      });
      if (!response.ok) throw Error('RSS HTTP status ' + response.status);
      const contentType = response.headers.get('content-type') ?? '';
      if (!/xml|rss/i.test(contentType)) throw Error('Unexpected RSS content type');
      return parseMicrosoftRss(feed, await readLimited(response), observedAt);
    } catch {
      return {
        id: feed.id, name: feed.name, scope: feed.scope, statusUrl: feed.statusUrl,
        observedAt, status: 'unknown' as const, publishedAt: null,
        updatedAt: null, summary: null, incidentId: null,
      };
    }
  }));
}
