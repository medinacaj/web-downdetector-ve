/** Synthetic PostgreSQL disaster-recovery rehearsal for a disposable GitHub Actions service.
 * Never accepts production credentials, remote hosts, or real user data.
 * All comparisons are content fingerprints; the CI logs contain no rows.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const url = new URL(process.env.DATABASE_URL || 'postgresql://invalid/');
const container = process.env.POSTGRES_CONTAINER_ID || '';
assert.equal(process.env.CI, 'true', 'CI=true required');
assert.equal(process.env.ALLOW_SYNTHETIC_RESTORE_TEST, '1', 'Explicit synthetic authorization required');
assert.equal(url.protocol, 'postgresql:', 'PostgreSQL required');
assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'Remote DB forbidden');
assert.equal(url.port, '5432', 'Expected isolated CI PostgreSQL port');
assert.equal(url.pathname, '/pulsove_ci', 'Refusing non-CI database');
assert.equal(decodeURIComponent(url.username), 'ci', 'Refusing non-CI role');
assert.match(container, /^[0-9a-f]{12,64}$/, 'Expected GitHub Actions PostgreSQL service container');

const nonce = randomBytes(6).toString('hex');
const restoredName = 'pulsove_ci_restore_' + nonce;
const dumpPath = '/tmp/pulsove-synthetic-' + nonce + '.dump';
let created = false;
function cmd(binary, ...args) {
  return execFileSync('docker', ['exec', container, binary, ...args], {
    encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}
function query(db, sql) {
  return cmd('psql', '-U', 'ci', '-d', db, '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', sql);
}
function tableNames(db) {
  return query(db, "SELECT table_schema || '.' || table_name FROM information_schema.tables WHERE table_schema IN ('public','drizzle') AND table_type='BASE TABLE' ORDER BY 1")
    .split('\n').filter(Boolean);
}
function quote(name) {
  assert.match(name, /^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Unexpected table identifier');
  return '"' + name + '"';
}
function fingerprint(db, table) {
  const [schema, name] = table.split('.');
  const qualified = quote(schema) + '.' + quote(name);
  const row = 'md5(row_to_json(t)::text)';
  return query(db, `SELECT count(*)::text || ':' || md5(COALESCE(string_agg(${row}, ',' ORDER BY ${row}), '')) FROM ${qualified} t`);
}

try {
  const originals = tableNames('pulsove_ci');
  assert.ok(originals.length >= 17, 'Migrated schema is unexpectedly incomplete');
  const essential = ['public.services', 'public.states', 'public.reports',
    'public.incidents', 'public.service_comments', 'drizzle.__drizzle_migrations'];
  for (const name of essential) assert.ok(originals.includes(name), 'Missing expected table: ' + name);

  // Ensures both nonempty catalogue and realistic synthetic citizen records are preserved.
  assert.ok(Number(query('pulsove_ci', 'SELECT count(*) FROM public.services')) > 0, 'Seed missing');
  assert.ok(Number(query('pulsove_ci', 'SELECT count(*) FROM public.reports')) > 0, 'Synthetic reports missing');

  cmd('pg_dump', '-U', 'ci', '-d', 'pulsove_ci', '--format=custom', '--no-owner', '--no-acl', '-f', dumpPath);
  cmd('pg_restore', '--list', dumpPath);
  cmd('createdb', '-U', 'ci', '-T', 'template0', restoredName);
  created = true;
  cmd('pg_restore', '-U', 'ci', '--exit-on-error', '--single-transaction', '--no-owner', '--no-acl',
    '-d', restoredName, dumpPath);
  const recovered = tableNames(restoredName);
  assert.deepEqual(recovered, originals, 'Restored table inventory differs from original');
  for (const table of originals) {
    assert.equal(fingerprint(restoredName, table), fingerprint('pulsove_ci', table),
      'Restored data fingerprint differs for ' + table);
  }
  console.log('Synthetic backup and restore verified: ' + originals.length + ' tables, including Drizzle history.');
} finally {
  if (created) {
    try { cmd('dropdb', '-U', 'ci', '--if-exists', '--force', restoredName); }
    catch { console.error('Could not remove isolated restore DB; runner cleanup will remove service'); }
  }
  try { cmd('rm', '-f', dumpPath); } catch {}
}
