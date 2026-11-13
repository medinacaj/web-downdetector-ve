import { describe, expect, it } from 'vitest';
import { buildBaselineBuckets } from '../src/lib/engine/baseline';

describe('robust baseline: real processed samples, never missing jobs as zeros', () => {
  const when = (date: string, totalReports: number, stateId: string | null = null) => ({
    windowStart: new Date(date), totalReports, stateId,
  });

  it('uses median and MAD across matching Caracas weekday/hour windows', () => {
    const buckets = buildBaselineBuckets([
      when('2026-11-13T18:00:00Z', 2),
      when('2026-11-06T18:00:00Z', 4),
      when('2026-10-30T18:00:00Z', 6),
      when('2026-11-13T18:00:00Z', 11, 'VE-V'),
    ]);
    expect(buckets).toHaveLength(2);
    expect(buckets.find((row) => row.stateId === null)).toMatchObject({
      medianReports: 4, dispersion: 2, sampleSize: 3,
    });
    expect(buckets.find((row) => row.stateId === 'VE-V')).toMatchObject({
      medianReports: 11, dispersion: 1, sampleSize: 1,
    });
  });

  it('does not invent zero-report windows when the scheduler was offline', () => {
    const [only] = buildBaselineBuckets([when('2026-11-13T18:00:00Z', 8)]);
    expect(only).toMatchObject({ medianReports: 8, sampleSize: 1 });
  });

  it('preserves observed zero-report windows and isolates different hours', () => {
    const buckets = buildBaselineBuckets([
      when('2026-11-13T18:00:00Z', 0),
      when('2026-11-06T18:00:00Z', 2),
      when('2026-11-13T19:00:00Z', 5),
    ]);
    expect(buckets).toHaveLength(2);
    expect(buckets.map((row) => row.sampleSize).sort()).toEqual([1, 2]);
  });

  it('ignores invalid and negative counts rather than corrupting the reference', () => {
    const buckets = buildBaselineBuckets([
      when('2026-11-13T18:00:00Z', Number.NaN),
      when('2026-11-13T18:00:00Z', -5),
      when('bad date', 2),
      when('2026-11-13T18:00:00Z', 9),
    ]);
    expect(buckets).toHaveLength(1);
    expect(buckets[0]).toMatchObject({ medianReports: 9, sampleSize: 1 });
  });
});
