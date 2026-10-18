import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTE } from '../src/lib/nav';

const SRC = join(process.cwd(), 'src');

function pageFileFor(href: string): string {
  return join(SRC, 'app', href === '/' ? '' : href, 'page.tsx');
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const routes = Object.entries(ROUTE);

describe('nav: registro de rutas', () => {
  it('cada href es una ruta absoluta, sin barra final (salvo la raíz) y sin repetirse', () => {
    const hrefs = routes.map(([, r]) => r.href);
    for (const href of hrefs) {
      expect(href, href).toMatch(/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/);
    }
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('available coincide con la existencia real de la página (src/app/<ruta>/page.tsx)', () => {
    // Si falla: o falta crear la página, o falta activarla en src/lib/nav.ts.
    for (const [key, route] of routes) {
      expect(existsSync(pageFileFor(route.href)), `ROUTE.${key} (${route.href})`).toBe(route.available);
    }
  });

  it('ningún archivo de src enlaza a mano a una página que aún no está disponible', () => {
    const pending = routes.filter(([, r]) => !r.available).map(([, r]) => r.href);
    // Hoy todas las rutas del registro existen (pending vacío): la prueba queda como guarda
    // para la próxima página que se registre con `available: false`.

    const files = (readdirSync(SRC, { recursive: true }) as string[])
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => f.replace(/\\/g, '/') !== 'lib/nav.ts');

    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(join(SRC, file), 'utf8');
      for (const href of pending) {
        // La ruta escrita tal cual como literal de texto: '/mapa', "/mapa" o `/mapa`.
        const literal = new RegExp(`(["'\`])${escapeRegExp(href)}\\1`);
        if (literal.test(text)) offenders.push(`${file} → ${href}`);
      }
    }
    expect(offenders, 'usa ROUTE + isRouteAvailable (src/lib/nav.ts) en vez de la ruta escrita a mano').toEqual([]);
  });
});
