// HTTP real con una base local temporal. Nunca modifica la base fuente.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const net = require('node:net');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const postgres = require('postgres');
const { validateSourceURL, cleanupResources } = require('./smoke-migrations.cjs');

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(0, '127.0.0.1', resolve); });
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}

async function main() {
  const source = validateSourceURL(process.env.DATABASE_URL || 'http://invalid');
  const adminUrl = new URL(source); adminUrl.pathname = '/postgres';
  const target = `pulsove_health_${crypto.randomBytes(6).toString('hex')}_test`;
  const fixtureUrl = new URL(source); fixtureUrl.pathname = '/' + target;
  const admin = postgres(adminUrl.href, { max: 1, onnotice: () => {} });
  let created = false, fixture, server, failed = false, failure;
  let output = '';
  const marker = 'PRIVATE_HTTP_FIXTURE_DO_NOT_LOG';
  try {
    await admin`create database ${admin(target)}`; created = true;
    fixture = postgres(fixtureUrl.href, { max: 1 });
    await fixture`create table services(id uuid primary key)`;
    const port = await freePort();
    const origin = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, [path.join(process.cwd(), '.next/standalone/server.js')], {
      env: { ...process.env, DATABASE_URL: fixtureUrl.href, PORT: String(port), HOSTNAME: '127.0.0.1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout.on('data', data => { output = (output + data).slice(-65536); });
    server.stderr.on('data', data => { output = (output + data).slice(-65536); });
    const responseFor = route => fetch(origin + route, { signal: AbortSignal.timeout(3500) });
    let started = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (server.exitCode !== null) throw new Error('El servidor temporal terminó antes de iniciar.');
      try { if ((await responseFor('/api/health/live')).status === 200) { started = true; break; } } catch { /* esperar startup */ }
      await delay(250);
    }
    assert.ok(started, 'El servidor temporal no respondió. Ejecuta npm run build antes del ensayo.');
    let response = await responseFor('/api/health');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { data: { status: 'ok' }, meta: null });
    // Esquema deliberadamente mínimo: /api/services falla y ejercita el logger real.
    response = await responseFor('/api/services?q=' + marker);
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.ok(body.error.details.reference);
    assert.ok(!JSON.stringify(body).includes(marker));
    await delay(50);
    assert.ok(output.includes(body.error.details.reference));
    assert.ok(!output.includes(marker), 'La excepción filtró parámetros a los logs.');
    assert.ok(!output.includes('Failed query:'), 'La excepción filtró SQL a los logs.');
    const worker = spawnSync(process.execPath, [path.join(process.cwd(), 'node_modules/tsx/dist/cli.mjs'), 'scripts/aggregate-cron.ts', '--completed'], {
      env: { ...process.env, DATABASE_URL: fixtureUrl.href }, encoding: 'utf8', timeout: 5000,
    });
    assert.equal(worker.status, 1, 'El worker debía fallar de forma controlada con el esquema mínimo.');
    const workerEvent = JSON.parse(worker.stderr.trim());
    assert.equal(workerEvent.event, 'worker.cycle_failed');
    assert.deepEqual(Object.keys(workerEvent).sort(), ['category', 'event', 'level', 'reference', 'timestamp']);
    assert.ok(!worker.stderr.includes('Failed query:'));
    await fixture`alter table services rename to services_unavailable`;
    await delay(5100);
    response = await responseFor('/api/health');
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { data: { status: 'unavailable' }, meta: null });
    assert.equal((await responseFor('/api/health/live')).status, 200);
    await fixture`alter table services_unavailable rename to services`;
    await delay(5100);
    assert.equal((await responseFor('/api/health')).status, 200);
    console.log('HTTP/worker verificados: salud 200→503→200, liveness independiente, no-store y errores sin SQL/parámetros.');
  } catch (error) { failed = true; failure = error; }
  finally {
    const errors = await cleanupResources([
      async () => {
        if (server && server.exitCode === null) {
          server.kill('SIGTERM');
          const stopped = await Promise.race([new Promise(resolve => server.once('exit', () => resolve(true))), delay(3000).then(() => false)]);
          if (!stopped) server.kill('SIGKILL');
        }
      },
      async () => { if (fixture) await fixture.end({timeout:2}); },
      async () => { if (created) await admin`drop database ${admin(target)} with (force)`; },
      () => admin.end(),
    ]);
    if (failed) throw failure;
    if (errors.length) throw new AggregateError(errors, 'Revisar limpieza del entorno temporal de salud.');
  }
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
