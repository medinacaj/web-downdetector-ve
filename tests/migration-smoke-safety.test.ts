import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const loadCJS = createRequire(import.meta.url);
const { validateSourceURL, cleanupResources } = loadCJS('../scripts/smoke-migrations.cjs');

describe('seguridad del ensayo de migraciones', () => {
  it.each([
    'postgresql://fake:fake@127.0.0.1/source_test?database=production',
    'postgresql://fake:fake@127.0.0.1/source_test#fragment',
    'postgresql://fake:fake@example.test/source_test',
    'postgresql://fake:fake@127.0.0.1/production',
  ])('rechaza selectores inseguros antes de conectar: %s', url => {
    expect(() => validateSourceURL(url)).toThrow();
  });
  it('admite solo una URL local de pruebas sin selectores adicionales', () => {
    expect(validateSourceURL('postgresql://fake:fake@127.0.0.1/source_test').pathname).toBe('/source_test');
  });
  it('intenta limpiar todos los recursos aunque el primero falle', async () => {
    const attempts: number[] = [];
    const errors = await cleanupResources([
      async () => { attempts.push(1); throw new Error('drop falló'); },
      async () => { attempts.push(2); },
      async () => { attempts.push(3); },
    ]);
    expect(attempts).toEqual([1,2,3]);
    expect(errors).toHaveLength(1);
  });
});
