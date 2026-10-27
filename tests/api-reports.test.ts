import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '../src/app/api/reports/route';
import { _resetMemoryRateLimits } from '../src/lib/security/rate-limit';
import { db } from '../src/lib/db/client';
import { reports } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Estas pruebas llaman el route handler directamente (sin servidor HTTP) y
 * SÍ tocan Postgres de verdad — requieren DATABASE_URL configurada y la
 * migración aplicada y datos semilla. Ejecutar con DATABASE_URL apuntando
 * a pulsove_test; nunca usar datos ni credenciales de producción.
 */
function makeRequest(body: unknown) {
  return new Request('http://localhost/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/reports (integración, Postgres real)', () => {
  beforeEach(() => {
    _resetMemoryRateLimits();
    vi.stubEnv('ENABLE_TURNSTILE', 'false');
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it.each(['missing', 'invalid', 'unavailable'])(
    'Turnstile %s impide insertar reportes', async (scenario) => {
      vi.stubEnv('ENABLE_TURNSTILE', 'true');
      vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret-not-real');
      vi.stubEnv('SITE_URL', 'https://beta.example.test');
      vi.stubGlobal('fetch', async () => {
        if (scenario === 'unavailable') throw new Error('provider unavailable');
        return Response.json({ success: false, 'error-codes': ['invalid-input-response'] });
      });
      const count = async () => (await db.select({ n: sql<number>`count(*)::int` }).from(reports))[0].n;
      const before = await count();
      const response = await POST(makeRequest({
        serviceSlug: 'movistar', issueTypeSlug: 'lentitud', stateCode: 'VE-M',
        deviceSeed: `vitest-challenge-${scenario}-${Date.now()}`,
        ...(scenario === 'missing' ? {} : { turnstileToken: 'a-token' }),
      }));
      expect(response.status).toBe(scenario === 'unavailable' ? 503 : 422);
      expect(await count()).toBe(before);
    },
  );

  it('inserta un reporte después de verificar el desafío', async () => {
    vi.stubEnv('ENABLE_TURNSTILE', 'true');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret-not-real');
    vi.stubEnv('SITE_URL', 'https://beta.example.test');
    vi.stubGlobal('fetch', async () => Response.json({ success: true, hostname: 'beta.example.test', action: 'report' }));
    const response = await POST(makeRequest({ serviceSlug: 'movistar', issueTypeSlug: 'lentitud',
      stateCode: 'VE-M', deviceSeed: `vitest-challenge-valid-${Date.now()}`, turnstileToken: 'a-token' }));
    expect(response.status).toBe(201);
    expect((await response.json()).data.id).toBeTruthy();
  });

  it('crea un reporte válido y devuelve 201 con confianza base', async () => {
    const res = await POST(
      makeRequest({
        serviceSlug: 'movistar',
        issueTypeSlug: 'lentitud',
        stateCode: 'VE-M',
        deviceSeed: `vitest-${Date.now()}-a`,
      }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBeTruthy();
    expect(json.data.confidence).toBeCloseTo(0.45);
    expect(json.data.suspicious).toBe(false);
  });

  it('rechaza un cuerpo inválido con 400 y el campo que falló', async () => {
    const res = await POST(makeRequest({ serviceSlug: 'movistar' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('validation_error');
    expect(json.error.details.issues.some((i: { path: string }) => i.path === 'deviceSeed')).toBe(
      true,
    );
  });

  it('rechaza un servicio inexistente con 400 (nunca inserta con una referencia adivinada)', async () => {
    const res = await POST(
      makeRequest({
        serviceSlug: 'servicio-que-no-existe',
        issueTypeSlug: 'lentitud',
        stateCode: 'VE-M',
        deviceSeed: `vitest-${Date.now()}-b`,
      }),
    );
    expect(res.status).toBe(400);
  });

  it('marca como sospechoso un envío duplicado inmediato', async () => {
    const deviceSeed = `vitest-${Date.now()}-c`;
    const body = { serviceSlug: 'movistar', issueTypeSlug: 'lentitud', stateCode: 'VE-M', deviceSeed };
    const first = await POST(makeRequest(body));
    const second = await POST(makeRequest(body));
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    const secondJson = await second.json();
    expect(secondJson.data.suspicious).toBe(true);
    expect(secondJson.data.confidence).toBeLessThan(0.2);
  });

  it('bloquea con 429 tras superar el límite por identidad anónima', async () => {
    const deviceSeed = `vitest-${Date.now()}-d`;
    const body = { serviceSlug: 'movistar', issueTypeSlug: 'lentitud', stateCode: 'VE-M', deviceSeed };
    const max = Number(process.env.RATE_LIMIT_REPORTS_MAX ?? 5);

    let lastStatus = 0;
    for (let i = 0; i < max + 1; i++) {
      const res = await POST(makeRequest(body));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
