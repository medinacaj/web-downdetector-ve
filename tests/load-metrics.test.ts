import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const loadCJS = createRequire(import.meta.url);
const { percentile, validBody } = loadCJS('../scripts/load-test.cjs');

describe('integridad de métricas del ensayo de carga', () => {
  it('calcula percentiles de observaciones, sin inventar muestras vacías', () => {
    expect(percentile([], 99)).toBeNull();
    expect(percentile([100, 1, 4, 3, 2], 50)).toBe(3);
    expect(percentile([100, 1, 4, 3, 2], 95)).toBe(100);
  });
  it('no confunde una respuesta de error o JSON incorrecto con éxito', () => {
    expect(validBody('/', 500, '<html>PulsoVE</html>')).toBe(false);
    expect(validBody('/api/services?q=movistar', 200, 'not JSON')).toBe(false);
    expect(validBody('/api/reports', 201, '{"data":{}}')).toBe(false);
  });
  it('exige el contrato esperado de la respuesta de creación', () => {
    expect(validBody('/api/reports', 201, '{"data":{"id":"fixture-id"}}')).toBe(true);
    expect(validBody('/api/reports', 429, '{"error":{"code":"rate_limited"}}')).toBe(false);
  });
});
