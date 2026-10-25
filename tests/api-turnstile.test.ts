import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from '../src/app/api/reports/route';
import { _resetMemoryRateLimits } from '../src/lib/security/rate-limit';

/**
 * Integración (Postgres real, `npm run test:integration`): el endpoint de reportes con
 * Turnstile activado. `fetch` simulado: no se contacta Cloudflare (ver
 * tests/turnstile.test.ts para la verificación del token en sí).
 */
const json = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

describe('POST /api/reports con Turnstile activado (fetch simulado, Postgres real)', () => {
  const body = (extra: Record<string, unknown> = {}) =>
    new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceSlug: 'movistar',
        issueTypeSlug: 'lentitud',
        stateCode: 'VE-M',
        deviceSeed: `vitest-turnstile-${Math.random()}`,
        ...extra,
      }),
    });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    _resetMemoryRateLimits();
  });

  const enable = () => {
    vi.stubEnv('ENABLE_TURNSTILE', 'true');
    vi.stubEnv('TURNSTILE_SITE_KEY', 'site');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
  };

  it('sin token → 400 verification_failed, sin insertar', async () => {
    enable();
    const res = await POST(body());
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('verification_failed');
  });

  it('token aceptado → 201', async () => {
    enable();
    vi.stubGlobal('fetch', json({ success: true }));
    const res = await POST(body({ turnstileToken: 'ok' }));
    expect(res.status).toBe(201);
  });

  it('Cloudflare inalcanzable → 503 service_unavailable', async () => {
    enable();
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('fetch failed'))));
    const res = await POST(body({ turnstileToken: 'ok' }));
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe('service_unavailable');
  });

  it('activado pero sin claves → 503 (no acepta sin verificar)', async () => {
    vi.stubEnv('ENABLE_TURNSTILE', 'true');
    vi.stubEnv('TURNSTILE_SITE_KEY', '');
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    const res = await POST(body({ turnstileToken: 'ok' }));
    expect(res.status).toBe(503);
  });
});
