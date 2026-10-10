import { describe, it, expect } from 'vitest';
import { hashAnonymousId, hashIpPrefix } from '../src/lib/privacy';

describe('privacy: hashAnonymousId', () => {
  it('es determinista: mismo deviceSeed produce el mismo hash', () => {
    expect(hashAnonymousId('seed-1')).toBe(hashAnonymousId('seed-1'));
  });

  it('deviceSeeds distintos producen hashes distintos', () => {
    expect(hashAnonymousId('seed-1')).not.toBe(hashAnonymousId('seed-2'));
  });

  it('produce un hex de 64 caracteres (sha256)', () => {
    expect(hashAnonymousId('seed-1')).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('privacy: hashIpPrefix', () => {
  it('trunca IPv4 al /24: el último octeto no afecta el hash', () => {
    expect(hashIpPrefix('190.10.20.1')).toBe(hashIpPrefix('190.10.20.254'));
  });

  it('un /24 distinto produce un hash distinto', () => {
    expect(hashIpPrefix('190.10.20.1')).not.toBe(hashIpPrefix('190.10.21.1'));
  });

  it('trunca IPv6 al /48: los grupos finales no afectan el hash', () => {
    expect(hashIpPrefix('2001:db8:1234:5678::1')).toBe(hashIpPrefix('2001:db8:1234:9999::9999'));
  });

  it('nunca devuelve la IP en texto plano', () => {
    const hash = hashIpPrefix('190.10.20.1');
    expect(hash).not.toContain('190');
    expect(hash).not.toContain('.');
  });
});
