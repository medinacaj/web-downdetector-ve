import { describe, it, expect } from 'vitest';
import { suggestStateCode } from '../src/lib/geo';
import { statesSeed } from '../src/lib/db/seed-data/states';

const VALID = new Set(statesSeed.map((s) => s.code));
const h = (o: Record<string, string>) => new Headers(o);

describe('geo: estado sugerido por cabeceras del hosting', () => {
  it('Vercel y Cloudflare, con o sin prefijo VE-', () => {
    expect(suggestStateCode(h({ 'x-vercel-ip-country': 'VE', 'x-vercel-ip-country-region': 'A' }), VALID)).toBe('VE-A');
    expect(suggestStateCode(h({ 'cf-ipcountry': 've', 'cf-region-code': 'VE-M' }), VALID)).toBe('VE-M');
  });

  it('sin cabeceras, otro país o región desconocida → sin sugerencia', () => {
    expect(suggestStateCode(h({}), VALID)).toBeNull();
    expect(suggestStateCode(h({ 'x-vercel-ip-country': 'CO', 'x-vercel-ip-country-region': 'A' }), VALID)).toBeNull();
    expect(suggestStateCode(h({ 'cf-ipcountry': 'VE', 'cf-region-code': 'Q' }), VALID)).toBeNull(); // no es un estado sembrado
    expect(suggestStateCode(h({ 'cf-ipcountry': 'VE', 'cf-region-code': 'DC' }), VALID)).toBeNull(); // formato inválido
    expect(suggestStateCode(h({ 'cf-ipcountry': 'VE' }), VALID)).toBeNull();
  });
});
