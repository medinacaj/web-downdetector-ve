import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { serviceComments, services } from '@/lib/db/schema';
import { createServiceCommentSchema } from '@/lib/validation/service-comments';
import { sanitizeFreeText } from '@/lib/security/sanitize';
import { getClientIp, hashAnonymousId, hashIpPrefix } from '@/lib/privacy';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { getApprovedServiceComments } from '@/lib/queries/service-comments';
import { apiError, ok, withErrorHandling } from '@/lib/api/respond';

const LIMIT_PER_DEVICE = 3;
const LIMIT_PER_NETWORK = 60;
const WINDOW_SECONDS = 60 * 60;
type Context = { params: Promise<{ slug: string }> };

async function findActiveService(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 96) return null;
  const rows = await db.select({ id: services.id })
    .from(services)
    .where(and(eq(services.slug, slug), eq(services.active, true)))
    .limit(1);
  return rows[0] ?? null;
}

async function handleGET(_request: Request, context: Context) {
  const { slug } = await context.params;
  const service = await findActiveService(slug);
  if (!service) return apiError('not_found', 'Servicio no encontrado.');
  const items = await getApprovedServiceComments(service.id);
  return ok(items, { count: items.length });
}

async function handlePOST(request: Request, context: Context) {
  // Limit payload size before JSON parsing; no personal details are required.
  const bodyText = await request.text();
  if (bodyText.length > 2400) return apiError('validation_error', 'Comentario demasiado largo.');
  let body: unknown;
  try { body = JSON.parse(bodyText); }
  catch { return apiError('validation_error', 'La solicitud no contiene JSON válido.'); }

  const input = createServiceCommentSchema.safeParse(body);
  if (!input.success) {
    return apiError('validation_error', 'Revisa el texto y evita información personal.', {
      issues: input.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }
  const cleanText = sanitizeFreeText(input.data.body);
  const validated = createServiceCommentSchema.shape.body.safeParse(cleanText);
  if (!validated.success) return apiError('validation_error', 'El comentario contiene texto no permitido.');

  const { slug } = await context.params;
  const service = await findActiveService(slug);
  if (!service) return apiError('not_found', 'Servicio no encontrado.');

  const anonymousHash = hashAnonymousId(input.data.deviceSeed);
  const ip = getClientIp(request);
  const ipPrefixHash = hashIpPrefix(ip);

  const rate = await checkRateLimit('comment:device:' + anonymousHash, LIMIT_PER_DEVICE, WINDOW_SECONDS);
  if (!rate.allowed) {
    return apiError('rate_limited', 'Ya enviaste varios comentarios. Inténtalo más tarde.', {
      retryAt: new Date(rate.resetAt).toISOString(),
    });
  }
  if (ip !== '0.0.0.0') {
    const network = await checkRateLimit('comment:network:' + ipPrefixHash, LIMIT_PER_NETWORK, WINDOW_SECONDS);
    if (!network.allowed) return apiError('rate_limited', 'Se alcanzó el límite temporal de comentarios desde esta red.');
  }

  const recent = await db.select({ id: serviceComments.id })
    .from(serviceComments)
    .where(and(
      eq(serviceComments.anonymousHash, anonymousHash),
      eq(serviceComments.serviceId, service.id),
      gt(serviceComments.createdAt, new Date(Date.now() - 2 * 60 * 1000)),
    ))
    .limit(1);
  if (recent.length) return apiError('rate_limited', 'Espera un momento antes de enviar otro comentario a este servicio.');

  const [created] = await db.insert(serviceComments).values({
    serviceId: service.id,
    body: validated.data,
    anonymousHash,
    ipPrefixHash,
    moderationStatus: 'pending',
  }).returning({ id: serviceComments.id, createdAt: serviceComments.createdAt });
  return ok({ id: created.id, createdAt: created.createdAt, status: 'pending' },
    { published: false, message: 'Pendiente de revisión; todavía no es público.' }, { status: 201 });
}

export const GET = withErrorHandling(handleGET);
export const POST = withErrorHandling(handlePOST);
