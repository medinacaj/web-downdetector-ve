import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const { assertNoPrivateCanaries } = createRequire(import.meta.url)('../scripts/smoke-client-secrets.cjs');

describe('detector de marcadores privados del build de navegador', () => {
  it('rechaza un valor privado literal sin incluirlo en el error', () => {
    const value = 'server-only-fixture';
    let error: Error | undefined;
    try { assertNoPrivateCanaries(Buffer.from(`const leaked = "${value}"`), [{ name: 'JWT_SECRET', value }]); }
    catch (caught) { error = caught as Error; }
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain('JWT_SECRET');
    expect(error?.message).not.toContain(value);
  });
  it.each([
    ['PRIVATE_CANARY_+/=', 'PRIVATE_CANARY_%2B%2F%3D'],
    ['PRIVATE_CANARY_"', 'PRIVATE_CANARY_\\"'],
    ['server-only-fixture', 'c2VydmVyLW9ubHktZml4dHVyZQ=='],
  ])('detecta la representación codificada de %s', (value, encoded) => {
    expect(() => assertNoPrivateCanaries(encoded, [{ name: 'PRIVATE_CONFIG', value }])).toThrow('PRIVATE_CONFIG');
  });
  it('admite una site key pública y texto sin marcadores privados', () => {
    expect(() => assertNoPrivateCanaries('PUBLIC_SITE_KEY_FOR_FIXTURE', [
      { name: 'JWT_SECRET', value: 'server-only-fixture' },
    ])).not.toThrow();
  });
  it('rechaza una configuración vacía que produciría una aprobación engañosa', () => {
    expect(() => assertNoPrivateCanaries('anything', [])).toThrow();
    expect(() => assertNoPrivateCanaries('anything', [{ name: 'JWT_SECRET', value: '' }])).toThrow();
  });
});
