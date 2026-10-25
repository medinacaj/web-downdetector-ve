import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * TOTP (RFC 6238, sobre HOTP de RFC 4226) con node:crypto, sin dependencias: HMAC-SHA1,
 * pasos de 30 s y 6 dígitos, lo que usan Google Authenticator, Authy, 1Password, etc.
 * Probado con los vectores oficiales del RFC (tests/auth-totp.test.ts).
 */
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx === -1) throw new Error('Secreto base32 inválido');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Secreto nuevo de 160 bits (lo recomendado por RFC 4226), en base32. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** HOTP(K, C) truncado a `digits` dígitos (RFC 4226, sección 5.3). */
export function hotp(key: Buffer, counter: number, digits = TOTP_DIGITS, algorithm = 'sha1'): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac(algorithm, key).update(msg).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const bin =
    ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

export function totpAt(secretBase32: string, unixSeconds: number): string {
  return hotp(base32Decode(secretBase32), Math.floor(unixSeconds / TOTP_STEP_SECONDS));
}

/**
 * ¿Es válido `code` en el paso actual o en ±`window` pasos (deriva de reloj)? Devuelve el
 * contador aceptado (para impedir reutilizar el mismo código) o null. Comparación en
 * tiempo constante.
 */
export function verifyTotp(secretBase32: string, code: string, now: Date = new Date(), window = 1): number | null {
  const clean = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return null;
  const key = base32Decode(secretBase32);
  const current = Math.floor(now.getTime() / 1000 / TOTP_STEP_SECONDS);
  for (let d = -window; d <= window; d++) {
    const expected = Buffer.from(hotp(key, current + d));
    if (timingSafeEqual(expected, Buffer.from(clean))) return current + d;
  }
  return null;
}

/** URI otpauth:// para el código QR de alta. */
export function otpauthUri(accountEmail: string, secretBase32: string, issuer = 'PulsoVE'): string {
  const label = encodeURIComponent(`${issuer}:${accountEmail}`);
  const params = new URLSearchParams({ secret: secretBase32, issuer, algorithm: 'SHA1', digits: '6', period: '30' });
  return `otpauth://totp/${label}?${params.toString()}`;
}
