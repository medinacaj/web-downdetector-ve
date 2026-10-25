import { and, eq, gt, sql } from 'drizzle-orm';
import { REPORT_RATE_LIMIT } from '@/lib/engine/parameters';
import { getTurnstileConfig, verifyTurnstileToken } from '@/lib/security/turnstile';
import { db } from '@/lib/db/client';
import { reports, services, issueTypes, states } from '@/lib/db/schema';
import { createReportSchema } from '@/lib/validation/reports';
import { sanitizeFreeText } from '@/lib/security/sanitize';
import { hashAnonymousId, hashIpPrefix, getClientIp, UNKNOWN_IP } from '@/lib/privacy';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { ok, apiError, withErrorHandling } from '@/lib/api/respond';

const REPORT_LIMIT_PER_HASH = REPORT_RATE_LIMIT.max;
const REPORT_WINDOW_SECONDS = REPORT_RATE_LIMIT.windowSeconds;
const REPORT_LIMIT_PER_PREFIX = REPORT_RATE_LIMIT.prefixMax;

/**
 * Puntuación inicial básica (brief, sección 11.2). Es deliberadamente
 * simple: la versión completa (diversidad de dispositivos/redes,
 * detección de campañas coordinadas, señales técnicas) es la Etapa 7. Esta
 * versión cubre solo lo verificable con una sola consulta.
 */
async function scoreReport(params: {
  serviceId: string;
  issueTypeId: string;
  anonymousHash: string;
}): Promise<{ confidence: number; suspicious: boolean }> {
  const sixtySecondsAgo = new Date(Date.now() - 60_000);

  const recentDuplicate = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.anonymousHash, params.anonymousHash),
        eq(reports.serviceId, params.serviceId),
        eq(reports.issueTypeId, params.issueTypeId),
        gt(reports.createdAt, sixtySecondsAgo),
      ),
    )
    .limit(1);

  if (recentDuplicate.length > 0) {
    // Mismo hash, mismo servicio, mismo problema, hace menos de un minuto:
    // envío doble o automatizado. Se guarda igual (nunca se descarta en
    // silencio — sección "reportes descartados" de estadísticas necesita
    // poder contarlo) pero marcado y con confianza mínima.
    return { confidence: 0.1, suspicious: true };
  }

  const priorCountRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reports)
    .where(eq(reports.anonymousHash, params.anonymousHash));
  const priorCount = priorCountRows[0]?.n ?? 0;

  // Hash sin historial: confianza ligeramente por debajo de la base.
  // Historial moderado sin marcas de sospecha: ligeramente por encima.
  // Tope bajo (0.65) porque esta heurística por sí sola no debe acercarse
  // a la confianza que dará el motor completo de la Etapa 7.
  const confidence = priorCount === 0 ? 0.45 : Math.min(0.5 + priorCount * 0.01, 0.65);
  return { confidence, suspicious: false };
}

async function handlePOST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('validation_error', 'El cuerpo de la solicitud no es JSON válido');
  }

  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('validation_error', 'Datos de reporte inválidos', {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  const input = parsed.data;

  // Turnstile (Etapa 5), antes de tocar la base: falla cerrada si está activado.
  const turnstile = getTurnstileConfig();
  if (turnstile.enabled) {
    if ('misconfigured' in turnstile) {
      console.error(`[turnstile] ${turnstile.misconfigured}`);
      return apiError('service_unavailable', 'No pudimos verificar el reporte en este momento. Intenta de nuevo más tarde.');
    }
    const check = await verifyTurnstileToken(input.turnstileToken, turnstile.secretKey);
    if (!check.ok) {
      if (check.reason === 'unavailable') {
        console.error(`[turnstile] verificación no disponible: ${check.detail}`);
        return apiError('service_unavailable', 'No pudimos verificar el reporte en este momento. Intenta de nuevo más tarde.');
      }
      return apiError('verification_failed', 'No pudimos confirmar que el reporte lo envía una persona. Vuelve a intentarlo.');
    }
  }

  // Resolver referencias por slug/código a id — 404 explícito si no existen,
  // nunca insertar con una referencia adivinada.
  const [service, issueType, state] = await Promise.all([
    db.select({ id: services.id, active: services.active }).from(services).where(eq(services.slug, input.serviceSlug)).limit(1),
    db.select({ id: issueTypes.id }).from(issueTypes).where(eq(issueTypes.slug, input.issueTypeSlug)).limit(1),
    db.select({ id: states.id }).from(states).where(eq(states.code, input.stateCode)).limit(1),
  ]);

  if (service.length === 0 || !service[0].active) {
    return apiError('validation_error', `El servicio "${input.serviceSlug}" no existe`);
  }
  if (issueType.length === 0) {
    return apiError('validation_error', `El tipo de problema "${input.issueTypeSlug}" no existe`);
  }
  if (state.length === 0) {
    return apiError('validation_error', `El código de estado "${input.stateCode}" no existe`);
  }

  const ip = getClientIp(request);
  const ipPrefixHash = hashIpPrefix(ip);
  const anonymousHash = hashAnonymousId(input.deviceSeed);

  // Límite por identidad anónima (brief, sección 11.1: "límite por servicio
  // y dispositivo"). Un segundo límite más amplio por prefijo de IP queda
  // para la Etapa 7 junto con la detección de campañas coordinadas.
  const rateLimit = await checkRateLimit(
    `report:${anonymousHash}`,
    REPORT_LIMIT_PER_HASH,
    REPORT_WINDOW_SECONDS,
  );
  if (!rateLimit.allowed) {
    return apiError('rate_limited', 'Demasiados reportes en poco tiempo. Intenta de nuevo más tarde.', {
      retryAt: new Date(rateLimit.resetAt).toISOString(),
    });
  }

  // Segundo límite, mucho más amplio, por prefijo de red truncado y
  // anonimizado. Solo se aplica si el ingress verifica la IP: cabeceras
  // reenviadas sin una cadena de confianza no sirven como antiabuso.
  if (ip !== UNKNOWN_IP) {
    const networkLimit = await checkRateLimit(
      `report:network:${ipPrefixHash}`,
      REPORT_LIMIT_PER_PREFIX,
      REPORT_WINDOW_SECONDS,
    );
    if (!networkLimit.allowed) {
      return apiError('rate_limited', 'Exceso de actividad desde esta red. Intenta más tarde.', {
        retryAt: new Date(networkLimit.resetAt).toISOString(),
      });
    }
  }

  const { confidence, suspicious } = await scoreReport({
    serviceId: service[0].id,
    issueTypeId: issueType[0].id,
    anonymousHash,
  });

  const [inserted] = await db
    .insert(reports)
    .values({
      serviceId: service[0].id,
      issueTypeId: issueType[0].id,
      stateId: state[0].id,
      cityText: input.cityText ? sanitizeFreeText(input.cityText) : null,
      networkCarrier: input.networkCarrier ? sanitizeFreeText(input.networkCarrier) : null,
      comment: input.comment ? sanitizeFreeText(input.comment) : null,
      source: 'web',
      anonymousHash,
      ipPrefixHash,
      confidence,
      suspicious,
    })
    .returning({ id: reports.id, createdAt: reports.createdAt });

  return ok(
    {
      id: inserted.id,
      createdAt: inserted.createdAt,
      // El reportante ve su propia confianza y si quedó marcado; el resto
      // de la API pública nunca expone estos campos para otros reportes.
      confidence,
      suspicious,
    },
    { rateLimitRemaining: rateLimit.remaining },
    { status: 201 },
  );
}

export const POST = withErrorHandling(handlePOST);
