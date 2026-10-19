/**
 * Crea una cuenta del panel o restablece su acceso (Etapa 6). No hay registro público:
 * esta es la única forma de crear administradores, y requiere acceso al servidor.
 *
 *   npm run create-admin -- --email persona@dominio.org [--role admin|moderator]
 *   npm run create-admin -- --email persona@dominio.org --reset
 *
 * La contraseña se lee de la entrada estándar (o de ADMIN_PASSWORD), nunca de un
 * argumento: los argumentos quedan en el historial del shell y en la lista de procesos.
 *   printf '%s' 'contraseña-larga' | npm run create-admin -- --email …
 *
 * --reset: contraseña nueva, alta del segundo factor desde cero y cierre de todas las
 * sesiones (para quien perdió el teléfono). El segundo factor se configura al entrar.
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../src/lib/db/client';
import { adminSessions, users } from '../src/lib/db/schema';
import { hashPassword, passwordProblem } from '../src/lib/auth/password';
import { logAudit } from '../src/lib/audit';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : '';
}

async function readPassword(): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (process.stdin.isTTY) {
    throw new Error("Pasa la contraseña por la entrada estándar: printf '%s' 'contraseña' | npm run create-admin -- --email …");
  }
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data.replace(/\r?\n$/, '');
}

async function main() {
  const email = arg('email')?.trim().toLowerCase();
  const role = (arg('role') || 'admin') as 'admin' | 'moderator';
  const reset = process.argv.includes('--reset');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Falta --email con un correo válido.');
  if (role !== 'admin' && role !== 'moderator') throw new Error('--role debe ser admin o moderator.');

  const password = await readPassword();
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);
  const passwordHash = await hashPassword(password);

  const [existing] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.email, email)).limit(1);

  if (reset) {
    if (!existing || (existing.role !== 'admin' && existing.role !== 'moderator')) {
      throw new Error(`No hay ninguna cuenta del panel con el correo ${email}.`);
    }
    await db
      .update(users)
      .set({ passwordHash, totpSecretEnc: null, totpEnabledAt: null, totpLastStep: null, status: 'active' })
      .where(eq(users.id, existing.id));
    const closed = await db.delete(adminSessions).where(eq(adminSessions.userId, existing.id)).returning({ id: adminSessions.id });
    await logAudit({ userId: existing.id, action: 'admin_reset', entity: 'user', entityId: existing.id, after: { sessionsClosed: closed.length } });
    console.log(`✓ Acceso de ${email} restablecido: contraseña nueva, segundo factor pendiente de configurar y ${closed.length} sesión(es) cerradas.`);
    return;
  }

  if (existing) throw new Error(`Ya existe una cuenta con ${email}. Usa --reset para restablecer su acceso.`);
  const [created] = await db.insert(users).values({ email, passwordHash, role, status: 'active' }).returning({ id: users.id });
  await logAudit({ userId: created.id, action: 'admin_created', entity: 'user', entityId: created.id, after: { email, role } });
  console.log(`✓ Cuenta ${role === 'admin' ? 'de administración' : 'de moderación'} creada para ${email}. Configurará el segundo factor en su primer acceso a /admin.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`✗ ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  });
