import { describe, expect, it } from 'vitest';
import { servicesSeed, originalServicesSeed } from '../src/lib/db/seed-data/services';
import { categoriesSeed } from '../src/lib/db/seed-data/categories';
import { issueTypesSeed } from '../src/lib/db/seed-data/issue-types';
import { requestedGroups, slugForRequestedName } from '../src/lib/db/seed-data/catalog-requested';

describe('catálogo ampliado solicitado: Chile, Venezuela e internacional', () => {
  const slugs = servicesSeed.map((item) => item.slug);
  const bySlug = new Map(servicesSeed.map((item) => [item.slug, item]));

  it('conserva los 211 registros previos sin cambiar sus slugs ni orden', () => {
    expect(originalServicesSeed).toHaveLength(211);
    expect(slugs.slice(0, 211)).toEqual(originalServicesSeed.map((item) => item.slug));
    expect(servicesSeed).toHaveLength(579);
    expect(new Set(slugs).size).toBe(servicesSeed.length);
  });

  it('concilia todos los 650 renglones solicitados, sin duplicar marcas', () => {
    let requested = 0;
    const sources = new Set<string>();
    for (const { source, groups } of requestedGroups) {
      sources.add(source);
      for (const [categorySlug, entries] of Object.entries(groups)) {
        expect(categoriesSeed.some((category) => category.slug === categorySlug)).toBe(true);
        for (const raw of entries.split(';')) {
          const name = raw.trim();
          if (!name) continue;
          requested++;
          const slug = slugForRequestedName(name);
          expect(bySlug.has(slug), `Sin ficha de ${name} (${source}) → ${slug}`).toBe(true);
        }
      }
    }
    expect(requested).toBe(650); // 150 Chile (Mercado Libre aparece dos veces), 81 VE, 419 global
    expect([...sources]).toEqual(['Chile', 'Venezuela', 'Internacional']);
  });

  it('no confunde Movistar de Venezuela con Movistar Chile ni duplica plataformas globales', () => {
    for (const slug of [
      'movistar', 'movistar-chile', 'bancoestado', 'banco-de-chile', 'banco-bci',
      'sii-servicio-de-impuestos-internos', 'claveunica', 'correoschile',
      'aba-cantv', 'biopagobdv', 'ivss', 'hidrocapital',
      'amazon-web-services', 'chatgpt', 'claude', 'google-gemini',
      'starlink', 'mercado-libre', 'genshin-impact', 'bancaribe',
    ]) {
      expect(bySlug.has(slug), `Falta ${slug}`).toBe(true);
    }
    for (const slug of ['mercado-libre', 'bancaribe', 'genshin-impact', 'paypal', 'whatsapp']) {
      expect(slugs.filter((item) => item === slug)).toHaveLength(1);
    }
  });

  it('respeta descripciones, categorías y URLs oficiales sin inventar', () => {
    for (const item of servicesSeed) {
      expect(item.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(item.slug.length).toBeLessThanOrEqual(96);
      expect(item.description.length).toBeLessThanOrEqual(200);
      expect(item.description.trim()).not.toBe('');
      expect('officialUrl' in item).toBe(false);
      expect(categoriesSeed.some((category) => category.slug === item.categorySlug)).toBe(true);
    }
    for (const category of categoriesSeed) {
      expect(issueTypesSeed.filter((item) => item.categorySlug === category.slug).length).toBeGreaterThanOrEqual(2);
    }
    for (const slug of ['skype', 'star-plus']) {
      expect(bySlug.get(slug)?.description).toContain('descontinuado');
    }
  });
});
