import { describe, it, expect } from 'vitest';
import { scoreToStatus, windowStatus } from '../src/lib/engine/status-bands';

describe('scoreToStatus (brief, sección 9.6)', () => {
  it.each([
    [0, 'normal'],
    [24, 'normal'],
    [25, 'slightly_elevated'],
    [39, 'slightly_elevated'],
    [40, 'reports_elevated'],
    [54, 'reports_elevated'],
    [55, 'possible_outage'],
    [69, 'possible_outage'],
    [70, 'outage_detected'],
    [84, 'outage_detected'],
    [85, 'outage_high_confidence'],
    [100, 'outage_high_confidence'],
  ])('score %i -> %s', (score, expected) => {
    expect(scoreToStatus(score)).toBe(expected);
  });

  it('valores fuera de rango se acotan a 0-100 en vez de fallar', () => {
    expect(scoreToStatus(-10)).toBe('normal');
    expect(scoreToStatus(150)).toBe('outage_high_confidence');
  });
});

describe('windowStatus: sin historia suficiente nunca es "normal"', () => {
  it('con menos de 3 ventanas en la línea base devuelve insufficient_data, sea cual sea la confianza', () => {
    for (const samples of [0, 1, 2]) {
      for (const confidence of [0, 7, 50, 99]) {
        expect(windowStatus(confidence, samples), `${samples} muestras, confianza ${confidence}`).toBe('insufficient_data');
      }
    }
  });

  it('con historia suficiente usa las bandas de siempre', () => {
    expect(windowStatus(7, 3)).toBe('normal');
    expect(windowStatus(60, 20)).toBe('possible_outage');
  });
});
