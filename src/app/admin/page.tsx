import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { auditLogs } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/dal';
import { listActiveSessions } from '@/lib/auth/session';
import { formatDateTime } from '@/lib/format';
import { logoutAction, revokeOtherSessionsAction, revokeSessionAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Panel' };

const ACTION_LABELS: Record<string, string> = {
  login_success: 'Inicio de sesión',
  login_password_ok: 'Contraseña correcta (faltaba el código)',
  login_failed: 'Intento de acceso fallido',
  login_rate_limited: 'Acceso bloqueado por demasiados intentos',
  mfa_failed: 'Código del segundo factor incorrecto',
  mfa_rate_limited: 'Código bloqueado por demasiados intentos',
  mfa_enrolled: 'Segundo factor activado',
  mfa_enroll_failed: 'Código de alta incorrecto',
  logout: 'Cierre de sesión',
  session_revoked: 'Sesión cerrada desde el panel',
  sessions_revoked_others: 'Cerradas las demás sesiones',
  admin_created: 'Cuenta creada',
  admin_reset: 'Acceso restablecido',
};

export default async function AdminHomePage() {
  const session = await requireAdmin();
  const [sessions, activity] = await Promise.all([
    listActiveSessions(session.user.id),
    db
      .select({ id: auditLogs.id, action: auditLogs.action, createdAt: auditLogs.createdAt })
      .from(auditLogs)
      .where(eq(auditLogs.userId, session.user.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(15),
  ]);
  const button = 'rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface';

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Panel de administración</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {session.user.email} · {session.user.role === 'admin' ? 'administración' : 'moderación'}
          </p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className={button}>
            Cerrar sesión
          </button>
        </form>
      </div>

      <section className="mt-10" aria-labelledby="sesiones">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="sesiones" className="font-display text-lg font-semibold">
            Sesiones abiertas
          </h2>
          {sessions.length > 1 && (
            <form action={revokeOtherSessionsAction}>
              <button type="submit" className={button}>
                Cerrar las demás
              </button>
            </form>
          )}
        </div>
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate">{s.userAgent ?? 'Navegador desconocido'}</p>
                <p className="text-ink-muted">
                  Desde {formatDateTime(s.createdAt)} · último uso {formatDateTime(s.lastSeenAt)} · caduca{' '}
                  {formatDateTime(s.expiresAt)}
                </p>
              </div>
              {s.id === session.id ? (
                <span className="text-xs text-ink-muted">Esta sesión</span>
              ) : (
                <form action={revokeSessionAction}>
                  <input type="hidden" name="sessionId" value={s.id} />
                  <button type="submit" className={button}>
                    Cerrar
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="actividad">
        <h2 id="actividad" className="font-display text-lg font-semibold">
          Actividad reciente de tu cuenta
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Del registro de auditoría. Si ves algo que no hiciste, cierra las demás sesiones.</p>
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {activity.map((a) => (
            <li key={a.id} className="flex flex-wrap justify-between gap-2 px-4 py-2 text-sm">
              <span>{ACTION_LABELS[a.action] ?? a.action}</span>
              <span className="text-ink-muted">{formatDateTime(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
