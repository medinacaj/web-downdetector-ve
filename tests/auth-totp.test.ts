import { describe, it, expect, beforeAll } from 'vitest';
import { base32Decode, base32Encode, hotp, otpauthUri, totpAt, verifyTotp, generateTotpSecret } from '../src/lib/auth/totp';
import { decryptSecret, encryptSecret, sha256 } from '../src/lib/auth/crypto';
import { hashPassword, passwordProblem, verifyPassword } from '../src/lib/auth/password';

const RFC_KEY = Buffer.from('12345678901234567890', 'ascii');

describe('TOTP: vectores oficiales', () => {
  it('HOTP de RFC 4226, apéndice D (contadores 0–9)', () => {
    const expected = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489'];
    expected.forEach((code, counter) => expect(hotp(RFC_KEY, counter), `contador ${counter}`).toBe(code));
  });

  it('TOTP de RFC 6238, apéndice B (SHA-1, 8 dígitos)', () => {
    const cases: [number, string][] = [
      [59, '94287082'],
      [1111111109, '07081804'],
      [1111111111, '14050471'],
      [1234567890, '89005924'],
      [2000000000, '69279037'],
      [20000000000, '65353130'],
    ];
    for (const [t, code] of cases) expect(hotp(RFC_KEY, Math.floor(t / 30), 8), `T=${t}`).toBe(code);
  });

  it('base32 ida y vuelta, y el secreto del RFC', () => {
    expect(base32Encode(RFC_KEY)).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(base32Decode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ').equals(RFC_KEY)).toBe(true);
    const s = generateTotpSecret();
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Encode(base32Decode(s))).toBe(s);
  });
});

describe('TOTP: verificación', () => {
  const secret = base32Encode(RFC_KEY);
  const now = new Date(1234567890 * 1000);

  it('acepta el código actual y ±1 paso; rechaza más allá, formatos raros y vacíos', () => {
    const t = 1234567890;
    expect(verifyTotp(secret, totpAt(secret, t), now)).toBe(Math.floor(t / 30));
    expect(verifyTotp(secret, totpAt(secret, t - 30), now)).not.toBeNull();
    expect(verifyTotp(secret, totpAt(secret, t + 30), now)).not.toBeNull();
    expect(verifyTotp(secret, totpAt(secret, t - 90), now)).toBeNull();
    for (const bad of ['', '12345', '1234567', 'abcdef', '12 34 5a']) expect(verifyTotp(secret, bad, now), bad).toBeNull();
  });

  it('el URI otpauth lleva emisor, secreto y parámetros estándar', () => {
    const uri = otpauthUri('admin@pulsove.example', 'ABC');
    expect(uri.startsWith('otpauth://totp/PulsoVE%3Aadmin%40pulsove.example?')).toBe(true);
    const q = new URL(uri).searchParams;
    expect([q.get('secret'), q.get('issuer'), q.get('digits'), q.get('period')]).toEqual(['ABC', 'PulsoVE', '6', '30']);
  });
});

describe('cifrado del secreto y contraseñas', () => {
  beforeAll(() => {
    process.env.ADMIN_ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('AES-256-GCM: ida y vuelta, IV aleatorio y detecta manipulación', () => {
    const a = encryptSecret('SECRETO');
    expect(a).not.toContain('SECRETO');
    expect(encryptSecret('SECRETO')).not.toBe(a);
    expect(decryptSecret(a)).toBe('SECRETO');
    const tampered = a.slice(0, -2) + (a.endsWith('A') ? 'BB' : 'AA');
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it('sin clave válida no cifra', () => {
    const prev = process.env.ADMIN_ENCRYPTION_KEY;
    process.env.ADMIN_ENCRYPTION_KEY = 'corta';
    expect(() => encryptSecret('x')).toThrow(/ADMIN_ENCRYPTION_KEY/);
    process.env.ADMIN_ENCRYPTION_KEY = prev;
  });

  it('sha256 de tokens', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('contraseñas: política, hash y verificación (también sin usuario)', async () => {
    expect(passwordProblem('corta')).toMatch(/12/);
    expect(passwordProblem('x'.repeat(73))).toMatch(/72/);
    expect(passwordProblem('una-contraseña-larga')).toBeNull();
    const h = await hashPassword('una-contraseña-larga');
    expect(await verifyPassword('una-contraseña-larga', h)).toBe(true);
    expect(await verifyPassword('otra-contraseña-larga', h)).toBe(false);
    expect(await verifyPassword('lo-que-sea', null)).toBe(false);
  }, 20000);
});
