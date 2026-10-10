import { createHmac } from 'node:crypto';

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
  const ip = rawIp.trim();

  if (ip.includes(':')) {
    // IPv6: primeros 3 grupos hextet (/48)
    const groups = ip.split(':').filter(Boolean).slice(0, 3);
    return hmac(`v6:${groups.join(':')}`);
  }

  // IPv4: primeros 3 octetos (/24)
  const octets = ip.split('.').slice(0, 3);
  if (octets.length < 3) {
    // Dirección no reconocible (proxy raro, IP local, etc.) — se agrupa
    // bajo un cubo fijo en vez de fallar el reporte completo.
    return hmac('v4:unknown');
  }
  return hmac(`v4:${octets.join('.')}`);
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
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '0.0.0.0'; // sin proxy delante (dev local) — se agrupa como IP desconocida
}
