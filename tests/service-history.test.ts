import { describe, expect, it } from 'vitest';
import {
  historyIndexFromLabel, historyLowerBound, incidentInBucket, toServiceHistory,
} from '../src/lib/queries/service-history-series';

describe('service chart history in real hour buckets', () => {
  const now = new Date('2026-11-12T20:37:00.000Z');
  const hour = 60 * 60 * 1000;
  const at = (hoursAgo: number) => new Date(Math.floor(now.getTime() / hour) * hour - hoursAgo * hour);

  it('never invents activity in any period', () => {
    const h = toServiceHistory([], now);
    expect(h['24h']).toHaveLength(24);
    expect(h['7d']).toHaveLength(7);
    expect(h['30d']).toHaveLength(30);
    expect(h['90d']).toHaveLength(90);
    for (const range of Object.values(h)) {
      expect(range.every((p) => p.reports === 0)).toBe(true);
      for (const point of range) {
        expect(new Date(point.startIso).getTime()).toBeLessThan(new Date(point.endIso).getTime());
      }
    }
  });

  it('counts current, past and boundary hours without duplicate buckets', () => {
    const h = toServiceHistory([
      { hour: at(0), count: 2 }, { hour: at(23), count: 3 },
      { hour: at(24), count: 5 }, { hour: at(7 * 24 - 1), count: 7 },
      { hour: at(7 * 24), count: 11 }, { hour: at(30 * 24 - 1), count: 13 },
      { hour: at(30 * 24), count: 17 }, { hour: at(90 * 24 - 1), count: 19 },
      { hour: at(90 * 24), count: 101 }, { hour: at(-1), count: 40 },
      { hour: 'invalid', count: 9 }, { hour: at(0), count: -4 },
    ], now);
    const total = (ps: { reports: number }[]) => ps.reduce((sum, p) => sum + p.reports, 0);
    expect(total(h['24h'])).toBe(5);
    expect(total(h['7d'])).toBe(17);
    expect(total(h['30d'])).toBe(41);
    expect(total(h['90d'])).toBe(77);
    expect(h['24h'].at(-1)?.reports).toBe(2);
    expect(h['24h'][0].reports).toBe(3);
    expect(h['90d'].at(-1)?.endIso).toBe(at(-1).toISOString());
  });

  it('keeps time buckets contiguous with their actual UTC start/end', () => {
    const h = toServiceHistory([], now);
    for (const points of Object.values(h)) {
      for (let index = 1; index < points.length; index++) {
        expect(points[index - 1].endIso).toBe(points[index].startIso);
      }
    }
    expect(historyLowerBound(now)).toEqual(at(90 * 24 - 1));
  });

  it('selects real absolute buckets by label even after the visible range moves', () => {
    const h = toServiceHistory([], now);
    const points = h['90d'];
    const viewportStart = 60; // Brush can render only a subset of all buckets.
    expect(historyIndexFromLabel(points, points[viewportStart].label)).toBe(viewportStart);
    expect(historyIndexFromLabel(points, points[89].label)).toBe(89);
    expect(historyIndexFromLabel(points, 'invalid-label')).toBe(-1);
    expect(historyIndexFromLabel(points, undefined)).toBe(-1);
  });

  it('assigns actual incident timestamps to precisely one interval', () => {
    const h = toServiceHistory([], now);
    const point = h['24h'][2];
    expect(incidentInBucket(point.startIso, point)).toBe(true);
    expect(incidentInBucket(point.endIso, point)).toBe(false);
    expect(incidentInBucket(new Date(Date.parse(point.endIso) - 1).toISOString(), point)).toBe(true);
    expect(incidentInBucket('not a date', point)).toBe(false);
  });
});
