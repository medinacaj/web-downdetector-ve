import { afterEach, describe, expect, it, vi } from 'vitest';
import { readJsonBody } from '../src/lib/api/read-json';

afterEach(() => { vi.useRealTimers(); });
function request(body: string, headers: Record<string,string> = {}) {
  return new Request('https://example.test/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body });
}
describe('lectura JSON limitada de reportes', () => {
  it('acepta JSON pequeño y charset', async () => {
    expect(await readJsonBody(request('{"value":"á"}', { 'Content-Type': 'application/json; charset=utf-8' }))).toEqual({value:'á'});
  });
  it('rechaza tipo de contenido incorrecto', async () => {
    await expect(readJsonBody(request('{}', { 'Content-Type': 'text/plain' }))).rejects.toMatchObject({ code: 'unsupported_media_type' });
  });
  it('rechaza JSON malformado con error controlado', async () => {
    await expect(readJsonBody(request('{'))).rejects.toMatchObject({ code: 'validation_error' });
  });
  it('rechaza el tamaño anunciado sin esperar al cuerpo', async () => {
    await expect(readJsonBody(request('{}', { 'Content-Length': '20000' }))).rejects.toMatchObject({ code: 'payload_too_large' });
  });
  it('limita bytes reales aunque falte content-length', async () => {
    await expect(readJsonBody(request(JSON.stringify({ value: 'á'.repeat(9000) })))).rejects.toMatchObject({ code: 'payload_too_large' });
  });
  it('corta un stream que no termina', async () => {
    vi.useFakeTimers();
    const pending = readJsonBody(new Request('https://example.test', {method:'POST', headers:{'Content-Type':'application/json'}, body:new ReadableStream(), duplex:'half'} as RequestInit));
    const assertion = expect(pending).rejects.toMatchObject({code:'request_timeout'});
    await vi.advanceTimersByTimeAsync(5001);
    await assertion;
  });
});
