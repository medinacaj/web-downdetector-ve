import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL_ORIGIN, absoluteUrl, resolveSiteConfig } from '../src/lib/seo/site';
import { buildRobots, buildSitemap } from '../src/lib/seo/crawl';
import { pageMetadata } from '../src/lib/seo/metadata';
import { ROUTE } from '../src/lib/nav';
import { breadcrumbJsonLd, serializeJsonLd, siteJsonLd } from '../src/lib/seo/json-ld';

const PROD = { SITE_URL: 'https://pulsove.example', SITE_INDEXING: 'true' };

describe('seo: configuración del sitio', () => {
  it('por defecto (sin variables) el sitio queda en noindex con origen local', () => {
    expect(resolveSiteConfig({})).toEqual({ origin: LOCAL_ORIGIN, indexable: false, problem: null });
  });

  it('SITE_INDEXING distinto de "true" mantiene el noindex aunque haya dominio', () => {
    for (const value of [undefined, '', 'false', '1', 'yes']) {
      const site = resolveSiteConfig({ SITE_URL: PROD.SITE_URL, SITE_INDEXING: value });
      expect(site.indexable, String(value)).toBe(false);
      expect(site.origin).toBe('https://pulsove.example');
    }
  });

  it('indexa solo con SITE_INDEXING="true" y un origen público en https', () => {
    expect(resolveSiteConfig(PROD)).toEqual({ origin: 'https://pulsove.example', indexable: true, problem: null });
    expect(resolveSiteConfig({ ...PROD, SITE_URL: 'https://pulsove.example/' }).origin).toBe('https://pulsove.example');
  });

  it('pedir indexación con un dominio inválido, local o sin https deja el sitio en noindex y explica por qué', () => {
    for (const url of [undefined, '', 'no es url', 'http://pulsove.example', 'https://localhost:3000', 'https://pulsove.example/es', 'https://pulsove.example?x=1', 'ftp://pulsove.example']) {
      const site = resolveSiteConfig({ SITE_URL: url, SITE_INDEXING: 'true' });
      expect(site.indexable, String(url)).toBe(false);
      expect(site.problem, String(url)).toMatch(/SITE_/);
    }
  });

  it('absoluteUrl compone URLs canónicas sin barra final', () => {
    expect(absoluteUrl('https://pulsove.example', '/')).toBe('https://pulsove.example');
    expect(absoluteUrl('https://pulsove.example', '/servicios')).toBe('https://pulsove.example/servicios');
    expect(() => absoluteUrl('https://pulsove.example', 'servicios')).toThrow();
  });
});

describe('seo: robots.txt', () => {
  it('nunca bloquea el sitio entero y excluye solo /api/', () => {
    for (const env of [{}, PROD]) {
      const robots = buildRobots(resolveSiteConfig(env));
      expect(robots.rules).toEqual({ userAgent: '*', allow: '/', disallow: '/api/' });
    }
  });

  it('anuncia el sitemap solo cuando el sitio es indexable', () => {
    expect(buildRobots(resolveSiteConfig({})).sitemap).toBeUndefined();
    expect(buildRobots(resolveSiteConfig(PROD)).sitemap).toBe('https://pulsove.example/sitemap.xml');
  });
});

describe('seo: sitemap.xml', () => {
  it('queda vacío mientras el sitio está en noindex', () => {
    expect(buildSitemap(resolveSiteConfig({}), { categories: ['streaming'], services: ['netflix'] })).toEqual([]);
  });

  it('con indexación abierta lista portada, directorio, categorías y servicios: absolutas, únicas y sin parámetros', () => {
    const urls = buildSitemap(resolveSiteConfig(PROD), {
      categories: ['streaming'],
      services: ['banesco', 'netflix', 'netflix'],
    }).map((e) => e.url);
    expect(urls).toEqual([
      'https://pulsove.example',
      'https://pulsove.example/servicios',
      'https://pulsove.example/incidentes',
      'https://pulsove.example/estadisticas',
      'https://pulsove.example/metodologia',
      'https://pulsove.example/mapa',
      'https://pulsove.example/categorias/streaming',
      'https://pulsove.example/servicios/banesco',
      'https://pulsove.example/servicios/netflix',
    ]);
    for (const url of urls) expect(url).toMatch(/^https:\/\/pulsove\.example(\/[a-z0-9-]+)*$/);
  });

  it('solo incluye páginas fijas disponibles según src/lib/nav.ts', () => {
    const urls = buildSitemap(resolveSiteConfig(PROD), { categories: [], services: [] }).map((e) => e.url);
    for (const route of Object.values(ROUTE)) {
      const url = route.href === '/' ? 'https://pulsove.example' : `https://pulsove.example${route.href}`;
      expect(urls.includes(url), route.href).toBe(route.available);
    }
  });
});

describe('seo: la política de indexación vive solo en el layout raíz', () => {
  it('ninguna página ni layout fuera de src/app/layout.tsx define robots en su metadata', () => {
    // Un `robots` en una página taparía la política global (p. ej. un index
    // olvidado mientras el sitio debe estar en noindex). Si una página necesita
    // otra regla, debe derivarla de getSiteConfig() y ajustarse esta prueba.
    const appDir = join(process.cwd(), 'src', 'app');
    const offenders = (readdirSync(appDir, { recursive: true }) as string[])
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => /(^|\/)(page|layout)\.tsx$/.test(f) && f !== 'layout.tsx')
      .filter((f) => /\brobots\s*:/.test(readFileSync(join(appDir, f), 'utf8')));
    expect(offenders).toEqual([]);
  });
});

describe('seo: metadata de página', () => {
  it('canonical, Open Graph y Twitter coinciden entre sí', () => {
    const m = pageMetadata({ title: 'Servicios', description: 'Directorio.', path: '/servicios' });
    expect(m.title).toBe('Servicios');
    expect(m.alternates?.canonical).toBe('/servicios');
    expect(m.openGraph).toMatchObject({
      url: '/servicios',
      title: 'Servicios | PulsoVE',
      description: 'Directorio.',
      locale: 'es_VE',
      siteName: 'PulsoVE',
    });
    expect(m.twitter).toMatchObject({ card: 'summary_large_image', title: 'Servicios | PulsoVE' });
    expect(m).not.toHaveProperty('robots');
  });

  it('el título absoluto (portada) no recibe el sufijo del sitio', () => {
    const m = pageMetadata({ title: 'PulsoVE — Inicio real', description: 'x', path: '/', absoluteTitle: true });
    expect(m.title).toEqual({ absolute: 'PulsoVE — Inicio real' });
    expect(m.openGraph?.title).toBe('PulsoVE — Inicio real');
  });

  it('rechaza canónicas relativas o con parámetros', () => {
    for (const path of ['servicios', '/servicios?category=banca', '/servicios#x']) {
      expect(() => pageMetadata({ title: 't', description: 'd', path }), path).toThrow();
    }
  });

  it('toda página pública construye su metadata con pageMetadata (canonical incluida)', () => {
    const appDir = join(process.cwd(), 'src', 'app');
    const pages = (readdirSync(appDir, { recursive: true }) as string[])
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => /(^|\/)page\.tsx$/.test(f) && !f.startsWith('api/'));
    expect(pages.length).toBeGreaterThan(0);
    const missing = pages.filter((f) => !/pageMetadata\(/.test(readFileSync(join(appDir, f), 'utf8')));
    expect(missing).toEqual([]);
  });
});

describe('seo: datos estructurados (JSON-LD)', () => {
  const ORIGIN = 'https://pulsove.example';

  it('portada: WebSite y Organization con URL absolutas y solo datos reales', () => {
    const data = siteJsonLd(ORIGIN);
    const graph = data['@graph'] as Record<string, unknown>[];
    expect(graph.map((n) => n['@type'])).toEqual(['WebSite', 'Organization']);
    expect(graph[0]).toMatchObject({ name: 'PulsoVE', url: ORIGIN, inLanguage: 'es-VE' });
    expect(graph[1]).toMatchObject({ url: ORIGIN, logo: `${ORIGIN}/apple-icon.png` });
    // Nada que el sitio no pueda respaldar (ni inventado ni demostrativo).
    expect(JSON.stringify(data)).not.toMatch(/telephone|address|sameAs|aggregateRating|review|email/i);
  });

  it('miga de pan: posiciones desde 1 y URL absolutas, en el orden visible', () => {
    const data = breadcrumbJsonLd(ORIGIN, [
      { name: 'Servicios', path: '/servicios' },
      { name: 'Streaming', path: '/categorias/streaming' },
      { name: 'Netflix', path: '/servicios/netflix' },
    ]);
    expect(data['@type']).toBe('BreadcrumbList');
    expect(data.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Servicios', item: `${ORIGIN}/servicios` },
      { '@type': 'ListItem', position: 2, name: 'Streaming', item: `${ORIGIN}/categorias/streaming` },
      { '@type': 'ListItem', position: 3, name: 'Netflix', item: `${ORIGIN}/servicios/netflix` },
    ]);
    expect(() => breadcrumbJsonLd(ORIGIN, [])).toThrow();
  });

  it('la serialización escapa "<" para que un texto no pueda cerrar el <script>', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});
