import { describe, expect, it } from 'vitest';
import { historyLowerBound, toServiceHistory } from '../src/lib/queries/service-history-series';

describe('service detail report history', () => {
  const now = new Date('2026-11-12T20:37:00.000Z');
  const hour = 60 * 60 * 1000;
  const at = (hoursAgo: number) => new Date(Math.floor(now.getTime() / hour) * hour - hoursAgo * hour);

  it('never fabricates activity, keeps all periods zero with no data', () => {
    const result = toServiceHistory([], now);
    expect(result['24h']).toHaveLength(24);
    expect(result['7d']).toHaveLength(7);
    expect(result['30d']).toHaveLength(30);
    for (const range of Object.values(result)) expect(range.every((p) => p.reports === 0)).toBe(true);
  });
  it('counts current, past and boundary hours without duplicates between buckets', () => {
    const result = toServiceHistory([
      { hour: at(0), count: 2 }, { hour: at(23), count: 3 },
      { hour: at(24), count: 5 }, { hour: at(7 * 24 - 1), count: 7 },
      { hour: at(7 * 24), count: 11 }, { hour: at(30 * 24 - 1), count: 13 },
      { hour: at(30 * 24), count: 101 }, { hour: at(-1), count: 40 },
      { hour: 'invalid', count: 9 }, { hour: at(0), count: -4 },
    ], now);
    const total = (points: { reports: number }[]) => points.reduce((sum, p) => sum + p.reports, 0);
    expect(total(result['24h'])).toBe(5);
    expect(total(result['7d'])).toBe(17);
    expect(total(result['30d'])).toBe(41);
    expect(result['24h'].at(-1)?.reports).toBe(2);
    expect(result['24h'][0].reports).toBe(3);
  });
  it('uses precisely 30*24 hourly buckets and no future data', () => {
    expect(historyLowerBound(now).toISOString()).toBe(at(30 * 24 - 1).toISOString());
  });
});
