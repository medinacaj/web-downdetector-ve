import 'server-only';
import { randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { and, eq, gt, lt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { adminSessions, users } from '@/lib/db/schema';
import { getClientIp, hashIpPrefix } from '@/lib/privacy';
import { sha256 } from './crypto';

/**
 * Sesiones del panel guardadas en la base (decisión de la persona propietaria, Etapa 6).
 * - Token aleatorio de 256 bits en una cookie httpOnly, SameSite=Strict, Secure en
 *   producción y limitada a /admin; en la base solo su SHA-256.
 * - Etapas: pending_mfa / enrolling caducan en 10 min; active, a las 12 h o tras 2 h sin
 *   uso. Al pasar a active se emite un token nuevo (evita fijación de sesión).
 * - Revocar = borrar la fila: efecto inmediato.
 */
export type SessionStage = 'pending_mfa' | 'enrolling' | 'active';
export const COOKIE_NAME = process.env.SESSION_COOKIE_NAME?.trim() || 'pulsove_session';
const PENDING_MS = 10 * 60_000;
const ACTIVE_MS = 12 * 60 * 60_000;
const IDLE_MS = 2 * 60 * 60_000;
const TOUCH_EVERY_MS = 5 * 60_000;

export interface AdminSession {
  id: string;
  stage: SessionStage;
  user: { id: string; email: string; role: string; totpEnabled: boolean };
}

export async function requestIpHash(): Promise<string> {
  return hashIpPrefix(getClientIp({ headers: await headers() }));
}

async function setCookie(token: string, expiresAt: Date) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    expires: expiresAt,
  });
}

/** Crea una sesión nueva (y su cookie) en la etapa indicada. */
export async function createSession(userId: string, stage: SessionStage): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + (stage === 'active' ? ACTIVE_MS : PENDING_MS));
  const h = await headers();
  await db.insert(adminSessions).values({
    userId,
    tokenHash: sha256(token),
    stage,
    expiresAt,
    ipHash: hashIpPrefix(getClientIp({ headers: h })),
    userAgent: (h.get('user-agent') ?? '').slice(0, 160) || null,
  });
  await setCookie(token, expiresAt);
}

/** Sesión del navegador actual, o null si no hay, caducó o se revocó. Limpia caducadas. */
export async function getCurrentSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const now = new Date();
  const [row] = await db
    .select({
      id: adminSessions.id,
      stage: adminSessions.stage,
      lastSeenAt: adminSessions.lastSeenAt,
      userId: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      totpEnabledAt: users.totpEnabledAt,
    })
    .from(adminSessions)
    .innerJoin(users, eq(users.id, adminSessions.userId))
    .where(and(eq(adminSessions.tokenHash, sha256(token)), gt(adminSessions.expiresAt, now)))
    .limit(1);
  if (!row) return null;

  const idle = row.stage === 'active' && now.getTime() - row.lastSeenAt.getTime() > IDLE_MS;
  const notAdmin = row.status !== 'active' || (row.role !== 'admin' && row.role !== 'moderator');
  if (idle || notAdmin) {
    await db.delete(adminSessions).where(eq(adminSessions.id, row.id));
    return null;
  }
  if (now.getTime() - row.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
    await db.update(adminSessions).set({ lastSeenAt: now }).where(eq(adminSessions.id, row.id));
  }
  return {
    id: row.id,
    stage: row.stage as SessionStage,
    user: { id: row.userId, email: row.email, role: row.role, totpEnabled: row.totpEnabledAt !== null },
  };
}

/** Sustituye la sesión actual por una activa con token nuevo (tras el segundo factor). */
export async function promoteToActive(session: AdminSession): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.id, session.id));
  await createSession(session.user.id, 'active');
}

/** Cierra la sesión actual (fila y cookie). */
export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, sha256(token)));
  jar.set(COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/admin', maxAge: 0 });
}

export async function listActiveSessions(userId: string) {
  return db
    .select({
      id: adminSessions.id,
      createdAt: adminSessions.createdAt,
      lastSeenAt: adminSessions.lastSeenAt,
      expiresAt: adminSessions.expiresAt,
      userAgent: adminSessions.userAgent,
    })
    .from(adminSessions)
    .where(and(eq(adminSessions.userId, userId), eq(adminSessions.stage, 'active'), gt(adminSessions.expiresAt, new Date())));
}

export async function revokeSession(userId: string, sessionId: string): Promise<boolean> {
  const deleted = await db
    .delete(adminSessions)
    .where(and(eq(adminSessions.id, sessionId), eq(adminSessions.userId, userId)))
    .returning({ id: adminSessions.id });
  return deleted.length > 0;
}

/** Borra las sesiones caducadas (mantenimiento; también se ignoran al leer). */
export async function purgeExpiredSessions(): Promise<void> {
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
}
