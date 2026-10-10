import { describe, it, expect } from 'vitest';
import { median, medianAbsoluteDeviation, modifiedZScore } from '../src/lib/engine/robust-stats';

describe('median', () => {
  it('impar: devuelve el valor central', () => {
    expect(median([1, 5, 3])).toBe(3);
  });
  it('par: promedia los dos centrales', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it('un solo valor', () => {
    expect(median([7])).toBe(7);
  });
  it('vacío: 0, no NaN ni excepción', () => {
    expect(median([])).toBe(0);
  });
  it('no asume que el array ya viene ordenado', () => {
    expect(median([9, 1, 5, 3, 7])).toBe(5);
  });
});

describe('medianAbsoluteDeviation', () => {
  it('todos los valores iguales -> MAD 0', () => {
    expect(medianAbsoluteDeviation([4, 4, 4, 4])).toBe(0);
  });
  it('caso de referencia conocido', () => {
    // mediana de [1,2,3,4,5] = 3; desviaciones [2,1,0,1,2]; mediana = 1
    expect(medianAbsoluteDeviation([1, 2, 3, 4, 5])).toBe(1);
  });
  it('acepta un centro precalculado en vez de recalcular la mediana', () => {
    expect(medianAbsoluteDeviation([1, 2, 3, 4, 5], 3)).toBe(1);
  });
});

describe('modifiedZScore', () => {
  it('valor igual a la mediana -> z = 0', () => {
    expect(modifiedZScore(10, 10, 2)).toBe(0);
  });
  it('por encima de la mediana -> z positivo', () => {
    expect(modifiedZScore(16, 10, 2)).toBeCloseTo(0.6745 * 3, 4);
  });
  it('por debajo de la mediana -> z negativo', () => {
    expect(modifiedZScore(4, 10, 2)).toBeLessThan(0);
  });
  it('MAD=0 (historial idéntico): no explota a Infinity/NaN, usa MAD mínimo de 1', () => {
    const z = modifiedZScore(15, 10, 0);
    expect(Number.isFinite(z)).toBe(true);
    expect(z).toBeCloseTo(0.6745 * 5, 4);
  });
});
