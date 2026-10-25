import { describe, it, expect } from 'vitest';
import { buildHistorySeries, clipToRange, floorToWindow, niceTicks } from '../src/lib/history';

const NOW = new Date('2026-10-18T14:37:12Z');
const W = 15 * 60_000;

describe('historial: serie de 24 horas en ventanas de 15 minutos', () => {
  it('96 ventanas consecutivas que terminan en la actual, sin huecos', () => {
    const s = buildHistorySeries(NOW, new Map(), () => null);
    expect(s).toHaveLength(96);
    expect(s[s.length - 1].t).toBe(Date.parse('2026-10-18T14:30:00Z'));
    for (let i = 1; i < s.length; i++) expect(s[i].t - s[i - 1].t).toBe(W);
  });

  it('las ventanas sin reportes valen 0 y se respetan los conteos y la mediana habitual', () => {
    const t = Date.parse('2026-10-18T14:00:00Z');
    const s = buildHistorySeries(NOW, new Map([[t, 7]]), (d) => (d.getTime() === t ? 2 : null));
    const p = s.find((x) => x.t === t)!;
    expect(p).toEqual({ t, reports: 7, expected: 2 });
    expect(s.filter((x) => x.reports > 0)).toHaveLength(1);
    expect(s.filter((x) => x.expected !== null)).toHaveLength(1);
  });

  it('floorToWindow alinea a múltiplos de 15 minutos', () => {
    expect(floorToWindow(NOW).toISOString()).toBe('2026-10-18T14:30:00.000Z');
  });
});

describe('historial: incidentes recortados al rango', () => {
  const start = Date.parse('2026-10-18T00:00:00Z');
  const end = Date.parse('2026-10-18T12:00:00Z');
  it('recorta, deja abiertos hasta el final y descarta los que no se solapan', () => {
    expect(clipToRange(new Date('2026-10-17T22:00:00Z'), new Date('2026-10-18T01:00:00Z'), start, end)).toEqual({
      from: start,
      to: Date.parse('2026-10-18T01:00:00Z'),
    });
    expect(clipToRange(new Date('2026-10-18T10:00:00Z'), null, start, end)).toEqual({
      from: Date.parse('2026-10-18T10:00:00Z'),
      to: end,
    });
    expect(clipToRange(new Date('2026-10-16T00:00:00Z'), new Date('2026-10-17T00:00:00Z'), start, end)).toBeNull();
  });
});

describe('historial: marcas del eje Y', () => {
  it('son enteras, redondas (1, 2 o 5 × 10^k), empiezan en 0 y cubren el máximo', () => {
    expect(niceTicks(28)).toEqual([0, 10, 20, 30]);
    expect(niceTicks(3)).toEqual([0, 1, 2, 3]);
    expect(niceTicks(1)).toEqual([0, 1]);
    expect(niceTicks(0)).toEqual([0, 1]);
    for (const max of [1, 2, 7, 13, 28, 99, 140, 1234]) {
      const t = niceTicks(max);
      expect(t[0]).toBe(0);
      expect(t[t.length - 1]).toBeGreaterThanOrEqual(max);
      const step = t[1] - t[0];
      expect(Number.isInteger(step)).toBe(true);
      expect(String(step)).toMatch(/^[125]0*$/);
    }
  });
});
