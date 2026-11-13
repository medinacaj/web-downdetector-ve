import { describe, expect, it } from 'vitest';
import { HOUR_MS, pickFeaturedServices, reportSurgeScore, sparklinePolyline, toHourlySeries } from '@/lib/queries/home-trends';

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

  it('requires a meaningful burst of distinct reports before promoting a service', () => {
    expect(reportSurgeScore({ recent30m: 1, previous2h: 0, uniqueReporters30m: 1 })).toBe(0);
    expect(reportSurgeScore({ recent30m: 9, previous2h: 1, uniqueReporters30m: 1 })).toBe(0);
    expect(reportSurgeScore({ recent30m: 9, previous2h: 1, uniqueReporters30m: 2 })).toBe(0);
    expect(reportSurgeScore({ recent30m: 9, previous2h: 1, uniqueReporters30m: 3 })).toBeGreaterThan(0);
    expect(reportSurgeScore({ recent30m: 12, previous2h: 44, uniqueReporters30m: 12 })).toBe(0);
    expect(reportSurgeScore({ recent30m: 12, previous2h: 10, uniqueReporters30m: 10 })).toBeGreaterThan(0);
    expect(reportSurgeScore({ recent30m: Number.NaN, previous2h: 0, uniqueReporters30m: 10 })).toBe(0);
  });

  it('brings a sudden surge ahead of a high-traffic service with a steady baseline', () => {
    const input = [
      { slug: 'large', name: 'Servicio grande', reportsLast24h: 500, surgeScore: 0 },
      { slug: 'sudden', name: 'Servicio reciente', reportsLast24h: 12, surgeScore: 5 },
      { slug: 'other', name: 'Otro', reportsLast24h: 20, surgeScore: 0 },
    ];
    expect(pickFeaturedServices(input).map(({ slug }) => slug))
      .toEqual(['sudden', 'large', 'other']);
    // Once the recent burst ends, the service returns to normal volume order.
    expect(pickFeaturedServices(input.map((service) => ({ ...service, surgeScore: 0 })))
      .map(({ slug }) => slug)).toEqual(['large', 'other', 'sudden']);
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
