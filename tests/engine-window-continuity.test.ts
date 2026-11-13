import { describe, expect, it } from 'vitest';
import { consecutiveConfidenceWindows } from '../src/lib/engine/incident-lifecycle';

const now = new Date('2026-11-13T18:45:00.000Z');
const window = (minutesAgo: number, confidence: number) => ({
  windowStart: new Date(now.getTime() - minutesAgo * 60_000),
  confidence,
});
const elevated = (value: number) => value >= 55;
const low = (value: number) => value < 40;

describe('incident lifecycle: actual time-window continuity', () => {
  it('accepts two adjacent high-confidence windows of 15 minutes', () => {
    expect(consecutiveConfidenceWindows([window(0, 80), window(15, 70)], now, 15, 2, elevated)).toBe(true);
  });

  it('rejects a gap in the scheduler even with two elevated windows', () => {
    expect(consecutiveConfidenceWindows([window(0, 90), window(30, 90)], now, 15, 2, elevated)).toBe(false);
  });

  it('never reads a future window as prior evidence', () => {
    expect(consecutiveConfidenceWindows([window(-15, 90), window(0, 90)], now, 15, 2, elevated)).toBe(false);
  });

  it('does not close an incident from two nonadjacent recovery windows', () => {
    expect(consecutiveConfidenceWindows([window(0, 10), window(30, 5)], now, 15, 2, low)).toBe(false);
    expect(consecutiveConfidenceWindows([window(0, 10), window(15, 5)], now, 15, 2, low)).toBe(true);
  });

  it('rejects insufficient, invalid and nonchronological evidence', () => {
    expect(consecutiveConfidenceWindows([window(0, 90)], now, 15, 2, elevated)).toBe(false);
    expect(consecutiveConfidenceWindows([window(0, 90), window(15, 90)], now, 0, 2, elevated)).toBe(false);
    expect(consecutiveConfidenceWindows([window(0, 90), window(15, Number.NaN)], now, 15, 2, elevated)).toBe(false);
    expect(consecutiveConfidenceWindows([window(15, 90), window(0, 90)], now, 15, 2, elevated)).toBe(false);
  });

  it('works at configurable 5 and 30 minute intervals', () => {
    expect(consecutiveConfidenceWindows([window(0, 90), window(5, 80), window(10, 70)], now, 5, 3, elevated)).toBe(true);
    expect(consecutiveConfidenceWindows([window(0, 90), window(30, 80)], now, 30, 2, elevated)).toBe(true);
  });
});
