import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentSession, type AdminSession } from './session';

/**
 * Capa de acceso del panel (guía de autenticación de Next 16): cada página y cada Server
 * Action de /admin llama a una de estas funciones; no basta con el layout, que no se
 * vuelve a ejecutar al navegar, y las Server Actions se pueden invocar con un POST directo.
 * `cache` evita repetir la consulta dentro de un mismo render.
 */
export const currentSession = cache(getCurrentSession);

/** Sesión activa (contraseña + segundo factor) o redirección a /admin/acceso. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await currentSession();
  if (!session) redirect('/admin/acceso');
  if (session.stage === 'pending_mfa') redirect('/admin/acceso/verificar');
  if (session.stage === 'enrolling') redirect('/admin/acceso/configurar-2fa');
  return session;
}

/** Sesión en una etapa intermedia concreta, o de vuelta al inicio del acceso. */
export async function requireStage(stage: 'pending_mfa' | 'enrolling'): Promise<AdminSession> {
  const session = await currentSession();
  if (!session) redirect('/admin/acceso');
  if (session.stage === 'active') redirect('/admin');
  if (session.stage !== stage) redirect('/admin/acceso');
  return session;
}
