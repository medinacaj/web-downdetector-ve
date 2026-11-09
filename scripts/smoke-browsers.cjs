// Solo loopback con datos ficticios. Las escrituras se interceptan en el navegador.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

function localOrigin(input) {
  const url = new URL(input);
  assert.ok(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname), 'Requiere HTTP local.');
  assert.ok(!url.username && !url.password && url.pathname === '/' && !url.search && !url.hash, 'Usar únicamente un origen local.');
  return url.origin;
}
function selectedEngines(input = 'chromium,firefox,webkit') {
  const names = [...new Set(input.split(',').map(name => name.trim()))];
  assert.ok(names.length && names.every(name => ['chromium', 'firefox', 'webkit'].includes(name)), 'Selección de motores no válida.');
  return names;
}
async function forwardLocalRead(route, result) {
  // Playwright aplica routing solo a la primera URL de una cadena de redirecciones.
  const response = await route.fetch({ maxRedirects: 0 });
  if ([301, 302, 303, 307, 308].includes(response.status())) {
    result.redirectsBlocked++;
    await route.abort();
    return;
  }
  await route.fulfill({ response });
}

async function main() {
  const origin = localOrigin(process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3010');
  const requested = selectedEngines(process.env.BROWSER_ENGINES);
  const id = crypto.randomBytes(8).toString('hex');
  const out = path.join(process.cwd(), '.runtime', 'browser-checks', id);
  fs.mkdirSync(out, { recursive: true });
  const report = { runId: id, sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    startedAt: new Date().toISOString(), requested, origin, engines: [], status: 'running',
    limits: ['UI con respuestas POST simuladas; no prueba envío real', 'Solo perfiles y motores ejecutados; no Safari/iOS/Edge reales', 'axe no acredita WCAG completa'] };
  const save = () => fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
  save();
  try {
    const pw = require('playwright-core');
    const AxeBuilder = require('@axe-core/playwright').default;
    report.playwright = require('playwright-core/package.json').version;
    for (const name of requested) {
      const result = { name, status: 'running', pages: [], interactions: [], pageErrors: [], hydrationErrors: [], externalRequestsBlocked: 0, unexpectedWritesBlocked: 0, redirectsBlocked: 0, routingErrors: 0 };
      report.engines.push(result); save();
      const executablePath = process.env[name.toUpperCase() + '_PATH'] || (name === 'chromium' ? '/usr/bin/chromium' : pw[name].executablePath());
      if (!fs.existsSync(executablePath)) {
        result.status = 'unavailable'; result.reason = 'browser_binary_missing'; save(); continue;
      }
      let browser;
      try {
        browser = await pw[name].launch({ executablePath, headless: true, ...(name === 'chromium' ? { args: ['--no-sandbox'] } : {}) });
        result.version = browser.version();
        for (const theme of ['light', 'dark']) for (const width of [320, 1280]) {
          const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, serviceWorkers: 'block' });
          let mode = 'forbid', posts = 0, invalidPayloads = 0, closing = false;
          try {
            await context.addInitScript(theme => { if (!localStorage.getItem('pulsove-theme')) localStorage.setItem('pulsove-theme', theme); }, theme);
            await context.route('**/*', async route => {
              try {
              const request = route.request();
              const url = new URL(request.url());
              if (url.origin !== origin) { result.externalRequestsBlocked++; await route.abort(); return; }
              if (request.method() === 'POST' && url.pathname === '/api/reports' && mode !== 'forbid') {
                posts++;
                let body;
                try { body = request.postDataJSON(); } catch { invalidPayloads++; }
                if (!body || body.serviceSlug !== 'movistar' || body.issueTypeSlug !== 'lentitud' || body.stateCode !== 'VE-M' || typeof body.deviceSeed !== 'string') invalidPayloads++;
                if (mode === 'offline') { await route.abort('failed'); return; }
                await route.fulfill({ status: mode === 'success' ? 201 : 429, contentType: 'application/json',
                  body: JSON.stringify(mode === 'success' ? { data: { id: 'synthetic-browser-response' } } : { error: { code: 'rate_limited' } }) });
                return;
              }
              if (!['GET', 'HEAD'].includes(request.method())) { result.unexpectedWritesBlocked++; await route.abort(); return; }
              await forwardLocalRead(route, result);
              } catch {
                // El prefetch puede seguir pendiente al cerrar el contexto. Mantener las rutas
                // instaladas hasta el cierre evita una ventana de tráfico sin guardia.
                if (!closing) { result.routingErrors++; await route.abort().catch(() => {}); }
              }
            });
            const page = await context.newPage();
            page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(15000);
            page.on('pageerror', error => result.pageErrors.push(error.message.slice(0, 400)));
            page.on('console', message => {
              if (message.type() === 'error' && /hydration|Minified React error/i.test(message.text())) result.hydrationErrors.push(message.text().slice(0, 400));
            });
            async function visit(route) {
              const response = await page.goto(origin + route, { waitUntil: 'load' });
              assert.equal(response.status(), 200, 'Navegación sin respuesta 200.');
              await page.getByRole('button', { name: /Cambiar a modo/ }).waitFor();
              await page.evaluate(() => document.fonts.ready.then(() => true));
            }
            for (const route of ['/', '/servicios', '/servicios/movistar', '/mapa', '/incidentes', '/estadisticas', '/metodologia']) {
              await visit(route);
              assert.equal(await page.locator('main').count(), 1);
              assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Desbordamiento horizontal de página.');
              assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), theme === 'dark');
              const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
              const violations = a11y.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
              result.pages.push({ route, theme, width, status: 200, overflow: false, violations });
              assert.equal(violations.length, 0, 'Hallazgos automáticos de accesibilidad.');
              if (route === '/servicios/movistar') await page.screenshot({ path: path.join(out, `${name}-${theme}-${width}.png`), fullPage: true });
            }
            const interaction = { theme, width };
            result.interactions.push(interaction);
            await visit('/servicios/movistar');
            await page.keyboard.press('Tab');
            assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Saltar al contenido principal');
            await page.keyboard.press('Enter');
            assert.equal(await page.evaluate(() => document.activeElement.id), 'contenido-principal');
            interaction.keyboardSkip = true;
            await page.getByRole('button', { name: /Cambiar a modo/ }).click();
            assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), theme !== 'dark');
            await page.reload();
            await page.getByRole('button', { name: /Cambiar a modo/ }).waitFor();
            assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), theme !== 'dark');
            await page.getByRole('button', { name: /Cambiar a modo/ }).click();
            interaction.themeTogglePersisted = true;
            await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Servicios', exact: true }).click();
            await page.waitForURL(url => url.pathname === '/servicios');
            await page.getByLabel('Buscar', { exact: true }).fill('Movistar');
            await page.getByLabel('Categoría', { exact: true }).selectOption('telecomunicaciones');
            await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
            await page.waitForURL(url => url.searchParams.get('q') === 'Movistar' && url.searchParams.get('category') === 'telecomunicaciones');
            assert.ok(await page.locator('main a[href="/servicios/movistar"]').count() > 0);
            interaction.navigationSearchCategory = true;
            for (const scenario of ['success', 'rate_limited', 'offline']) {
              mode = scenario;
              await visit('/servicios/movistar');
              const send = page.getByRole('button', { name: 'Enviar reporte', exact: true });
              assert.equal(await send.isDisabled(), true, 'El consentimiento debe ser obligatorio.');
              await page.getByLabel('Tipo de problema', { exact: true }).selectOption('lentitud');
              await page.getByLabel('Estado', { exact: true }).selectOption('VE-M');
              await page.getByRole('checkbox').check();
              await send.click();
              if (scenario === 'success') await page.getByRole('status').getByText('Reporte enviado', { exact: true }).waitFor();
              else await page.getByRole('alert').filter({ hasText: scenario === 'offline' ? 'No se pudo conectar' : 'Ya enviaste varios reportes' }).waitFor();
              interaction[scenario] = true;
            }
            mode = 'forbid';
            assert.equal(posts, 3); assert.equal(invalidPayloads, 0);
            interaction.interceptedPostRequests = posts;
          } finally { closing = true; await context.close(); }
        }
        assert.equal(result.pageErrors.length, 0, 'Errores JavaScript no controlados.');
        assert.equal(result.hydrationErrors.length, 0, 'Errores de hidratación.');
        assert.equal(result.unexpectedWritesBlocked, 0, 'Se intentó una escritura fuera de los mocks previstos.');
        assert.equal(result.redirectsBlocked, 0, 'Se bloqueó una redirección no prevista por el ensayo.');
        assert.equal(result.routingErrors, 0, 'Falló el guardia de una petición mientras el contexto estaba activo.');
        assert.equal(result.pages.length, 28); assert.equal(result.interactions.length, 4);
        result.status = 'passed';
      } catch (error) { result.status = 'failed'; result.reason = error.message.slice(0, 500); }
      finally { if (browser) await browser.close(); save(); }
    }
    report.status = report.engines.some(e => e.status === 'failed') ? 'failed' : report.engines.every(e => e.status === 'passed') ? 'completed' : 'incomplete';
  } catch { report.status = 'failed'; report.reason = 'Verificar dependencias opcionales Playwright/axe.'; }
  finally {
    report.endedAt = new Date().toISOString(); save(); console.log('BROWSER_RESULTS_DIRECTORY=' + out);
    if (report.status !== 'completed') process.exitCode = 1;
  }
}
if (require.main === module) main().catch(() => { console.error('No se pudo iniciar el ensayo de navegadores.'); process.exitCode = 1; });
module.exports = { localOrigin, selectedEngines, forwardLocalRead };
