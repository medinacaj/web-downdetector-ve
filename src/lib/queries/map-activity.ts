/** Aggregated, non-suspicious citizen reports by Venezuelan state. No coordinates or identities. */
export type MapPeriod = '24h' | '7d' | '30d';
export interface StateActivity {
  code: string;
  name: string;
  gridRow: number;
  gridCol: number;
  last24h: number;
  last7d: number;
  last30d: number;
}
export const MAP_PERIODS: readonly { key: MapPeriod; label: string }[] = [
  { key: '24h', label: '24 horas' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
];

export function regionCount(state: StateActivity, period: MapPeriod): number {
  const count = period === '24h' ? state.last24h : period === '7d' ? state.last7d : state.last30d;
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
}

/** Relative intensity is NOT a percentage of people affected or an outage probability. */
export function regionIntensity(value: number, maximum: number): 0 | 1 | 2 | 3 | 4 {
  if (!Number.isFinite(value) || !Number.isFinite(maximum) || value <= 0 || maximum <= 0) return 0;
  const ratio = Math.min(value / maximum, 1);
  if (ratio <= 0.2) return 1;
  if (ratio <= 0.45) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}
