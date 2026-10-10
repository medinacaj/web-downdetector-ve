import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../src/app/api/reports/route';
import { _resetMemoryRateLimits } from '../src/lib/security/rate-limit';

/**
 * Estas pruebas llaman el route handler directamente (sin servidor HTTP) y
 * SÍ tocan Postgres de verdad — requieren DATABASE_URL configurada y la
 * migración aplicada (igual que `npm run db:seed`). No están aisladas en
 * una base de datos de prueba separada: insertan filas reales en la BD de
 * desarrollo. Limitación conocida, documentada en docs/00-PLAN-MAESTRO.md
 * (registro de la Etapa 2) — una base de datos de prueba dedicada es
 * trabajo de la Etapa 10 (CI).
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
