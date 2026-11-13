import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { servicesSeed } from '../src/lib/db/seed-data/services';
import { HOME_BRAND_LOGOS, logoForService } from '../src/lib/brand-logos';
import { brandLogoSource, isAdditionalLogo } from '../src/lib/brand-logo-sources';

const requested = [
  'aliexpress', 'ebay', 'minecraft', 'amazon', 'tumblr', 'youtube-music',
  'overwatch-2', 'pokemon-go', 'gta-online', 'brawl-stars', 'among-us',
] as const;

describe('Local brand logo inventory', () => {
  it('maps at least 167 reviewed files into real catalogue entries, never remote runtime links', () => {
    const slugs = new Set<string>(servicesSeed.map((service) => service.slug));
    expect(servicesSeed).toHaveLength(211);
    expect(Object.keys(HOME_BRAND_LOGOS).length).toBeGreaterThanOrEqual(167);
    expect(Object.keys(HOME_BRAND_LOGOS).filter(isAdditionalLogo).length).toBeGreaterThanOrEqual(117);

    for (const [slug, path] of Object.entries(HOME_BRAND_LOGOS)) {
      expect(slugs.has(slug), slug).toBe(true);
      expect(path).toMatch(/^\/brands\/[a-z0-9-]+\.(svg|png)$/);
      expect(path).toBe(logoForService(slug));
      const localFile = join(process.cwd(), 'public', path.slice(1));
      expect(existsSync(localFile), 'Missing asset: ' + localFile).toBe(true);
      const bytes = readFileSync(localFile);
      expect(bytes.length, slug).toBeGreaterThan(100);
      expect(bytes.length, slug).toBeLessThan(350001);
      if (path.endsWith('.png')) {
        expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      } else {
        const svg = bytes.toString('utf8');
        expect(svg, slug).toMatch(/^<svg\s/);
        expect(svg).toContain('</svg>');
        expect(svg, slug).not.toMatch(/<script\b|<foreignObject\b|<image\b|<iframe\b|\bon[a-z]+\s*=|\b(?:href|xlink:href)\s*=|@import|url\(\s*['"]?\s*https?:/i);
      }
      const credit = brandLogoSource(slug, path);
      expect(credit.provider.length, slug).toBeGreaterThan(2);
      expect(credit.url, slug).toMatch(/^https:\/\/github\.com\/|^https:\/\/commons\.wikimedia\.org\//);
    }
  });

  it('shows all eleven specifically reported services as real local images', () => {
    for (const slug of requested) {
      expect(logoForService(slug), slug).toBe('/brands/' + slug + '.svg');
      expect(isAdditionalLogo(slug)).toBe(true);
    }
  });

  it('uses the correctly attributed EA publisher icon for EA app', () => {
    expect(logoForService('ea-app')).toBe('/brands/ea-app.svg');
    expect(brandLogoSource('ea-app', '/brands/ea-app.svg').url).toBe('https://github.com/simple-icons/simple-icons/blob/develop/icons/ea.svg');
  });

  it('attributes local community illustrations for PedidosYa and Yango', () => {
    for (const slug of ['pedidosya', 'yango']) {
      const path = logoForService(slug);
      expect(path).toBe('/brands/' + slug + '.svg');
      expect(isAdditionalLogo(slug)).toBe(true);
      const source = brandLogoSource(slug, path!);
      expect(source.provider).toContain('Lawnicons');
      expect(source.url).toBe('https://github.com/LawnchairLauncher/lawnicons/blob/develop/svgs/' + slug + '.svg');
      expect(source.licenseUrl).toContain('/LICENSE');
    }
  });

  it('keeps precise attribution for three new community illustrations', () => {
    const cases = [
      ['bbva-provincial', 'Lawnicons', 'bbva.svg'],
      ['aol-mail', 'Arcticons', 'aol.svg'],
      ['mobile-legends', 'Arcticons', 'mobile-legends-bang-bang.svg'],
    ];
    for (const [slug, provider, filename] of cases) {
      const path = logoForService(slug);
      expect(path).toBe('/brands/' + slug + '.svg');
      const source = brandLogoSource(slug, path!);
      expect(source.provider).toContain(provider);
      expect(source.url).toContain(filename);
      expect(source.licenseUrl).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it('uses source-backed local assets for five Venezuelan services', () => {
    const cases = [
      ['cashea', 'Lawnicons'],
      ['bnc', 'Arcticons'],
      ['ridery', 'Arcticons'],
      ['zinli', 'Arcticons'],
      ['zupper', 'Arcticons'],
    ];
    for (const [slug, provider] of cases) {
      const path = logoForService(slug);
      expect(path).toBe('/brands/' + slug + '.svg');
      const source = brandLogoSource(slug, path!);
      expect(source.provider).toContain(provider);
      expect(source.url).toContain(slug + '.svg');
      expect(source.licenseUrl).toMatch(/^https:\/\/github\.com\//);
      expect(isAdditionalLogo(slug)).toBe(true);
    }
  });

  it('tracks the non-official Warzone gaming illustration with its MIT source', () => {
    const path = logoForService('call-of-duty-warzone');
    expect(path).toBe('/brands/call-of-duty-warzone.svg');
    const credit = brandLogoSource('call-of-duty-warzone', path!);
    expect(credit.provider).toContain('Icons Plus');
    expect(credit.url).toContain('/call-of-duty-warzone.svg');
    expect(credit.licenseUrl).toContain('/LICENSE');
    expect(isAdditionalLogo('call-of-duty-warzone')).toBe(true);
  });

  it('keeps an honest fallback for missing/unchecked brands', () => {
    expect(logoForService('seniat')).toBeNull();
    expect(logoForService('no-existe')).toBeNull();
  });
});
