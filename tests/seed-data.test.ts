import { describe, it, expect } from 'vitest';
import { categoriesSeed } from '../src/lib/db/seed-data/categories';
import { statesSeed } from '../src/lib/db/seed-data/states';
import { issueTypesSeed } from '../src/lib/db/seed-data/issue-types';
import { servicesSeed } from '../src/lib/db/seed-data/services';

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) dupes.add(v);
    seen.add(v);
  }
  return [...dupes];
}

/** Para detectar nombres "iguales" aunque difieran en mayúsculas o tildes. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

const SLUG_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe('seed-data: integridad estructural', () => {
  it('categorías: slugs únicos', () => {
    expect(findDuplicates(categoriesSeed.map((c) => c.slug))).toEqual([]);
  });

  it('estados: exactamente 24 (23 estados + Distrito Capital)', () => {
    expect(statesSeed.length).toBe(24);
  });

  it('estados: códigos ISO 3166-2:VE únicos y con prefijo VE-', () => {
    const codes = statesSeed.map((s) => s.code);
    expect(findDuplicates(codes)).toEqual([]);
    for (const code of codes) {
      expect(code).toMatch(/^VE-[A-Z]$/);
    }
  });

  it('estados: sin dos estados en la misma celda de cuadrícula', () => {
    const cells = statesSeed.map((s) => `${s.gridRow}:${s.gridCol}`);
    expect(findDuplicates(cells)).toEqual([]);
  });

  it('tipos de problema: slugs únicos', () => {
    expect(findDuplicates(issueTypesSeed.map((it) => it.slug))).toEqual([]);
  });

  it('tipos de problema: categorySlug (cuando no es null) referencia una categoría real', () => {
    const validSlugs = new Set(categoriesSeed.map((c) => c.slug));
    for (const it of issueTypesSeed) {
      if (it.categorySlug !== null) {
        expect(validSlugs.has(it.categorySlug)).toBe(true);
      }
    }
  });

  it('servicios: slugs únicos', () => {
    expect(findDuplicates(servicesSeed.map((s) => s.slug))).toEqual([]);
  });

  it('servicios: los 16 de la sección 4.2 + Cashea (añadido después) siguen presentes', () => {
    // Subconjunto, no igualdad: el catálogo crece (ver docs/CATALOGO-SERVICIOS.md)
    // pero estos 17 no pueden desaparecer sin una decisión explícita.
    const original = [
      'cantv', 'digitel', 'movistar', 'movilnet', 'inter', 'netuno', 'fibex',
      'vnet', 'thundernet', 'banco-de-venezuela', 'banesco', 'mercantil', 'cashea',
      'sistema-patria', 'corpoelec', 'whatsapp', 'instagram',
    ];
    const actual = new Set<string>(servicesSeed.map((s) => s.slug));
    for (const slug of original) {
      expect(actual.has(slug), `falta el servicio original "${slug}"`).toBe(true);
    }
  });

  it('servicios: categorySlug referencia una categoría real', () => {
    const validSlugs = new Set(categoriesSeed.map((c) => c.slug));
    for (const s of servicesSeed) {
      expect(validSlugs.has(s.categorySlug)).toBe(true);
    }
  });
});

describe('seed-data: calidad del catálogo', () => {
  it('slugs con formato de URL válido y dentro del límite de la columna', () => {
    // Límites de varchar en schema.ts: categories 64, issue_types 64, services 96.
    for (const c of categoriesSeed) {
      expect(c.slug, `categoría ${c.slug}`).toMatch(SLUG_FORMAT);
      expect(c.slug.length).toBeLessThanOrEqual(64);
      expect(c.icon.length, `ícono de ${c.slug}`).toBeLessThanOrEqual(32);
    }
    for (const it of issueTypesSeed) {
      expect(it.slug, `tipo ${it.slug}`).toMatch(SLUG_FORMAT);
      expect(it.slug.length).toBeLessThanOrEqual(64);
    }
    for (const s of servicesSeed) {
      expect(s.slug, `servicio ${s.slug}`).toMatch(SLUG_FORMAT);
      expect(s.slug.length).toBeLessThanOrEqual(96);
    }
  });

  it('categorías: nombres únicos y orden 1..N sin huecos ni repetidos', () => {
    expect(findDuplicates(categoriesSeed.map((c) => normalizeName(c.name)))).toEqual([]);
    const orders = categoriesSeed.map((c) => c.sortOrder).sort((a, b) => a - b);
    expect(orders).toEqual(categoriesSeed.map((_, i) => i + 1));
  });

  it('servicios: nombres únicos (sin distinguir mayúsculas ni tildes)', () => {
    expect(findDuplicates(servicesSeed.map((s) => normalizeName(s.name)))).toEqual([]);
  });

  it('servicios: todos tienen descripción breve, sin enlaces', () => {
    for (const s of servicesSeed) {
      expect(s.description.trim().length, `descripción de ${s.slug}`).toBeGreaterThan(0);
      expect(s.description.length, `descripción de ${s.slug}`).toBeLessThanOrEqual(200);
      expect(s.description, `descripción de ${s.slug}`).not.toMatch(/https?:|www\./i);
    }
  });

  it('servicios: ninguno trae official_url (no se inventan URLs oficiales)', () => {
    for (const s of servicesSeed) {
      expect('officialUrl' in s, `el servicio ${s.slug} no debe fijar officialUrl`).toBe(false);
    }
  });

  it('cada categoría tiene al menos un servicio', () => {
    for (const c of categoriesSeed) {
      const n = servicesSeed.filter((s) => s.categorySlug === c.slug).length;
      expect(n, `categoría ${c.slug}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('cada categoría tiene al menos dos tipos de problema propios (además de "Otro")', () => {
    // Si no, el formulario de reporte de sus servicios solo ofrecería "Otro".
    for (const c of categoriesSeed) {
      const n = issueTypesSeed.filter((it) => it.categorySlug === c.slug).length;
      expect(n, `categoría ${c.slug}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('existe el tipo transversal "otro" (sin categoría)', () => {
    const otro = issueTypesSeed.find((it) => it.slug === 'otro');
    expect(otro).toBeDefined();
    expect(otro?.categorySlug).toBeNull();
  });
});
