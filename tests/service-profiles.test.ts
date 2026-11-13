import { describe, expect, it } from 'vitest';
import { getServiceProfile } from '../src/lib/catalog/service-profiles';
import { servicesSeed } from '../src/lib/db/seed-data/services';
import { categoriesSeed } from '../src/lib/db/seed-data/categories';

describe('service editorial profile', () => {
  it('resolves providers and useful tags for requested global platforms', () => {
    const cases = [
      ['cloudflare', 'Cloudflare, Inc.'],
      ['gmail', 'Google'],
      ['outlook', 'Microsoft'],
      ['fortnite', 'Epic Games'],
    ];
    for (const [slug, provider] of cases) {
      const entry = servicesSeed.find((service) => service.slug === slug);
      expect(entry).toBeDefined();
      const profile = getServiceProfile({ slug, categoryName: 'Plataformas', description: entry!.description });
      expect(profile.provider).toBe(provider);
      expect(profile.tags.length).toBeGreaterThan(1);
      expect(profile.description.length).toBeGreaterThan(10);
      expect(profile.companyOverview.length).toBeGreaterThan(140);
      expect(profile.mainUses.length).toBeGreaterThan(2);
      expect(profile.sourceUrl).toMatch(/^https:\/\//);
    }
  });
  it('describes five major streaming and messaging services with official editorial sources', () => {
    for (const slug of ['netflix', 'spotify', 'telegram', 'youtube', 'signal']) {
      const entry = servicesSeed.find((service) => service.slug === slug);
      expect(entry, slug).toBeDefined();
      const p = getServiceProfile({slug, categoryName: 'Plataformas', description: entry!.description});
      expect(p.provider, slug).toBeTruthy();
      expect(p.companyOverview.length, slug).toBeGreaterThan(140);
      expect(p.mainUses.length, slug).toBeGreaterThanOrEqual(4);
      expect(p.sourceUrl, slug).toMatch(/^https:\/\//);
      expect(p.companyOverview, slug).not.toMatch(/pendiente de verificación/);
    }
  });

  it('provides referenced profiles for community and console account services', () => {
    const cases = [
      ['twitch', 'twitch.tv'],
      ['reddit', 'about.reddit.com'],
      ['linkedin', 'about.linkedin.com'],
      ['playstation-network', 'playstation.com'],
    ];
    for (const [slug, domain] of cases) {
      const item = servicesSeed.find((service) => service.slug === slug);
      expect(item, slug).toBeDefined();
      const profile = getServiceProfile({ slug, categoryName: 'Plataformas', description: item!.description });
      expect(profile.provider, slug).toBeTruthy();
      expect(profile.companyOverview.length, slug).toBeGreaterThan(170);
      expect(profile.mainUses, slug).toHaveLength(4);
      expect(profile.sourceUrl, slug).toContain(domain);
      expect(profile.companyOverview, slug).not.toMatch(/pendiente de verificación/);
    }
  });

  it('uses verified corporate references for Banesco, BNC and Digitel', () => {
    const cases = [
      ['banesco', 'banesco.com'],
      ['bnc', 'banconacionaldecredito.com.ve'],
      ['digitel', 'digitel.com.ve'],
    ];
    for (const [slug, domain] of cases) {
      const item = servicesSeed.find((service) => service.slug === slug);
      expect(item, slug).toBeDefined();
      const profile = getServiceProfile({ slug, categoryName: 'Servicios', description: item!.description });
      expect(profile.provider, slug).toBeTruthy();
      expect(profile.companyOverview.length, slug).toBeGreaterThan(160);
      expect(profile.mainUses, slug).toHaveLength(4);
      expect(profile.sourceUrl, slug).toContain(domain);
    }
  });

  it('includes verified company context for Inter and Mercantil without inventing uptime', () => {
    const cases = [
      ['inter', 'blog.inter.com.ve'],
      ['mercantil', 'mercantilbanco.com'],
    ];
    for (const [slug, domain] of cases) {
      const item = servicesSeed.find((service) => service.slug === slug);
      expect(item, slug).toBeDefined();
      const profile = getServiceProfile({
        slug,
        categoryName: 'Servicios en Venezuela',
        description: item!.description,
      });
      expect(profile.provider, slug).toBeTruthy();
      expect(profile.companyOverview.length, slug).toBeGreaterThan(220);
      expect(profile.mainUses, slug).toHaveLength(4);
      expect(profile.sourceUrl, slug).toContain(domain);
      expect(profile.companyOverview, slug).not.toMatch(/pendiente de verificación/i);
    }
  });

  it('uses a transparent fallback rather than guessing unknown providers', () => {
    const p = getServiceProfile({ slug: 'unknown-service', categoryName: 'Servicios', description: null });
    expect(p.provider).toBeNull();
    expect(p.type).toBe('Servicios');
    expect(p.tags).toEqual(['Servicios']);
    expect(p.sourceUrl).toBeNull();
    expect(p.companyOverview).toMatch(/pendiente de verificación/);
    expect(p.mainUses).toHaveLength(1);
    expect(p.description).toMatch(/pendiente de verificar/);
  });
  it('does not treat inherited object names as verified providers or tag lists', () => {
    for (const slug of ['__proto__', 'constructor', 'toString']) {
      const profile = getServiceProfile({
        slug,
        categorySlug: '__proto__',
        categoryName: 'Servicios',
        description: null,
      });
      expect(profile.provider).toBeNull();
      expect(profile.sourceUrl).toBeNull();
      expect(profile.tags).toEqual(['Servicios']);
      expect(profile.companyOverview).toContain('pendiente de verificación');
      expect(typeof profile.monitoringContext).toBe('string');
    }
  });

  it('can produce a profile for every catalogue item without losing category', () => {
    const categories = new Map<string, string>(categoriesSeed.map(({ slug, name }) => [slug, name]));
    for (const service of servicesSeed) {
      const categoryName = categories.get(service.categorySlug);
      expect(categoryName).toBeTruthy();
      const p = getServiceProfile({ slug: service.slug, categoryName: categoryName!, description: service.description });
      expect(p.type).toBe(categoryName);
      expect(p.tags).toContain(categoryName);
      expect(p.companyOverview.length).toBeGreaterThan(60);
      expect(p.monitoringContext.length).toBeGreaterThan(60);
    }
  });
});
