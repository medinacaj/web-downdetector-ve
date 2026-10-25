'use server';

import { redirect } from 'next/navigation';
import { and, eq, inArray, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { adminSessions, users } from '@/lib/db/schema';
import { logAudit } from '@/lib/audit';
import { checkRateLimit, peekRateLimit, resetRateLimit } from '@/lib/security/rate-limit';
import { verifyPassword } from '@/lib/auth/password';
import { generateTotpSecret, verifyTotp } from '@/lib/auth/totp';
import { decryptSecret, encryptSecret, sha256 } from '@/lib/auth/crypto';
import { createSession, destroyCurrentSession, promoteToActive, requestIp, requestIpHash, revokeSession } from '@/lib/auth/session';
import { currentSession, requireAdmin, requireStage } from '@/lib/auth/dal';

/**
 * Server Actions del panel. Cada una comprueba su propia autorización (se pueden invocar
 * con un POST directo). Mensajes genéricos: nunca se revela si un correo existe.
 */
export interface FormState {
  error: string | null;
  /** Correo ya escrito, para no tener que repetirlo tras un error. */
  email?: string;
}

const ATTEMPTS = 5;
const LOGIN_WINDOW_S = 15 * 60;
const CODE_WINDOW_S = 10 * 60;
const BAD_CREDENTIALS = 'Correo o contraseña incorrectos.';
const TOO_MANY = 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(200),
});

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: form.get('email'), password: form.get('password') });
  const typedEmail = String(form.get('email') ?? '').slice(0, 255);
  if (!parsed.success) return { error: BAD_CREDENTIALS, email: typedEmail };
  const { email, password } = parsed.data;
  const { hash: ipHash, known: ipKnown } = await requestIp();

  // Límites por correo y por prefijo de IP (frenan la fuerza bruta contra una cuenta y el
  // barrido de muchas cuentas desde una red). Solo cuentan los fallos; mientras el límite
  // esté agotado ni siquiera se comprueba la contraseña. El de IP solo con una IP
  // atribuible (TRUSTED_CLIENT_IP_HEADER): sin ella sería un cubo común y 20 fallos de
  // cualquiera bloquearían el acceso de todos.
  const emailKey = `admin-login:email:${sha256(email)}`;
  const ipKey = ipKnown ? `admin-login:ip:${ipHash}` : null;
  if ((await peekRateLimit(emailKey, ATTEMPTS)) || (ipKey && (await peekRateLimit(ipKey, ATTEMPTS * 4)))) {
    await logAudit({ userId: null, action: 'login_rate_limited', entity: 'admin_session', ipHash });
    return { error: TOO_MANY, email: typedEmail };
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash, totpEnabledAt: users.totpEnabledAt })
    .from(users)
    .where(and(eq(users.email, email), eq(users.status, 'active'), inArray(users.role, ['admin', 'moderator'])))
    .limit(1);

  const ok = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !ok) {
    await Promise.all([
      checkRateLimit(emailKey, ATTEMPTS, LOGIN_WINDOW_S),
      ipKey ? checkRateLimit(ipKey, ATTEMPTS * 4, LOGIN_WINDOW_S) : null,
    ]);
    await logAudit({ userId: user?.id ?? null, action: 'login_failed', entity: 'admin_session', ipHash });
    return { error: BAD_CREDENTIALS, email: typedEmail };
  }
  await resetRateLimit(emailKey);

  // Alta del segundo factor pendiente: secreto nuevo en cada intento de alta (solo se
  // muestra durante esa sesión de 10 min). Se genera aquí, no al cargar la página.
  if (!user.totpEnabledAt) {
    await db
      .update(users)
      .set({ totpSecretEnc: encryptSecret(generateTotpSecret()), totpLastStep: null })
      .where(eq(users.id, user.id));
  }
  await createSession(user.id, user.totpEnabledAt ? 'pending_mfa' : 'enrolling');
  await logAudit({ userId: user.id, action: 'login_password_ok', entity: 'admin_session', ipHash });
  redirect(user.totpEnabledAt ? '/admin/acceso/verificar' : '/admin/acceso/configurar-2fa');
}

const codeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/) });
const BAD_CODE = 'Código incorrecto o caducado. Usa el código actual de tu app autenticadora.';

/** Comprueba el código TOTP contra el secreto guardado; marca el paso como usado. */
async function acceptCode(userId: string, code: string): Promise<boolean> {
  const [u] = await db
    .select({ secret: users.totpSecretEnc, lastStep: users.totpLastStep })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u?.secret) return false;
  const step = verifyTotp(decryptSecret(u.secret), code);
  // Anti-repetición: un código ya aceptado (o uno anterior) no vale otra vez.
  if (step === null || (u.lastStep !== null && step <= u.lastStep)) return false;
  await db.update(users).set({ totpLastStep: step }).where(eq(users.id, userId));
  return true;
}

export async function verifyCodeAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireStage('pending_mfa');
  const ipHash = await requestIpHash();
  const codeKey = `admin-code:${session.id}`;
  if (await peekRateLimit(codeKey, ATTEMPTS)) {
    await logAudit({ userId: session.user.id, action: 'mfa_rate_limited', entity: 'admin_session', ipHash });
    return { error: TOO_MANY };
  }
  const parsed = codeSchema.safeParse({ code: form.get('code') });
  if (!parsed.success || !(await acceptCode(session.user.id, parsed.data.code))) {
    await checkRateLimit(codeKey, ATTEMPTS, CODE_WINDOW_S);
    await logAudit({ userId: session.user.id, action: 'mfa_failed', entity: 'admin_session', ipHash });
    return { error: BAD_CODE };
  }
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, session.user.id));
  await promoteToActive(session);
  await logAudit({ userId: session.user.id, action: 'login_success', entity: 'admin_session', ipHash });
  redirect('/admin');
}

export async function confirmEnrollmentAction(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireStage('enrolling');
  const ipHash = await requestIpHash();
  const codeKey = `admin-code:${session.id}`;
  if (await peekRateLimit(codeKey, ATTEMPTS)) return { error: TOO_MANY };
  const parsed = codeSchema.safeParse({ code: form.get('code') });
  if (!parsed.success || !(await acceptCode(session.user.id, parsed.data.code))) {
    await checkRateLimit(codeKey, ATTEMPTS, CODE_WINDOW_S);
    await logAudit({ userId: session.user.id, action: 'mfa_enroll_failed', entity: 'user', entityId: session.user.id, ipHash });
    return { error: BAD_CODE };
  }
  await db.update(users).set({ totpEnabledAt: new Date(), lastLoginAt: new Date() }).where(eq(users.id, session.user.id));
  await promoteToActive(session);
  await logAudit({ userId: session.user.id, action: 'mfa_enrolled', entity: 'user', entityId: session.user.id, ipHash });
  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  const session = await currentSession();
  await destroyCurrentSession();
  if (session) await logAudit({ userId: session.user.id, action: 'logout', entity: 'admin_session', ipHash: await requestIpHash() });
  redirect('/admin/acceso');
}

const idSchema = z.string().uuid();

export async function revokeSessionAction(form: FormData): Promise<void> {
  const session = await requireAdmin();
  const id = idSchema.safeParse(form.get('sessionId'));
  if (id.success && id.data !== session.id && (await revokeSession(session.user.id, id.data))) {
    await logAudit({ userId: session.user.id, action: 'session_revoked', entity: 'admin_session', entityId: id.data, ipHash: await requestIpHash() });
  }
  redirect('/admin');
}

export async function revokeOtherSessionsAction(): Promise<void> {
  const session = await requireAdmin();
  const deleted = await db
    .delete(adminSessions)
    .where(and(eq(adminSessions.userId, session.user.id), ne(adminSessions.id, session.id)))
    .returning({ id: adminSessions.id });
  await logAudit({
    userId: session.user.id,
    action: 'sessions_revoked_others',
    entity: 'admin_session',
    after: { count: deleted.length },
    ipHash: await requestIpHash(),
  });
  redirect('/admin');
}
