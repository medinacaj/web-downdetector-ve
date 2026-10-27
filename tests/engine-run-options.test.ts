import { describe, expect, it } from 'vitest';
import { parseRunOptions } from '../src/lib/engine/run-options';

describe('opciones del motor', () => {
  it('procesa la última ventana completa sin incluir la ventana actual', () => {
    const result = parseRunOptions(['--completed'], new Date('2026-10-26T12:34:56Z'));
    expect(result.windowMinutes).toBe(15);
    expect(result.windowStart.toISOString()).toBe('2026-10-26T12:15:00.000Z');
  });
  it('en el límite exacto procesa la ventana anterior', () => {
    expect(parseRunOptions(['--completed'], new Date('2026-10-26T00:00:00Z')).windowStart.toISOString())
      .toBe('2026-10-25T23:45:00.000Z');
  });
  it('conserva el --at manual y respeta ventanas personalizadas', () => {
    expect(parseRunOptions(['--window=5', '--at=2026-10-26T12:34:56Z']).windowStart.toISOString())
      .toBe('2026-10-26T12:30:00.000Z');
  });
  it.each([['--window=0'], ['--window=-1'], ['--window=NaN'], ['--window=1.5'],
    ['--at=invalid'], ['--completed', '--at=2026-10-26T12:00:00Z'], ['--typo'], ['--window=15', '--window=5']])
    ('rechaza argumentos inválidos %j', (...args) => {
      expect(() => parseRunOptions(args)).toThrow();
    });
});
