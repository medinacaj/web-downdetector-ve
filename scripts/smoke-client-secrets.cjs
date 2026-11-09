// Build aislado con canarios ficticios. No copiar .env ni modificar el build del usuario.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync, execFileSync } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const { validateSourceURL, cleanupResources } = require('./smoke-migrations.cjs');

function assertNoPrivateCanaries(content, canaries) {
  assert.ok(Buffer.isBuffer(content) || typeof content === 'string', 'Contenido no válido.');
  assert.ok(Array.isArray(canaries) && canaries.length > 0, 'No hay canarios configurados.');
  const text = content.toString();
  for (const { name, value } of canaries) {
    assert.ok(typeof name === 'string' && /^[A-Z_]+$/.test(name), 'Nombre de canario no válido.');
    assert.ok(typeof value === 'string' && value.length >= 8, 'Valor de canario no válido.');
    const variants = [value, encodeURIComponent(value), JSON.stringify(value).slice(1, -1), Buffer.from(value).toString('base64')];
    if (variants.some(variant => text.includes(variant))) throw new Error('Canario privado detectado: ' + name);
  }
}

function filesIn(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(folder, entry.name);
    assert.ok(!entry.isSymbolicLink(), 'No se admiten enlaces simbólicos en archivos públicos.');
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}
async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(0, '127.0.0.1', resolve); });
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}
async function stopServer(server) {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  const exited = new Promise(resolve => server.once('exit', resolve));
  server.kill('SIGTERM');
  await Promise.race([exited, delay(3000)]);
  if (server.exitCode === null && server.signalCode === null) {
    server.kill('SIGKILL');
    await Promise.race([exited, delay(3000)]);
  }
  assert.ok(server.exitCode !== null || server.signalCode !== null, 'El servidor temporal no terminó.');
}

async function main() {
  const root = process.cwd();
  const source = validateSourceURL(process.env.DATABASE_URL || 'http://invalid');
  const id = crypto.randomBytes(8).toString('hex');
  const out = path.join(root, '.runtime', 'client-secrets', id);
  fs.mkdirSync(out, { recursive: true });
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'pulsove-client-'));
  const target = `pulsove_client_${id}_test`;
  const fixtureURL = new URL(source); fixtureURL.pathname = '/' + target;
  const adminURL = new URL(source); adminURL.pathname = '/postgres';
  const admin = postgres(adminURL.href, { max: 1, connect_timeout: 5, onnotice: () => {} });
  const privateEnvironment = {
    DATABASE_URL: fixtureURL.href,
    ANONYMIZATION_SALT: 'PRIVATE_SALT_' + crypto.randomBytes(24).toString('hex'),
    JWT_SECRET: 'PRIVATE_JWT_' + crypto.randomBytes(24).toString('hex'),
    TURNSTILE_SECRET_KEY: 'PRIVATE_TURNSTILE_' + crypto.randomBytes(24).toString('hex'),
  };
  const redisPassword = 'PRIVATE_REDIS_' + crypto.randomBytes(24).toString('hex');
  privateEnvironment.REDIS_URL = `redis://:${redisPassword}@127.0.0.1:1`;
  const canaries = Object.entries(privateEnvironment).map(([name, value]) => ({ name, value }));
  canaries.push({ name: 'DATABASE_NAME', value: target }, { name: 'REDIS_PASSWORD', value: redisPassword });
  const publicSiteKey = 'PUBLIC_SITE_KEY_' + crypto.randomBytes(16).toString('hex');
  const env = { ...process.env, ...privateEnvironment, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1',
    ENABLE_TURNSTILE: 'true', TURNSTILE_SITE_KEY: publicSiteKey, ENABLE_TECHNICAL_CHECKS: 'false',
    TRUSTED_CLIENT_IP_HEADER: '', SITE_URL: 'https://bundle-fixture.example.invalid', PUBLIC_INDEXABLE: 'false' };
  const report = { runId: id, sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    startedAt: new Date().toISOString(), status: 'running', privateEnvironmentVariables: Object.keys(privateEnvironment),
    privateCanaries: canaries.map(c => c.name), representations: ['literal', 'URI component', 'JSON string', 'base64'],
    routes: [], artifactFiles: 0, artifactBytes: 0, servedStaticFiles: 0 };
  let stage = 'setup', fixture, server, created = false, failed = false;
  let serverLog = '';
  const save = () => fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
  const phase = name => { stage = name; console.log('client-secrets: ' + name); save(); };
  try {
    phase('copy_source');
    const sourceFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
    const digest = crypto.createHash('sha256');
    for (const relative of sourceFiles) {
      assert.ok(!path.isAbsolute(relative) && !relative.split('/').includes('..'), 'Ruta fuera del proyecto.');
      const original = path.join(root, relative);
      assert.ok(fs.lstatSync(original).isFile(), 'Se requiere un snapshot de archivos regulares.');
      assert.ok(!path.basename(relative).startsWith('.env') || relative === '.env.example', 'No copiar archivos de entorno privados.');
      const destination = path.join(project, relative);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(original, destination);
      digest.update(relative + '\0').update(fs.readFileSync(original)).update('\0');
    }
    report.sourceFiles = sourceFiles.length;
    report.sourceDigest = digest.digest('hex');
    phase('copy_dependencies');
    fs.cpSync(path.join(root, 'node_modules'), path.join(project, 'node_modules'), {
      recursive: true, verbatimSymlinks: true, mode: fs.constants.COPYFILE_FICLONE,
    });
    phase('create_fixture');
    await admin`create database ${admin(target)}`; created = true;
    fixture = postgres(fixtureURL.href, { max: 1, connect_timeout: 5, onnotice: () => {} });
    await migrate(drizzle(fixture), { migrationsFolder: path.join(project, 'drizzle') });
    const seed = spawnSync(process.execPath, [path.join(project, 'node_modules/tsx/dist/cli.mjs'), 'scripts/seed.ts'], {
      cwd: project, env, encoding: 'utf8', timeout: 60000, maxBuffer: 2 * 1024 * 1024,
    });
    fs.writeFileSync(path.join(out, 'seed.log'), (seed.stdout || '') + (seed.stderr || ''));
    assert.equal(seed.status, 0, 'No se pudo preparar el catálogo ficticio.');
    phase('build');
    const build = spawnSync(process.execPath, [path.join(project, 'node_modules/next/dist/bin/next'), 'build'], {
      cwd: project, env, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024,
    });
    fs.writeFileSync(path.join(out, 'build.log'), (build.stdout || '') + (build.stderr || ''));
    report.buildExitCode = build.status;
    assert.equal(build.status, 0, 'Falló el build aislado.');
    phase('inspect_artifacts');
    const staticRoot = path.join(project, '.next/static');
    const publicRoot = path.join(project, 'public');
    const assets = [staticRoot, publicRoot].flatMap(folder => filesIn(folder).map(file => ({ file, folder })));
    assert.ok(assets.length > 0, 'No se encontraron artefactos públicos para revisar.');
    for (const { file, folder } of assets) {
      const bytes = fs.readFileSync(file);
      assertNoPrivateCanaries(path.relative(folder, file), canaries);
      assertNoPrivateCanaries(bytes, canaries);
      report.artifactFiles++; report.artifactBytes += bytes.length;
    }
    // Control positivo fuera de archivos servidos: el detector debe fallar ante una fuga ficticia.
    assert.throws(() => assertNoPrivateCanaries('const leaked=' + privateEnvironment.JWT_SECRET, canaries), /JWT_SECRET/);
    report.positiveControlRejected = true;
    phase('http');
    const standalone = path.join(project, '.next/standalone');
    fs.cpSync(staticRoot, path.join(standalone, '.next/static'), { recursive: true });
    if (fs.existsSync(publicRoot)) fs.cpSync(publicRoot, path.join(standalone, 'public'), { recursive: true });
    const port = await freePort(), origin = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, [path.join(standalone, 'server.js')], {
      cwd: standalone, env: { ...env, HOSTNAME: '127.0.0.1', PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    for (const stream of [server.stdout, server.stderr]) stream.on('data', data => { serverLog = (serverLog + data).slice(-262144); });
    let ready = false;
    for (let i = 0; i < 40; i++) {
      assert.ok(server.exitCode === null && server.signalCode === null, 'Servidor temporal no disponible.');
      try { if ((await fetch(origin + '/api/health', { signal: AbortSignal.timeout(3000) })).status === 200) { ready = true; break; } }
      catch { /* esperar inicio */ }
      await delay(250);
    }
    assert.ok(ready, 'El servidor temporal no respondió.');
    async function inspect(route, status = 200, options = {}) {
      report.pendingRequest = { route, expectedStatus: status };
      const response = await fetch(origin + route, { ...options, redirect: 'manual', signal: AbortSignal.timeout(10000) });
      const bytes = Buffer.from(await response.arrayBuffer());
      report.pendingRequest.actualStatus = response.status;
      assert.equal(response.status, status, 'Estado HTTP inesperado en un escenario público.');
      assertNoPrivateCanaries(bytes, canaries);
      assertNoPrivateCanaries(JSON.stringify([...response.headers]), canaries);
      report.routes.push({ route, method: options.method || 'GET', rsc: options.headers?.RSC === '1', status: response.status });
      delete report.pendingRequest;
      return { response, bytes };
    }
    for (const route of ['/', '/servicios', '/mapa', '/estadisticas', '/incidentes', '/metodologia']) {
      const { bytes } = await inspect(route);
      assert.ok(bytes.includes('<html'), 'No se recibió el documento HTML.');
    }
    const service = await inspect('/servicios/movistar');
    report.htmlControl = { bytes: service.bytes.length, publicSiteKeySeen: service.bytes.includes(publicSiteKey),
      propNameSeen: service.bytes.includes('turnstileSiteKey') };
    fs.writeFileSync(path.join(out, 'service.html'), service.bytes);
    // Next 16 valida el hash RSC: sin otros headers de router, el valor esperado es vacío.
    const rsc = await inspect('/servicios/movistar?_rsc=', 200, { headers: { RSC: '1' } });
    report.rscControl = { bytes: rsc.bytes.length, publicSiteKeySeen: rsc.bytes.includes(publicSiteKey),
      propNameSeen: rsc.bytes.includes('turnstileSiteKey'), contentType: rsc.response.headers.get('content-type') };
    fs.writeFileSync(path.join(out, 'service.rsc'), rsc.bytes);
    assert.ok(service.bytes.includes(publicSiteKey), 'La clave pública de control no llegó al HTML/RSC inline.');
    assert.ok(rsc.response.headers.get('content-type')?.includes('text/x-component'), 'No se ejercitó el payload RSC.');
    assert.ok(rsc.bytes.includes(publicSiteKey), 'La clave pública no llegó al payload RSC.');
    report.publicSiteKeySeen = true;
    for (const route of ['/api/health', '/api/health/live', '/api/services?limit=20', '/api/services/movistar',
      '/api/services/movistar/status', '/api/services/movistar/reports', '/api/incidents', '/api/map', '/api/statistics']) {
      const { response, bytes } = await inspect(route);
      assert.ok(response.headers.get('content-type')?.includes('application/json'));
      assert.ok(Object.hasOwn(JSON.parse(bytes), 'data'), 'No se recibió el contrato JSON público.');
    }
    await inspect('/api/reports', 422, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      serviceSlug: 'movistar', issueTypeSlug: 'lentitud', stateCode: 'VE-M', deviceSeed: 'bundle_fixture_' + id,
    }) });
    for (const route of ['/.env', '/.env.local', '/.env.production', '/.git/config', '/package.json', '/next.config.mjs', '/_next/server/app/page.js']) {
      await inspect(route, 404);
    }
    for (const { file, folder } of assets) {
      const relative = path.relative(folder, file).split(path.sep).map(encodeURIComponent).join('/');
      const route = (folder === staticRoot ? '/_next/static/' : '/') + relative;
      const { bytes } = await inspect(route);
      assert.ok(bytes.equals(fs.readFileSync(file)), 'El recurso servido no coincide con el artefacto revisado.');
      report.servedStaticFiles++;
    }
    report.status = 'completed';
  } catch (error) {
    failed = true; report.status = 'failed'; report.failureStage = stage;
    report.failureCode = typeof error.code === 'string' ? error.code : 'harness_error';
    report.failureLine = error.stack?.match(/smoke-client-secrets\.cjs:(\d+)/)?.[1] || null;
  }
  finally {
    report.cleanup = {};
    const errors = await cleanupResources([
      async () => { await stopServer(server); report.cleanup.serverStopped = true; },
      async () => { if (fixture) await fixture.end({ timeout: 2 }); },
      async () => { if (created) await admin`drop database ${admin(target)} with(force)`; },
      async () => { report.cleanup.databaseAbsent = (await admin`select 1 from pg_database where datname=${target}`).length === 0; },
      () => admin.end({ timeout: 2 }),
      async () => { fs.rmSync(project, { recursive: true, force: true }); report.cleanup.projectRemoved = !fs.existsSync(project); },
      async () => fs.writeFileSync(path.join(out, 'server.log'), serverLog),
    ]);
    report.cleanup.errorCount = errors.length;
    if (errors.length || !report.cleanup.databaseAbsent || !report.cleanup.projectRemoved) { failed = true; report.status = 'failed'; }
    report.endedAt = new Date().toISOString();
    report.exitCode = failed ? 1 : 0;
    save();
    console.log('RESULTS_DIRECTORY=' + out);
    if (failed) throw new Error('Comprobación incompleta; fase: ' + stage + '. Consultar artefactos locales.');
  }
}
if (require.main === module) main().catch(() => { console.error('No se pudo completar la comprobación de secretos del cliente.'); process.exitCode = 1; });
module.exports = { assertNoPrivateCanaries };
