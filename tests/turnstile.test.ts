import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyTurnstile } from '../src/lib/security/turnstile';

beforeEach(() => {
  vi.stubEnv('ENABLE_TURNSTILE', 'true');
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret-not-a-real-key');
  vi.stubEnv('SITE_URL', 'https://beta.example.test');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function cloudflare(data: unknown, status = 200) {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const body = new URLSearchParams(String(init.body));
    expect(body.get('secret')).toBe('test-secret-not-a-real-key');
    expect(body.get('response')).toBe('a-token');
    expect(body.has('remoteip')).toBe(false);
    expect(init.signal).toBeInstanceOf(AbortSignal);
    return Response.json(data, { status });
  });
}

describe('verificación Turnstile', () => {
  it('permite desarrollo deshabilitado sin contactar al proveedor', async () => {
    vi.stubEnv('ENABLE_TURNSTILE', 'false');
    vi.stubGlobal('fetch', () => { throw new Error('No debe llamar a Cloudflare'); });
    expect(await verifyTurnstile(undefined)).toBe('verified');
  });
  it('rechaza un token ausente', async () => {
    expect(await verifyTurnstile(undefined)).toBe('rejected');
  });
  it('acepta éxito para el dominio y la acción esperados', async () => {
    cloudflare({ success: true, hostname: 'beta.example.test', action: 'report' });
    expect(await verifyTurnstile('a-token')).toBe('verified');
  });
  it.each([
    { success: false, 'error-codes': ['timeout-or-duplicate'] },
    { success: true, hostname: 'otro.example.test', action: 'report' },
    { success: true, hostname: 'beta.example.test', action: 'login' },
    { success: 'true', hostname: 'beta.example.test', action: 'report' },
    null,
  ])('rechaza un resultado inválido: %j', async (data) => {
    cloudflare(data);
    expect(await verifyTurnstile('a-token')).toBe('rejected');
  });
  it('falla de forma restrictiva sin secreto', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    expect(await verifyTurnstile('a-token')).toBe('unavailable');
  });
  it('exige SITE_URL HTTPS válido', async () => {
    vi.stubEnv('SITE_URL', 'http://beta.example.test');
    expect(await verifyTurnstile('a-token')).toBe('unavailable');
  });
  it('no permite envío cuando Cloudflare no responde', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('network failure'); });
    expect(await verifyTurnstile('a-token')).toBe('unavailable');
  });
  it('no acepta una respuesta HTTP fallida', async () => {
    cloudflare({ success: true, hostname: 'beta.example.test', action: 'report' }, 503);
    expect(await verifyTurnstile('a-token')).toBe('unavailable');
  });
});
