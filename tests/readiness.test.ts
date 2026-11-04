import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createReadinessCheck } from '../src/lib/observability/readiness';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
describe('comprobación de disponibilidad acotada', () => {
  it('comparte una única consulta entre solicitudes concurrentes', async () => {
    let count = 0;
    let release!: () => void;
    const check = createReadinessCheck(async () => { count++; await new Promise<void>(resolve => { release = resolve; }); });
    const pending = Array.from({length:20}, () => check());
    await vi.advanceTimersByTimeAsync(0);
    expect(count).toBe(1);
    release();
    expect(await Promise.all(pending)).toEqual(Array(20).fill(true));
    expect(await check()).toBe(true);
    expect(count).toBe(1);
  });
  it('devuelve false cuando el componente falla', async () => {
    const check = createReadinessCheck(async () => { throw new Error('PRIVATE_FIXTURE'); });
    expect(await check()).toBe(false);
  });
  it('cachea cinco segundos y vuelve a comprobar para detectar recuperación', async () => {
    let count = 0;
    const check = createReadinessCheck(async () => { if (++count === 1) throw new Error('dependency unavailable'); });
    expect(await check()).toBe(false);
    await vi.advanceTimersByTimeAsync(4999);
    expect(await check()).toBe(false);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(2);
    expect(await check()).toBe(true);
    expect(count).toBe(2);
  });
  it('limita respuesta a dos segundos y no acumula consultas que sigan pendientes', async () => {
    let count = 0;
    let release!: () => void;
    const check = createReadinessCheck(async () => {
      count++;
      if (count === 1) await new Promise<void>(resolve => { release = resolve; });
    });
    const pending = check();
    await vi.advanceTimersByTimeAsync(2001);
    expect(await pending).toBe(false);
    await vi.advanceTimersByTimeAsync(5001);
    expect(await check()).toBe(false);
    expect(count).toBe(1);
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(await check()).toBe(true);
    expect(count).toBe(2);
  });
  it('no prolonga un resultado saludable si retrocede el reloj civil', async () => {
    vi.setSystemTime(new Date('2026-11-03T12:00:00Z'));
    let count = 0;
    const check = createReadinessCheck(async () => { if (++count > 1) throw new Error('dependency unavailable'); });
    expect(await check()).toBe(true);
    vi.setSystemTime(new Date('2020-01-01T00:00:00Z'));
    await vi.advanceTimersByTimeAsync(5001);
    expect(await check()).toBe(false);
  });
});
