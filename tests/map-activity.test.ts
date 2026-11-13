import { describe, expect, it } from 'vitest';
import { MAP_PERIODS, regionCount, regionIntensity, type StateActivity } from '../src/lib/queries/map-activity';

const region: StateActivity = {
  code: 'VE-V', name: 'Zulia', gridRow: 1, gridCol: 0,
  last24h: 4, last7d: 22, last30d: 72,
};
describe('regional activity: truthful and private presentation', () => {
  it('only provides the three documented report windows', () => {
    expect(MAP_PERIODS.map((item) => item.key)).toEqual(['24h', '7d', '30d']);
    expect(regionCount(region, '24h')).toBe(4);
    expect(regionCount(region, '7d')).toBe(22);
    expect(regionCount(region, '30d')).toBe(72);
  });
  it('does not fabricate negative or unavailable report counts', () => {
    expect(regionCount({ ...region, last24h: -99 }, '24h')).toBe(0);
    expect(regionCount({ ...region, last7d: Number.NaN }, '7d')).toBe(0);
  });
  it('assigns zero intensity to no data, not an outage signal', () => {
    expect(regionIntensity(0, 0)).toBe(0);
    expect(regionIntensity(0, 4)).toBe(0);
    expect(regionIntensity(Number.NaN, 4)).toBe(0);
    expect(regionIntensity(1, 10)).toBe(1);
    expect(regionIntensity(3, 10)).toBe(2);
    expect(regionIntensity(6, 10)).toBe(3);
    expect(regionIntensity(10, 10)).toBe(4);
  });
});
