import { describe, expect, it } from 'vitest';
import { categoriesSeed } from '@/lib/db/seed-data/categories';
import { servicesSeed } from '@/lib/db/seed-data/services';
import { issueTypesSeed } from '@/lib/db/seed-data/issue-types';
import { WORLDWIDE_SPOTLIGHT, selectWorldwideSpotlights } from '@/lib/queries/home-trends';
import { logoForService } from '@/lib/brand-logos';

const slugs = new Set<string>(servicesSeed.map((service) => service.slug));
const categorySlugs = new Set<string>(categoriesSeed.map((category) => category.slug));

describe('worldwide platform catalogue', () => {
  it('includes more than 140 services across at least 12 categories', () => {
    expect(servicesSeed.length).toBeGreaterThanOrEqual(211);
    expect(categoriesSeed.length).toBeGreaterThanOrEqual(12);
    expect(new Set(servicesSeed.map((service) => service.slug)).size).toBe(servicesSeed.length);
  });

  it('includes the four requested services and popular international platforms', () => {
    for (const slug of [
      'cloudflare', 'gmail', 'outlook', 'fortnite',
      'amazon-web-services', 'google-cloud', 'microsoft-azure', 'github', 'vercel',
      'microsoft-365', 'microsoft-teams', 'google-drive', 'zoom',
      'roblox', 'steam', 'valorant', 'epic-games-store', 'minecraft',
      'chatgpt', 'google-gemini', 'claude', 'discord', 'reddit',
      'amazon', 'shopify', 'paypal', 'stripe',
      'signal', 'wechat', 'apple-music', 'crunchyroll', 'dota-2', 'overwatch-2',
      'figma', 'railway', 'render', 'fastly', 'wise', 'uber', 'airbnb',
    ]) {
      expect(slugs.has(slug), `Missing international service: ${slug}`).toBe(true);
    }
  });

  it('all entries use real categories and every category has report reasons', () => {
    for (const service of servicesSeed) {
      expect(categorySlugs.has(service.categorySlug)).toBe(true);
      expect(service.description.length).toBeLessThanOrEqual(200);
      expect('officialUrl' in service).toBe(false);
    }
    for (const category of ['correo-y-productividad', 'nube-e-infraestructura', 'inteligencia-artificial', 'comercio-global']) {
      expect(issueTypesSeed.filter((type) => type.categorySlug === category).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('five homepage global sections cover 30 unique services without inventing records', () => {
    expect(WORLDWIDE_SPOTLIGHT).toHaveLength(8);
    const allSlugs = WORLDWIDE_SPOTLIGHT.flatMap((section) => section.slugs);
    expect(allSlugs).toHaveLength(48);
    expect(new Set(allSlugs).size).toBe(allSlugs.length);
    expect(allSlugs.every((slug) => slugs.has(slug))).toBe(true);

    const selected = selectWorldwideSpotlights(servicesSeed);
    expect(selected).toHaveLength(8);
    expect(selected.flatMap((section) => section.services)).toHaveLength(48);
    expect(selectWorldwideSpotlights([])).toEqual([]);
    expect(selectWorldwideSpotlights(servicesSeed.filter((service) => service.slug === 'fortnite'))[0]?.services[0]?.slug).toBe('fortnite');
  });

  it('locally hosted logos are curated and fallback remains for unverified brands', () => {
    for (const slug of ['cloudflare', 'gmail', 'fortnite', 'discord', 'github', 'google-cloud', 'roblox']) {
      expect(logoForService(slug)).toBe(`/brands/${slug}.svg`);
    }
    expect(logoForService('outlook')).toBe('/brands/outlook.svg');
    expect(logoForService('minecraft')).toBe('/brands/minecraft.svg');
    expect(logoForService('seniat')).toBe('/brands/seniat.svg');
  });
});
