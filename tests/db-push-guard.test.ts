import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { schemaPushBlockReason } from '../scripts/guard-local-db-push.mjs';

const local = { DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/pulsove_dev', NODE_ENV: 'development' };
describe('proteger drizzle-kit push frente a bases no locales', () => {
  it('admite explícitamente la base local de desarrollo', () => {
    expect(schemaPushBlockReason(local)).toBeNull();
    expect(schemaPushBlockReason({ ...local, DATABASE_URL: 'postgres://u:p@localhost:15432/testdb' })).toBeNull();
  });
  it('rechaza entornos de CI y producción aunque apunten a localhost', () => {
    for (const key of ['CI','NODE_ENV','VERCEL_ENV','DEPLOY_ENV','CF_PAGES_BRANCH']) {
      const value = key === 'CI' ? 'true' : key === 'CF_PAGES_BRANCH' ? 'main' : 'production';
      expect(schemaPushBlockReason({...local,[key]:value})).not.toBeNull();
    }
  });
  it('rechaza host remoto y query params que cambien el destino', () => {
    for (const url of [
      'postgresql://user:pass@prod.example.net/pulsove', 
      'postgresql://user:pass@localhost/postgres',
      'postgresql://user:pass@localhost/',
      'postgresql://user:pass@localhost/pulsove_dev?host=prod.example.net',
      'not-a-url',
      'sqlite://localhost/pulsove_dev',
    ]) expect(schemaPushBlockReason({...local,DATABASE_URL:url})).not.toBeNull();
  });
  it('no convierte credenciales o URLs faltantes en accesos permitidos', () => {
    expect(schemaPushBlockReason({NODE_ENV:'development'})).not.toBeNull();
  });
});

it('CLI refuses remote database URL before invoking the schema migration command', () => {
  const script=fileURLToPath(new URL('../scripts/guard-local-db-push.mjs', import.meta.url));
  const result=spawnSync(process.execPath,[script],{
    encoding:'utf8',timeout:5000,
    env:{...process.env,DATABASE_URL:'postgresql://notreal:never@prod.example.test/pulsove',CI:'false',NODE_ENV:'development',VERCEL_ENV:'development',DEPLOY_ENV:'development',CF_PAGES_BRANCH:'test'}
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('solo se permite PostgreSQL local');
  expect(result.stderr).not.toContain('notreal:never');
});
