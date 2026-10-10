import { describe, it, expect } from 'vitest';
import { combineWeightedSignals, reliabilityFactor } from '../src/lib/engine/anomaly';

describe('combineWeightedSignals', () => {
  it('con todas las señales disponibles, aplica los pesos tal cual (sección 9.4)', () => {
    // 40% en 100 + 60% en 0 = 40
    const result = combineWeightedSignals([
      { weight: 0.4, score: 100 },
      { weight: 0.6, score: 0 },
    ]);
    expect(result).toBeCloseTo(40, 4);
  });

  it('señal sin datos (null) se excluye y renormaliza el resto, no cuenta como 0', () => {
    // deviation 40%@100 + unique 20%@100, technical 10%@null (sin datos)
    // esperado: (0.4*100 + 0.2*100) / (0.4+0.2) = 100, NO (0.4*100+0.2*100+0.1*0)/1=60
    const result = combineWeightedSignals([
      { weight: 0.4, score: 100 },
      { weight: 0.2, score: 100 },
      { weight: 0.1, score: null },
    ]);
    expect(result).toBeCloseTo(100, 4);
  });

  it('todas las señales sin datos -> 0 (nunca división por cero)', () => {
    expect(combineWeightedSignals([{ weight: 0.4, score: null }])).toBe(0);
  });

  it('nunca devuelve fuera de 0-100 aunque los scores de entrada se salgan de rango', () => {
    expect(combineWeightedSignals([{ weight: 1, score: 150 }])).toBe(100);
    expect(combineWeightedSignals([{ weight: 1, score: -50 }])).toBe(0);
  });
});

describe('reliabilityFactor (confianza según tamaño de muestra de la línea base)', () => {
  it('muestra muy chica (sistema nuevo) -> confiabilidad baja', () => {
    expect(reliabilityFactor(0)).toBe(0.25);
    expect(reliabilityFactor(2)).toBe(0.25);
  });
  it('muestra moderada -> confiabilidad media', () => {
    expect(reliabilityFactor(5)).toBe(0.55);
  });
  it('muestra buena -> confiabilidad alta pero no total', () => {
    expect(reliabilityFactor(10)).toBe(0.8);
  });
  it('muestra amplia (>=15 ventanas históricas) -> confiabilidad plena', () => {
    expect(reliabilityFactor(20)).toBe(1.0);
  });
  it('nunca excede 1.0 ni baja de 0', () => {
    expect(reliabilityFactor(1000)).toBeLessThanOrEqual(1.0);
    expect(reliabilityFactor(0)).toBeGreaterThanOrEqual(0);
  });
});
