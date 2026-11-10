const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

async function main() {
  const output = path.resolve('.runtime/pages-demo/out');
  const prefix = '/web-downdetector-ve';
  assert.ok(fs.existsSync(path.join(output, 'index.html')), 'Falta la exportación estática: ejecutar npm run build:demo');
  assert.ok(!fs.existsSync(path.join(output, 'api')), 'La demo no debe publicar endpoints');
  const missing = [], writes = [], errors = [];
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain' };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    if (!url.pathname.startsWith(prefix + '/')) { res.writeHead(404).end(); return; }
    let file = path.resolve(output, '.' + decodeURIComponent(url.pathname.slice(prefix.length)));
    if (file !== output && !file.startsWith(output + path.sep)) { res.writeHead(404).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { missing.push(url.pathname); res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(req.method === 'HEAD' ? undefined : fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    const { chromium } = require('playwright-core');
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
    const page = await context.newPage();
    const base = `http://127.0.0.1:${server.address().port}${prefix}`;
    page.on('request', req => { if (req.method() !== 'GET' && req.method() !== 'HEAD') writes.push(req.url()); });
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(base + '/');
    await page.getByRole('button', { name: 'Cambiar a modo oscuro' }).waitFor();
    assert.match(await page.getByRole('note').innerText(), /demo estática/i);
    assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
    await page.locator('#hero-search').fill('CANTV');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.getByText('1 servicios', { exact: true }).waitFor();
    await page.locator('main').getByRole('link', { name: /CANTV/ }).click();
    await page.getByRole('heading', { name: 'CANTV', exact: true }).waitFor();
    await page.reload();
    await page.getByRole('heading', { name: 'CANTV', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Cambiar a modo oscuro' }).click();
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('dark')), true);
    await page.getByLabel('Tipo de problema', { exact: true }).selectOption({ index: 0 });
    await page.getByLabel('Estado', { exact: true }).selectOption('VE-D');
    await page.getByRole('button', { name: 'Probar formulario' }).click();
    await page.getByRole('status').filter({ hasText: 'No se envió ni guardó' }).waitFor();
    assert.equal(await page.getByText('Reporte enviado', { exact: true }).count(), 0);
    for (const route of ['mapa', 'estadisticas', 'incidentes', 'metodologia', 'servicios/servicio-demo']) {
      await page.goto(`${base}/${route}/`);
      assert.equal(await page.locator('main h1').count(), 1, route);
      await page.getByRole('note').waitFor();
    }
    await page.goto(base + '/servicios/');
    await page.locator('#category').selectOption('banca-y-pagos');
    await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
    assert.ok(await page.locator('main li').count() > 0, 'El filtro de banca debe contener servicios');
    assert.equal(await page.locator('main li').filter({ hasText: 'Telecomunicaciones' }).count(), 0);
    await page.locator('#q').fill('sin-coincidencias-de-demo-123');
    await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
    await page.getByText('Ningún servicio coincide con estos filtros.').waitFor();
    await page.goBack();
    await page.locator('main li').first().waitFor();
    assert.equal(await page.locator('#q').inputValue(), '', 'Atrás debe restaurar los filtros previos');
    assert.equal(await page.locator('#category').inputValue(), 'banca-y-pagos');
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    const noScriptPage = await noScript.newPage();
    const exposed = [];
    noScriptPage.on('request', req => { if (req.url().includes('STATIC_DEMO_PRIVATE_CANARY')) exposed.push(req.url()); });
    await noScriptPage.goto(base + '/servicios/cantv/');
    await noScriptPage.getByLabel('Comentario', { exact: false }).fill('STATIC_DEMO_PRIVATE_CANARY');
    await noScriptPage.getByRole('button', { name: 'Probar formulario' }).click();
    await noScriptPage.waitForLoadState('networkidle');
    assert.deepEqual(exposed, [], 'Sin JavaScript el formulario tampoco debe transmitir valores por GET');
    await noScript.close();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Desbordamiento horizontal móvil');
    const links = await page.locator('a[href^="/"]').evaluateAll(nodes => nodes.map(a => a.getAttribute('href')));
    assert.ok(links.every(href => href.startsWith(prefix + '/')), JSON.stringify(links));
    fs.mkdirSync('.runtime/pages-evidence', { recursive: true });
    await page.screenshot({ path: '.runtime/pages-evidence/movil.png', fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: '.runtime/pages-evidence/inicio.png', fullPage: true });
    assert.deepEqual(writes, [], 'La demo no debe realizar escrituras HTTP');
    assert.deepEqual(errors, [], 'Errores de navegador');
    assert.deepEqual(missing, [], 'Recursos estáticos ausentes');
    const result = { navigation: true, directReload: true, searchAndFilters: true, historyBack: true, theme: true, mobile: true, noIndex: true, noHttpWrites: true, noScriptFormDoesNotTransmit: true, noBrowserErrors: true };
    fs.writeFileSync('.runtime/pages-evidence/result.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
