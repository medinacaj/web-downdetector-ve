import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const { localOrigin, selectedEngines } = createRequire(import.meta.url)('../scripts/smoke-browsers.cjs');

describe('destino y alcance explícito del ensayo de navegadores', () => {
  it('acepta solo un origen HTTP local sin credenciales ni parámetros', () => {
    expect(localOrigin('http://127.0.0.1:3010')).toBe('http://127.0.0.1:3010');
    expect(localOrigin('http://localhost:3010/')).toBe('http://localhost:3010');
  });
  it.each(['https://example.com', 'http://user:pass@localhost:3010', 'http://127.0.0.1:3010/api', 'http://127.0.0.1:3010?q=1', 'http://127.0.0.1:3010/#fragment'])('rechaza destino no aislado %s', value => {
    expect(() => localOrigin(value)).toThrow();
  });
  it('incluye por defecto los tres motores y elimina duplicados explícitos', () => {
    expect(selectedEngines()).toEqual(['chromium', 'firefox', 'webkit']);
    expect(selectedEngines('chromium,firefox,chromium')).toEqual(['chromium', 'firefox']);
  });
  it.each(['', 'safari', 'chromium,unknown'])('no permite aprobar una selección vacía o desconocida: %s', value => {
    expect(() => selectedEngines(value)).toThrow();
  });
});
