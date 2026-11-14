/** Local-only guard for Drizzle's unversioned schema push.
 * Use db:migrate:deploy for remote/staging/production schema changes.
 */
import 'dotenv/config';
import { spawnSync } from 'node:child_process';

export function schemaPushBlockReason(env=process.env) {
  if (env.CI === 'true' || env.NODE_ENV === 'production' ||
      env.VERCEL_ENV === 'production' || env.DEPLOY_ENV === 'production' ||
      env.CF_PAGES_BRANCH === 'main') return 'entorno de CI o producción';
  if (typeof env.DATABASE_URL !== 'string' || !env.DATABASE_URL) return 'DATABASE_URL ausente';
  let url;
  try { url = new URL(env.DATABASE_URL); }
  catch { return 'DATABASE_URL no válida'; }
  if (!['postgres:','postgresql:'].includes(url.protocol)) return 'protocolo PostgreSQL no admitido';
  if (!['localhost','127.0.0.1','[::1]'].includes(url.hostname)) return 'solo se permite PostgreSQL local';
  if (!url.pathname || url.pathname === '/' || url.pathname.toLowerCase() === '/postgres' ||
      url.pathname.toLowerCase() === '/template0' || url.pathname.toLowerCase() === '/template1')
    return 'se requiere una base de desarrollo específica';
  if (url.searchParams.has('host') || url.searchParams.has('hostaddr'))
    return 'no se aceptan anulaciones de host mediante query params';
  return null;
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const reason = schemaPushBlockReason();
  if (reason) {
    console.error('db:migrate (drizzle-kit push) bloqueado: '+reason+'. Utiliza migraciones versionadas con db:migrate:deploy después de probar en entorno aislado.');
    process.exit(1);
  }
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result=spawnSync(cmd,['exec','--','drizzle-kit','push'],{stdio:'inherit',env:process.env});
  if(result.error){console.error('No pudo ejecutarse drizzle-kit push');process.exit(1);}
  process.exit(result.status ?? 1);
}
