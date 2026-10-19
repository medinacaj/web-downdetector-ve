import { NextResponse } from 'next/server';

/**
 * Sobre de respuesta consistente para toda la API pública (brief, sección
 * 15). Los endpoints de lectura usan `ok`; los de error usan `apiError` con
 * un código estable (no un mensaje libre) para que el frontend pueda
 * distinguir casos sin parsear texto.
 */

export type ApiErrorCode =
  | 'validation_error'
  | 'not_found'
  | 'rate_limited'
  | 'suspicious_activity'
  | 'verification_failed'
  | 'service_unavailable'
  | 'internal_error';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  validation_error: 400,
  not_found: 404,
  rate_limited: 429,
  suspicious_activity: 422,
  // Turnstile (Etapa 5): el token no superó la verificación / no se pudo verificar.
  verification_failed: 400,
  service_unavailable: 503,
  internal_error: 500,
};

export function ok<T>(data: T, meta?: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json({ data, meta: meta ?? null }, init);
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    { error: { code, message, details: details ?? null } },
    { status: STATUS_BY_CODE[code] },
  );
}

/**
 * Envuelve un route handler para que cualquier excepción no controlada
 * (p. ej. Postgres caído, un bug no previsto) devuelva un error genérico y
 * consistente en vez de dejar escapar un stack trace — visto en vivo al
 * probar esta etapa: una conexión rechazada devolvía el mensaje interno
 * completo, incluyendo la consulta SQL. El detalle real queda en el log
 * del servidor, no en la respuesta HTTP (sección 21 del brief: no exponer
 * detalles internos).
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (request: Request, ...args: Args) => Promise<Response>,
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    try {
      return await handler(request, ...args);
    } catch (err) {
      console.error('Error no manejado en ruta API:', err);
      return apiError('internal_error', 'Ocurrió un error interno. Intenta de nuevo en unos momentos.');
    }
  };
}

/** Parámetros de paginación comunes, con límites para evitar sección 19 ("consultas sin límites"). */
export function parsePagination(searchParams: URLSearchParams) {
  const rawLimit = Number(searchParams.get('limit') ?? '20');
  const rawOffset = Number(searchParams.get('offset') ?? '0');
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;
  return { limit, offset };
}
