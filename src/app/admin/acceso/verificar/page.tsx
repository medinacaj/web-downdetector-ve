import type { Metadata } from 'next';
import { VerifyCodeForm } from '@/components/admin/AuthForms';
import { requireStage } from '@/lib/auth/dal';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Verificación' };

export default async function VerifyPage() {
  await requireStage('pending_mfa');
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Segundo factor</h1>
      <p className="mt-2 text-sm text-ink-muted">Escribe el código que muestra tu app autenticadora.</p>
      <div className="mt-6 rounded-lg border border-border p-5">
        <VerifyCodeForm />
      </div>
    </div>
  );
}
