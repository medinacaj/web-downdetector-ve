import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Cifrado en reposo (AES-256-GCM) de datos sensibles del panel, hoy el secreto TOTP.
 * Clave: ADMIN_ENCRYPTION_KEY (64 caracteres hex = 32 bytes), solo en el entorno del
 * servidor. Formato guardado: "v1:" + base64url(iv | tag | texto cifrado).
 */
const PLACEHOLDER = 'reemplazar-con-64-caracteres-hex';

function key(): Buffer {
  const hex = process.env.ADMIN_ENCRYPTION_KEY?.trim();
  if (!hex || hex === PLACEHOLDER || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('ADMIN_ENCRYPTION_KEY no está configurada (64 caracteres hex). Genérala con: openssl rand -hex 32');
  }
  return Buffer.from(hex, 'hex');
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `v1:${Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64url')}`;
}

export function decryptSecret(stored: string): string {
  if (!stored.startsWith('v1:')) throw new Error('Formato de secreto cifrado desconocido');
  const raw = Buffer.from(stored.slice(3), 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}

/** SHA-256 hex (tokens de sesión: en la base solo vive este hash). */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
