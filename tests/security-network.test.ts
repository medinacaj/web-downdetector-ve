import { afterEach, describe, expect, it } from 'vitest';
import { getClientIp, hashIpPrefix } from '../src/lib/privacy';
import { _resetMemoryRateLimits, checkRateLimit } from '../src/lib/security/rate-limit';

const original = process.env.TRUSTED_CLIENT_IP_HEADER;
afterEach(() => {
  if (original === undefined) delete process.env.TRUSTED_CLIENT_IP_HEADER;
  else process.env.TRUSTED_CLIENT_IP_HEADER = original;
  _resetMemoryRateLimits();
});

function request(headers: Record<string, string>) {
  return new Request('https://ejemplo.test/api/reports', { headers });
}

describe('cabeceras de red y privacidad', () => {
  it('ignora cabeceras no autorizadas', () => {
    delete process.env.TRUSTED_CLIENT_IP_HEADER;
    expect(getClientIp(request({ 'x-forwarded-for': '8.8.8.8' }))).toBe('0.0.0.0');
  });
  it('reconoce una IP solo cuando está declarado el proxy y es válida', () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-real-ip';
    expect(getClientIp(request({ 'x-real-ip': '190.10.20.15' }))).toBe('190.10.20.15');
    expect(getClientIp(request({ 'x-real-ip': 'texto-falso' }))).toBe('0.0.0.0');
  });
  it('acepta solo el primer salto declarado cuando el proxy sanea XFF', () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-forwarded-for';
    expect(getClientIp(request({ 'x-forwarded-for': '190.10.20.1, 10.0.0.2' }))).toBe('190.10.20.1');
  });
  it('normaliza representaciones IPv6 equivalentes', () => {
    expect(hashIpPrefix('2001:db8::1')).toBe(hashIpPrefix('2001:0db8:0000:ffff::123'));
    expect(hashIpPrefix('::ffff:190.10.20.5')).toBe(hashIpPrefix('190.10.20.8'));
  });
});

describe('cuotas en memoria para un único proceso', () => {
  it('rechaza la tercera solicitud dentro de una ventana de dos', async () => {
    delete process.env.REDIS_URL;
    _resetMemoryRateLimits();
    expect((await checkRateLimit('test:p1', 2, 60)).allowed).toBe(true);
    expect((await checkRateLimit('test:p1', 2, 60)).allowed).toBe(true);
    expect((await checkRateLimit('test:p1', 2, 60)).allowed).toBe(false);
  });
});
