import { describe, it, expect } from 'vitest';
import { engineFreshness } from '../src/lib/engine/freshness';
import { ENGINE_STALE_AFTER_MINUTES } from '../src/lib/engine/parameters';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const NOW = new Date('2026-10-25T12:00:00Z');
const ago = (min: number) => new Date(NOW.getTime() - min * 60_000);

describe('motor: frescura de los datos', () => {
  it('sin ningún ciclo, "never" (no "fresh")', () => {
    expect(engineFreshness(null, NOW)).toEqual({ state: 'never', lastRunAt: null, minutesSinceRun: null });
  });

  it('un retraso normal de GitHub Actions no dispara el aviso; superar el umbral sí', () => {
    expect(engineFreshness(ago(29), NOW).state).toBe('fresh');
    expect(engineFreshness(ago(ENGINE_STALE_AFTER_MINUTES - 1), NOW).state).toBe('fresh');
    expect(engineFreshness(ago(ENGINE_STALE_AFTER_MINUTES), NOW).state).toBe('stale');
    expect(engineFreshness(ago(60 * 24 * 3), NOW)).toMatchObject({ state: 'stale', minutesSinceRun: 4320 });
  });

  it('un reloj adelantado cuenta como reciente, sin minutos negativos', () => {
    expect(engineFreshness(new Date(NOW.getTime() + 120_000), NOW)).toMatchObject({ state: 'fresh', minutesSinceRun: 0 });
  });

  it('el umbral cubre varias ventanas (no avisa por un solo ciclo perdido)', () => {
    expect(ENGINE_STALE_AFTER_MINUTES).toBeGreaterThanOrEqual(45);
  });

  it('las páginas que muestran estados o incidentes llevan el aviso', () => {
    const app = join(process.cwd(), 'src', 'app');
    for (const page of ['page.tsx', 'servicios/page.tsx', 'servicios/[slug]/page.tsx', 'categorias/[slug]/page.tsx', 'incidentes/page.tsx', 'estadisticas/page.tsx']) {
      const src = readFileSync(join(app, page), 'utf8');
      expect(src, page).toMatch(/<EngineFreshnessNotice\b/);
      expect(src, page).toMatch(/getEngineFreshness\(\)/);
    }
  });
});
