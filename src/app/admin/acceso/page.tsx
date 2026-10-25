import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/AuthForms';
import { currentSession } from '@/lib/auth/dal';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Acceso' };

export default async function AdminLoginPage() {
  // Quien ya tiene sesión activa no necesita volver a entrar.
  if ((await currentSession())?.stage === 'active') redirect('/admin');
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Acceso al panel</h1>
      <p className="mt-2 text-sm text-ink-muted">Solo para el equipo de PulsoVE. No hay registro público.</p>
      <div className="mt-6 rounded-lg border border-border p-5">
        <LoginForm />
      </div>
    </div>
  );
}
