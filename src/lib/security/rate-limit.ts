/**
 * Rate limiting por ventana fija. Si REDIS_URL está configurada, los
 * contadores viven en Redis (correcto con varias instancias). Si no hay REDIS_URL, caen
 * a un Map en memoria del proceso — documentado en .env.example y en el
 * README como válido solo para una sola instancia (sección "Limitaciones").
 *
 * No se instancia el cliente de Redis en el import de este módulo: solo se
 * crea si REDIS_URL está presente, para no exigir Redis en dev/tests.
 */
import type Redis from 'ioredis';

let redisClient: Redis | null | undefined; // undefined = no inicializado todavía

async function getRedis(): Promise<Redis | null> {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url) {
    redisClient = null;
    return null;
  }

  const { default: IORedis } = await import('ioredis');
  const candidate = new IORedis(url, { maxRetriesPerRequest: 1, lazyConnect: true, connectTimeout: 3000 });
  try {
    await candidate.connect();
    redisClient = candidate;
    return candidate;
  } catch {
    candidate.disconnect();
    // Si hay Redis configurado NO degradar silenciosamente a memoria:
    // en varias instancias una caída dejaría sin control real el antiabuso.
    throw new Error('Límite compartido temporalmente no disponible');
  }
}

type MemoryBucket = { count: number; resetAt: number };
const memoryBuckets = new Map<string, MemoryBucket>();

// Evita que memoryBuckets crezca sin límite en un proceso de larga vida.
function sweepExpired(now: number) {
  if (memoryBuckets.size < 5000) return;
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // epoch ms
}

/**
 * @param key Identificador único del sujeto limitado, ej. `report:svc:<serviceId>:<anonHash>`
 * @param limit Máximo de solicitudes permitidas por ventana
 * @param windowSeconds Duración de la ventana en segundos
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const redis = await getRedis();
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  if (redis) {
    const redisKey = `ratelimit:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.pexpire(redisKey, windowMs);
    }
    const ttl = await redis.pttl(redisKey);
    const resetAt = now + (ttl > 0 ? ttl : windowMs);
    return { allowed: count <= limit, limit, remaining: Math.max(0, limit - count), resetAt };
  }

  // Fallback en memoria — ventana fija por proceso.
  sweepExpired(now);
  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, limit, remaining: limit - 1, resetAt: now + windowMs };
  }
  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/** Solo para pruebas: limpia el estado en memoria entre casos. */
export function _resetMemoryRateLimits() {
  memoryBuckets.clear();
}
