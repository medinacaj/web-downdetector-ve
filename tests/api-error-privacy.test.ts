import { afterEach, describe, expect, it, vi } from 'vitest';
import { withErrorHandling } from '../src/lib/api/respond';

afterEach(() => vi.restoreAllMocks());
const privateFixture = 'PRIVATE_FIXTURE_DO_NOT_LOG';
describe('errores API sin datos sensibles', () => {
  it('no serializa SQL, parámetros ni mensajes de excepción en logs o respuesta', async () => {
    const sink = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cause = Object.assign(new Error(privateFixture), { code: '23514' });
    const failure = Object.assign(new Error(`SQL with ${privateFixture}`), { cause, params: [privateFixture] });
    const handler = withErrorHandling(async () => { throw failure; });
    const response = await handler(new Request(`https://example.test/api/reports?secret=${privateFixture}`));
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.error.details.reference).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(body)).not.toContain(privateFixture);
    const output = JSON.stringify(sink.mock.calls);
    expect(output).not.toContain(privateFixture);
    const record = JSON.parse(sink.mock.calls[0][0]);
    expect(record.event).toBe('api.request_failed');
    expect(record.reference).toBe(body.error.details.reference);
    expect(record.category).toBe('data_integrity');
    expect(Object.keys(record).sort()).toEqual(['category','event','level','reference','timestamp']);
  });
  it('mantiene una respuesta controlada aunque el error tenga getters hostiles', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const hostile = { get code() { throw new Error(privateFixture); } };
    const response = await withErrorHandling(async () => { throw hostile; })(new Request('https://example.test/api/reports'));
    expect(response.status).toBe(500);
    expect((await response.json()).error.details.reference).toMatch(/^[0-9a-f-]{36}$/);
  });
  it('no propaga un fallo del destino de logs al cliente', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => { throw new Error(privateFixture); });
    const response = await withErrorHandling(async () => { throw new Error(privateFixture); })(new Request('https://example.test/api/reports'));
    expect(response.status).toBe(500);
  });
});
