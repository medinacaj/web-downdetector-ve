import { describe, expect, it } from 'vitest';
import { withHistoricalReference } from '../src/lib/queries/historical-reference';
import { getCaracasWeekdayHour } from '../src/lib/engine/time-bucket';
import { toServiceHistory } from '../src/lib/queries/service-history-series';

const now = new Date('2026-11-13T20:37:00.000Z');
const blank = () => toServiceHistory([], now);

describe('chart historical reference requires sampled engine history', () => {
  it('does not invent baselines without complete or adequate samples', () => {
    const history = blank();
    const actual = withHistoricalReference(history, [], 15);
    expect(actual['24h'].every((p) => p.typicalReports === null)).toBe(true);
    expect(actual['7d'].every((p) => p.typicalReports === null)).toBe(true);
    expect(actual['30d'].every((p) => p.typicalReports === null)).toBe(true);
    expect(actual['90d'].every((p) => p.typicalReports === null)).toBe(true);
  });

  it('estimates hourly report reference only from enough samples', () => {
    const history = blank();
    const target = history['24h'].at(-1)!;
    const { weekday, hour } = getCaracasWeekdayHour(new Date(target.startIso));
    const withEnough = withHistoricalReference(history, [
      { weekday, hour, medianReports: 2, sampleSize: 4 },
    ], 15);
    expect(withEnough['24h'].at(-1)?.typicalReports).toBe(8);
    expect(withEnough['24h'].slice(0, -1).every((p) => p.typicalReports === null)).toBe(true);
    const tooFew = withHistoricalReference(history, [
      { weekday, hour, medianReports: 2, sampleSize: 2 },
    ], 15);
    expect(tooFew['24h'].at(-1)?.typicalReports).toBeNull();
  });

  it('never assumes a missing hour was zero in daily buckets', () => {
    const history = blank();
    const target = history['7d'].at(-1)!;
    const { weekday, hour } = getCaracasWeekdayHour(new Date(target.startIso));
    const result = withHistoricalReference(history, [{ weekday, hour, medianReports: 2, sampleSize: 5 }], 15);
    expect(result['7d'].at(-1)?.typicalReports).toBeNull();
  });

  it('rejects invalid window widths rather than projecting a false reference', () => {
    const input = blank();
    expect(withHistoricalReference(input, [], 0)).toBe(input);
    expect(withHistoricalReference(input, [], 7)).toBe(input);
    expect(withHistoricalReference(input, [], Number.NaN)).toBe(input);
  });

  it('rejects negative medians and invalid sample hours', () => {
    const history = blank();
    const target = history['24h'].at(-1)!;
    const { weekday, hour } = getCaracasWeekdayHour(new Date(target.startIso));
    const result = withHistoricalReference(history, [
      { weekday, hour, medianReports: -2, sampleSize: 9 },
      { weekday: 7, hour, medianReports: 9, sampleSize: 9 },
    ], 15);
    expect(result['24h'].at(-1)?.typicalReports).toBeNull();
  });
});
