import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { EnrollForm } from '@/components/admin/AuthForms';
import { requireStage } from '@/lib/auth/dal';
import { decryptSecret } from '@/lib/auth/crypto';
import { otpauthUri } from '@/lib/auth/totp';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Configurar el segundo factor' };

export default async function EnrollPage() {
  const session = await requireStage('enrolling');
  const [u] = await db.select({ secret: users.totpSecretEnc }).from(users).where(eq(users.id, session.user.id)).limit(1);
  // El secreto lo generó loginAction al entrar; sin él hay que volver a empezar.
  if (!u?.secret) {
    return <p className="text-sm text-ink-muted">Vuelve a iniciar sesión para generar el código de alta.</p>;
  }
  const secret = decryptSecret(u.secret);
  const uri = otpauthUri(session.user.email, secret);
  // SVG generado por la librería `qrcode` a partir de nuestro propio URI.
  const qr = await QRCode.toString(uri, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Configura el segundo factor</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Es obligatorio para entrar al panel. Escanea el código con una app autenticadora (Google Authenticator, Authy,
        1Password…) y escribe el código de 6 dígitos que te muestre.
      </p>
      <div className="mt-6 grid gap-6 rounded-lg border border-border p-5 sm:grid-cols-[10rem_1fr]">
        <div className="mx-auto w-40 rounded-md bg-white p-2" aria-label="Código QR para la app autenticadora" role="img"
          dangerouslySetInnerHTML={{ __html: qr }} />
        <div className="space-y-4">
          <div>
            <p className="text-xs text-ink-muted">¿No puedes escanear? Escribe esta clave:</p>
            <p className="mt-1 break-all font-mono text-sm">{secret.match(/.{1,4}/g)?.join(' ')}</p>
          </div>
          <EnrollForm />
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-muted">
        Esta clave solo se muestra durante el alta (caduca a los 10 minutos). Si pierdes el teléfono, quien administre el
        servidor puede restablecer tu acceso con <code className="font-mono">npm run create-admin -- --reset</code>.
      </p>
    </div>
  );
}
