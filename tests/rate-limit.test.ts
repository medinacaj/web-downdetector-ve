import { describe, it, expect, beforeEach } from 'vitest';
import { _resetMemoryRateLimits, checkRateLimit, peekRateLimit, resetRateLimit } from '../src/lib/security/rate-limit';

describe('rate limit: consultar sin consumir (acceso al panel)', () => {
  beforeEach(() => _resetMemoryRateLimits());

  it('peek no gasta intentos y bloquea solo cuando se agotaron', async () => {
    for (let i = 0; i < 10; i++) expect(await peekRateLimit('k', 3)).toBe(false);
    await checkRateLimit('k', 3, 60);
    await checkRateLimit('k', 3, 60);
    expect(await peekRateLimit('k', 3)).toBe(false);
    await checkRateLimit('k', 3, 60);
    expect(await peekRateLimit('k', 3)).toBe(true);
  });

  it('reset vuelve a dejar el contador a cero', async () => {
    for (let i = 0; i < 3; i++) await checkRateLimit('k', 3, 60);
    expect(await peekRateLimit('k', 3)).toBe(true);
    await resetRateLimit('k');
    expect(await peekRateLimit('k', 3)).toBe(false);
  });
});
