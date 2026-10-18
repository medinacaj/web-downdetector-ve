import { describe, it, expect } from 'vitest';
import { mapBin, mapLegend, stateAbbreviation } from '../src/lib/map-scale';
import { statesSeed } from '../src/lib/db/seed-data/states';

describe('mapa: escala del cartograma', () => {
  it('0 reportes es su propia clase, nunca la más clara de las que tienen reportes', () => {
    expect(mapBin(0, 10)).toBe(0);
    expect(mapBin(0, 0)).toBe(0);
    expect(mapBin(1, 100)).toBe(1);
  });

  it('el máximo cae siempre en la clase más alta y la clase crece con el conteo', () => {
    for (const max of [1, 2, 3, 7, 10, 250]) {
      expect(mapBin(max, max), `max ${max}`).toBe(4);
      let prev = 0;
      for (let c = 1; c <= max; c++) {
        const b = mapBin(c, max);
        expect(b).toBeGreaterThanOrEqual(prev);
        prev = b;
      }
    }
  });

  it('la leyenda cubre 1..max sin huecos ni solapes y concuerda con mapBin', () => {
    for (const max of [1, 2, 3, 5, 10, 99]) {
      const legend = mapLegend(max);
      expect(legend[0].from, `max ${max}`).toBe(1);
      expect(legend[legend.length - 1].to).toBe(max);
      for (let i = 1; i < legend.length; i++) expect(legend[i].from).toBe(legend[i - 1].to + 1);
      for (const e of legend) {
        for (let c = e.from; c <= e.to; c++) expect(mapBin(c, max), `max ${max}, ${c}`).toBe(e.bin);
      }
    }
    expect(mapLegend(0)).toEqual([]);
  });
});

describe('mapa: abreviaturas de estado', () => {
  it('son únicas entre los 24 estados y cortas', () => {
    const abbr = statesSeed.map((s) => stateAbbreviation(s.name));
    expect(new Set(abbr).size).toBe(statesSeed.length);
    for (const a of abbr) expect(a).toMatch(/^[A-Z]{2,3}$/);
    expect(stateAbbreviation('Distrito Capital')).toBe('DC');
    expect(stateAbbreviation('Táchira')).toBe('TAC');
  });
});

describe('mapa: cuadrícula del cartograma', () => {
  it('ningún par de estados comparte celda', () => {
    const cells = statesSeed.map((s) => `${s.gridRow},${s.gridCol}`);
    expect(new Set(cells).size).toBe(statesSeed.length);
  });
});
