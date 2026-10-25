import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

/**
 * Nunca se almacena una IP completa ni un identificador permanente de
 * usuario (brief, sección 12.2). Este módulo es el único lugar del proyecto
 * que debe tocar la IP cruda — todo lo demás trabaja con los hashes que
 * produce.
 */

function salt(): string {
  const s = process.env.ANONYMIZATION_SALT;
  if (!s || s === 'reemplazar-con-otro-secreto-aleatorio') {
    throw new Error(
      'ANONYMIZATION_SALT no está configurada (o sigue con el valor de ejemplo). ' +
        'Genera un secreto real antes de aceptar reportes.',
    );
  }
  return s;
}

function hmac(value: string): string {
  return createHmac('sha256', salt()).update(value).digest('hex');
}

/**
 * IP completa -> prefijo truncado (/24 en IPv4, /48 en IPv6) -> hash.
 * El truncamiento ocurre ANTES del hash: agrupa dispositivos del mismo
 * segmento de red bajo el mismo hash, que es la señal que necesita el motor
 * anti-abuso (sección 11), sin que ese hash permita reconstruir una IP
 * individual.
 */
export function hashIpPrefix(rawIp: string): string {
  const ip = rawIp.trim().toLowerCase();

  // Normalizar IPv4 embebido en IPv6 para evitar identidades diferentes
  // de un mismo prefijo de red por su representación textual.
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (mapped && isIP(mapped[1]) === 4) return hashIpPrefix(mapped[1]);

  if (isIP(ip) === 6) {
    const parts = ip.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts.length === 2 && parts[1] ? parts[1].split(':') : [];
    const groups = parts.length === 2
      ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right]
      : ip.split(':');
    if (groups.length === 8) {
      return hmac('v6:' + groups.slice(0, 3).map(x => parseInt(x, 16).toString(16)).join(':'));
    }
    return hmac('v6:unknown');
  }

  if (isIP(ip) === 4) {
    return hmac('v4:' + ip.split('.').slice(0, 3).map(x => Number(x)).join('.'));
  }

  return hmac('ip:unknown');
}

/**
 * Identificador anónimo del reportante. `deviceSeed` es un valor que el
 * cliente genera y persiste localmente (p. ej. un UUID en localStorage) —
 * nunca un dato personal. Rotarlo es responsabilidad del cliente; este
 * hash por sí solo no permite identificar a una persona.
 */
export function hashAnonymousId(deviceSeed: string): string {
  return hmac(`anon:${deviceSeed}`);
}

/**
 * Extrae la IP del cliente desde los headers estándar de proxy/CDN
 * (Vercel, Cloudflare, Nginx). No hay IP directa de socket disponible en
 * un Route Handler de Next.js.
 */
/** Desconocida: sin cabecera confiable configurada (o con un valor que no es una IP). */
export const UNKNOWN_IP = '0.0.0.0';

export function getClientIp(request: { headers: Pick<Headers, 'get'> }): string {
  // Solo confiar en la cabecera que el proxy/CDN autenticado y administrado
  // SOBRESCRIBE. No aceptar X-Forwarded-For aportado libremente por el cliente.
  const configured = process.env.TRUSTED_CLIENT_IP_HEADER?.toLowerCase().trim();
  const trusted = ['x-forwarded-for', 'cf-connecting-ip', 'x-real-ip'];
  if (!configured || !trusted.includes(configured)) return '0.0.0.0';
  const raw = request.headers.get(configured);
  if (!raw) return '0.0.0.0';
  // X-Forwarded-For puede contener cadena de proxies; configurar únicamente
  // si el ingress garantiza que reemplaza/elimina aportaciones del cliente.
  const candidate = raw.split(',')[0].trim();
  return isIP(candidate) ? candidate : '0.0.0.0';
}
