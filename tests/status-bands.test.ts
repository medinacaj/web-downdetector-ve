import { describe, it, expect } from 'vitest';
import { scoreToStatus } from '../src/lib/engine/status-bands';

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
