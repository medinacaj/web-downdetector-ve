import { describe, expect, it } from 'vitest';
import { HOUR_MS, pickFeaturedServices, sparklinePolyline, toHourlySeries } from '@/lib/queries/home-trends';

describe('home service activity tiles', () => {
  const now = new Date('2026-11-12T16:30:00.000Z');

  it('renders zero buckets without synthetic traffic when there are no reports', () => {
    const buckets = toHourlySeries([], now);
    expect(buckets).toHaveLength(25);
    expect(buckets.every((n) => n === 0)).toBe(true);
    expect(sparklinePolyline(buckets)).toBeNull();
  });

  it('groups reports by hour and discards buckets outside rolling 24-hour span', () => {
    const samples = [
      { hour: '2026-11-11T16:00:00.000Z', count: 2 },
      { hour: '2026-11-12T14:00:00.000Z', count: 3 },
      { hour: '2026-11-12T14:00:00.000Z', count: 2 },
      { hour: '2026-11-12T16:00:00.000Z', count: 1 },
      { hour: new Date(now.getTime() + HOUR_MS), count: 20 },
      { hour: '2026-11-11T15:00:00.000Z', count: 10 },
      { hour: 'invalid', count: 10 },
    ];
    const result = toHourlySeries(samples, now);
    expect(result[0]).toBe(2);
    expect(result[22]).toBe(5);
    expect(result[24]).toBe(1);
    expect(result.reduce((a, b) => a + b, 0)).toBe(8);
    expect(sparklinePolyline(result)).toContain(',');
  });

  it('keeps line coordinates finite for flat positive series', () => {
    const coordinates = sparklinePolyline(Array(25).fill(1));
    expect(coordinates).not.toMatch(/NaN|Infinity/);
    expect(coordinates?.split(' ')).toHaveLength(25);
  });

  it('prioritizes real activity before curated order, then falls back to Venezuelan services', () => {
    const input = [
      { slug: 'random', name: 'Random', reportsLast24h: 0 },
      { slug: 'movistar', name: 'Movistar', reportsLast24h: 0 },
      { slug: 'cantv', name: 'CANTV', reportsLast24h: 0 },
      { slug: 'digitel', name: 'Digitel', reportsLast24h: 8 },
    ];
    expect(pickFeaturedServices(input, 3).map((s) => s.slug)).toEqual(['digitel', 'cantv', 'movistar']);
    expect(pickFeaturedServices(input.map(s=>({...s,reportsLast24h:0})),2).map(s=>s.slug)).toEqual(['cantv','movistar']);
  });
});
