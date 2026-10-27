// Prueba del formulario en Chromium: proveedor y POST simulados, no valida Cloudflare real.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const page = await browser.newPage();
  await page.route('https://challenges.cloudflare.com/**', route => route.fulfill({contentType:'application/javascript',body:`window.turnstile={render(el,options){window.testChallenge=options;el.textContent='Desafío simulado';return 'widget-1'},remove(){window.testChallenge=null}};`}));
  let posts=0;
  await page.route('**/api/reports', async route => {
   const payload=route.request().postDataJSON();
   assert.equal(payload.turnstileToken,'simulated-token');
   posts++;
   await route.fulfill({status:posts===1?503:201,contentType:'application/json',body:JSON.stringify(posts===1?{error:{message:'Proveedor no disponible'}}:{data:{id:'simulated-report'}})});
  });
  await page.goto((process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3002') + '/servicios/movistar');
  await page.waitForFunction(()=>window.testChallenge);
  const submit=page.getByRole('button',{name:'Enviar reporte',exact:true});
  assert.equal(await submit.isDisabled(),true);
  await page.locator('input[type=checkbox]').check();
  assert.equal(await submit.isDisabled(),true);
  await page.evaluate(()=>window.testChallenge.callback('simulated-token'));
  await page.waitForFunction(()=>!document.querySelector('button[type=submit]').disabled);
  await page.evaluate(()=>window.testChallenge['expired-callback']());
  await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();
  assert.equal(await submit.isDisabled(),true);
  await page.getByRole('button',{name:'Reintentar',exact:true}).click();
  await page.waitForFunction(()=>window.testChallenge);
  await page.evaluate(()=>window.testChallenge.callback('simulated-token'));
  await submit.click();
  await page.getByText('Proveedor no disponible',{exact:true}).waitFor();
  assert.equal(await submit.isDisabled(),true);
  await page.waitForFunction(()=>window.testChallenge);
  await page.evaluate(()=>window.testChallenge.callback('simulated-token'));
  await submit.click();
  await page.getByText('Reporte enviado',{exact:true}).waitFor();
  assert.equal(posts,2);
  await page.getByRole('button',{name:'Enviar otro reporte',exact:true}).click();
  await page.waitForFunction(()=>window.testChallenge);
  assert.equal(await submit.isDisabled(),true);
  assert.equal(await page.evaluate(()=>window.testChallenge.action),'report');
  console.log('Browser OK: consentimiento, token obligatorio, expiración, reintento, fallo API, envío correcto y segundo reporte (proveedor/API simulados).');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
