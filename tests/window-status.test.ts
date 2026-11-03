import { describe, expect, it } from 'vitest';
import { statusFromWindow } from '../src/lib/engine/window-status';

const now = new Date('2026-11-03T12:30:00Z');
describe('presentación de estado sin incidente abierto', () => {
  it('no presenta como normal una ventana sin reportes', () => {
    expect(statusFromWindow({ confidence: 0, totalReports: 0, windowEnd: new Date('2026-11-03T12:15:00Z') }, now)).toBe('insufficient_data');
  });
  it('no presenta como normal una ventana de días anteriores', () => {
    expect(statusFromWindow({ confidence: 0, totalReports: 10, windowEnd: new Date('2026-10-27T12:15:00Z') }, now)).toBe('insufficient_data');
  });
  it('no utiliza ventanas futuras o incompletas', () => {
    expect(statusFromWindow({ confidence: 0, totalReports: 10, windowEnd: new Date('2026-11-03T12:45:00Z') }, now)).toBe('insufficient_data');
  });
  it('conserva las bandas si hay evidencia reciente', () => {
    expect(statusFromWindow({ confidence: 55, totalReports: 10, windowEnd: new Date('2026-11-03T12:15:00Z') }, now)).toBe('possible_outage');
  });
  it('no interpreta una confianza cero como disponibilidad confirmada', () => {
    expect(statusFromWindow({ confidence: 0, totalReports: 10, windowEnd: new Date('2026-11-03T12:15:00Z') }, now)).toBe('insufficient_data');
  });
});
