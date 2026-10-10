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

  it('servicios: los 16 de la sección 4.2 + Cashea (agregado después) están presentes', () => {
    const expected = [
      'cantv', 'digitel', 'movistar', 'movilnet', 'inter', 'netuno', 'fibex',
      'vnet', 'thundernet', 'banco-de-venezuela', 'banesco', 'mercantil', 'cashea',
      'sistema-patria', 'corpoelec', 'whatsapp', 'instagram',
    ];
    const actual = servicesSeed.map((s) => s.slug).sort();
    expect(actual).toEqual(expected.sort());
  });

  it('servicios: categorySlug referencia una categoría real', () => {
    const validSlugs = new Set(categoriesSeed.map((c) => c.slug));
    for (const s of servicesSeed) {
      expect(validSlugs.has(s.categorySlug)).toBe(true);
    }
  });
});
