import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const nextPage = readFileSync(join(process.cwd(), 'src/app/metodologia/page.tsx'), 'utf8');
const staticGuide = readFileSync(join(process.cwd(), 'scripts/methodology-static.mjs'), 'utf8');

describe('Metodología PulsoVE: evidencia, límites y coherencia', () => {
  it('explica exactamente siete funciones de la ficha sin copiar la marca ajena', () => {
    const list = nextPage.split('const FEATURES = [')[1]?.split('] as const;')[0] ?? '';
    expect((list.match(/^    title: '/gm) ?? []).length).toBe(7);
    for (const label of ['Estado del servicio', 'Información del proveedor', 'Botón de reporte', 'Histórico de reportes', 'Problemas más reportados', 'Actividad por región', 'Comentarios de la comunidad']) {
      expect(nextPage).toContain(label);
    }
    expect(nextPage).not.toContain('Downdetector');
    expect(nextPage).toContain('No se publican coordenadas personales');
  });

  it('distingue parámetros de detección de promesas sobre la actualización automática', () => {
    for (const text of ['90 días', '15 min', 'dos reportantes distintos', 'dos ventanas consecutivas', 'no garantiza ejecución automática']) {
      expect(nextPage.toLowerCase()).toContain(text.toLowerCase());
    }
    expect(staticGuide).toContain('no envía ni almacena reportes');
    expect(staticGuide).toContain('no cuenta con datos de fallas en vivo');
    expect(staticGuide).toContain('La versión pública de GitHub Pages');
  });
});
