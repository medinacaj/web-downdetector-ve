/**
 * Cloudflare Turnstile (anti-robots) para POST /api/reports — Etapa 5.
 *
 * Desactivado por defecto (`ENABLE_TURNSTILE="false"`). Activado, cada reporte debe
 * traer un token del widget y el servidor lo valida contra la API siteverify de
 * Cloudflare antes de tocar la base de datos. Decisiones:
 * - Falla cerrada: si está activado pero mal configurado, o Cloudflare no responde, el
 *   reporte se rechaza (aceptarlo sin verificar anularía la protección).
 * - Privacidad: NO se envía la IP del usuario a Cloudflare (`remoteip` es opcional);
 *   CLAUDE.md prohíbe tratar la IP completa fuera de src/lib/privacy.ts.
 * - Los tokens son de un solo uso: el formulario pide uno nuevo tras cada envío.
 *
 * NO VERIFICADO contra Cloudflare: la red del entorno de desarrollo bloquea
 * challenges.cloudflare.com. El contrato (URL, campos `secret`/`response`, respuesta
 * `success`/`error-codes`) sigue la API pública de Turnstile; probarlo con claves
 * reales antes de activarlo en producción (ver docs/00-PLAN-MAESTRO.md).
 */
export const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 5000;
/** Longitud máxima de un token de Turnstile. */
export const TURNSTILE_TOKEN_MAX_LENGTH = 2048;

export type TurnstileConfig =
  | { enabled: false }
  | { enabled: true; siteKey: string; secretKey: string }
  | { enabled: true; misconfigured: string };

export function resolveTurnstileConfig(env: {
  ENABLE_TURNSTILE?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}): TurnstileConfig {
  if (env.ENABLE_TURNSTILE?.trim().toLowerCase() !== 'true') return { enabled: false };
  const siteKey = env.TURNSTILE_SITE_KEY?.trim();
  const secretKey = env.TURNSTILE_SECRET_KEY?.trim();
  if (!siteKey || !secretKey) {
    return { enabled: true, misconfigured: 'ENABLE_TURNSTILE="true" pero faltan TURNSTILE_SITE_KEY o TURNSTILE_SECRET_KEY' };
  }
  return { enabled: true, siteKey, secretKey };
}

/** Configuración del proceso (se lee en cada uso: cambiar el entorno no exige reiniciar las pruebas). */
export function getTurnstileConfig(): TurnstileConfig {
  return resolveTurnstileConfig({
    ENABLE_TURNSTILE: process.env.ENABLE_TURNSTILE,
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  });
}

/** Clave pública para el widget, o null si Turnstile no está activo y bien configurado. */
export function getTurnstileSiteKey(): string | null {
  const config = getTurnstileConfig();
  return config.enabled && 'siteKey' in config ? config.siteKey : null;
}

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: 'missing_token' | 'invalid_token' }
  | { ok: false; reason: 'unavailable'; detail: string };

/**
 * Valida un token con siteverify. `invalid_token` = Cloudflare dijo que no (o token
 * ausente); `unavailable` = no se pudo preguntar (red, tiempo, respuesta extraña).
 */
export async function verifyTurnstileToken(
  token: string | undefined,
  secretKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnstileResult> {
  if (!token) return { ok: false, reason: 'missing_token' };
  if (token.length > TURNSTILE_TOKEN_MAX_LENGTH) return { ok: false, reason: 'invalid_token' };

  let res: Response;
  try {
    res = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secretKey, response: token }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    return { ok: false, reason: 'unavailable', detail: err instanceof Error ? err.name : 'error de red' };
  }
  if (!res.ok) return { ok: false, reason: 'unavailable', detail: `HTTP ${res.status}` };

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, reason: 'unavailable', detail: 'respuesta no JSON' };
  }
  if (typeof body !== 'object' || body === null || typeof (body as { success?: unknown }).success !== 'boolean') {
    return { ok: false, reason: 'unavailable', detail: 'respuesta sin "success"' };
  }
  const { success } = body as { success: boolean; 'error-codes'?: string[] };
  // Un secreto inválido es un problema nuestro (configuración), no del usuario.
  const codes = (body as { 'error-codes'?: unknown })['error-codes'];
  if (!success && Array.isArray(codes) && codes.some((c) => c === 'invalid-input-secret' || c === 'missing-input-secret')) {
    return { ok: false, reason: 'unavailable', detail: `secreto rechazado (${codes.join(', ')})` };
  }
  return success ? { ok: true } : { ok: false, reason: 'invalid_token' };
}
