import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

describe('renderizado: páginas con datos en vivo', () => {
  it('toda página que consulta la base exporta dynamic = "force-dynamic"', () => {
    // Sin esto, una página que no lee params ni searchParams (p. ej. la portada)
    // se prerenderiza en `next build` y muestra para siempre las cifras del build.
    const appDir = join(process.cwd(), 'src', 'app');
    const pages = (readdirSync(appDir, { recursive: true }) as string[])
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => /(^|\/)page\.tsx$/.test(f));
    const live = pages.filter((f) => /from '@\/lib\/(queries|db)\//.test(readFileSync(join(appDir, f), 'utf8')));
    expect(live.length).toBeGreaterThan(0);
    const missing = live.filter(
      (f) => !/export const dynamic = 'force-dynamic'/.test(readFileSync(join(appDir, f), 'utf8')),
    );
    expect(missing).toEqual([]);
  });
});
