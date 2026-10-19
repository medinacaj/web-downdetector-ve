import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveTurnstileConfig, verifyTurnstileToken } from '../src/lib/security/turnstile';
import { POST } from '../src/app/api/reports/route';
import { _resetMemoryRateLimits } from '../src/lib/security/rate-limit';

/**
 * Prueban NUESTRO código ante cada respuesta posible de siteverify, inyectando `fetch`.
 * No contactan Cloudflare (la red del entorno lo bloquea): eso queda por verificar con
 * claves reales (ver docs/00-PLAN-MAESTRO.md, Etapa 5).
 */
const json = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

describe('turnstile: configuración', () => {
  it('desactivado salvo ENABLE_TURNSTILE="true"', () => {
    for (const v of [undefined, '', 'false', '1']) expect(resolveTurnstileConfig({ ENABLE_TURNSTILE: v })).toEqual({ enabled: false });
  });
  it('activado sin claves queda marcado como mal configurado (falla cerrada)', () => {
    const c = resolveTurnstileConfig({ ENABLE_TURNSTILE: 'true', TURNSTILE_SITE_KEY: 'x' });
    expect(c).toMatchObject({ enabled: true });
    expect('misconfigured' in c).toBe(true);
  });
  it('activado con claves', () => {
    expect(resolveTurnstileConfig({ ENABLE_TURNSTILE: 'true', TURNSTILE_SITE_KEY: 's', TURNSTILE_SECRET_KEY: 'k' })).toEqual({
      enabled: true,
      siteKey: 's',
      secretKey: 'k',
    });
  });
});

describe('turnstile: verificación del token', () => {
  it('envía secret y response por POST de formulario, y nunca la IP', async () => {
    const f = json({ success: true });
    expect(await verifyTurnstileToken('tok', 'sec', f)).toEqual({ ok: true });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(init.method).toBe('POST');
    const params = new URLSearchParams(String(init.body));
    expect(params.get('secret')).toBe('sec');
    expect(params.get('response')).toBe('tok');
    expect(params.has('remoteip')).toBe(false);
  });

  it('sin token o con uno demasiado largo no llama a Cloudflare', async () => {
    const f = json({ success: true });
    expect(await verifyTurnstileToken(undefined, 'sec', f)).toEqual({ ok: false, reason: 'missing_token' });
    expect(await verifyTurnstileToken('x'.repeat(2049), 'sec', f)).toEqual({ ok: false, reason: 'invalid_token' });
    expect(f).not.toHaveBeenCalled();
  });

  it('token rechazado → invalid_token; secreto rechazado → unavailable (es configuración nuestra)', async () => {
    expect(await verifyTurnstileToken('t', 's', json({ success: false, 'error-codes': ['invalid-input-response'] }))).toEqual({
      ok: false,
      reason: 'invalid_token',
    });
    expect(await verifyTurnstileToken('t', 's', json({ success: false, 'error-codes': ['invalid-input-secret'] }))).toMatchObject({
      ok: false,
      reason: 'unavailable',
    });
  });

  it('red caída, HTTP de error o respuesta extraña → unavailable (falla cerrada)', async () => {
    const down = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    for (const f of [down, json({ success: true }, 502), json({ nada: 1 }), vi.fn(async () => new Response('<html>'))]) {
      expect(await verifyTurnstileToken('t', 's', f as unknown as typeof fetch)).toMatchObject({ ok: false, reason: 'unavailable' });
    }
  });
});

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
