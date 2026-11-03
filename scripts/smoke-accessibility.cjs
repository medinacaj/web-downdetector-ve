// Comprobación local en Chromium/axe: no certifica WCAG ni sustituye lector de pantalla.
const {chromium}=require('playwright-core');
const AxeBuilder=require('@axe-core/playwright').default;
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const checks=[];
 try{
  for(const theme of ['light','dark'])for(const width of [320,1280]){
   const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme});
   await context.addInitScript(theme=>localStorage.setItem('pulsove-theme',theme),theme);
   const page=await context.newPage();
   for(const path of ['/','/servicios','/servicios/movistar','/mapa','/incidentes','/estadisticas','/metodologia']){
    const response=await page.goto((process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3010')+path);assert.equal(response.status(),200);
    assert.equal(await page.locator('main').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Overflow ${theme}/${width}/${path}`);
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    checks.push({theme,width,path,violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
   }
   await context.close();
  }
  fs.mkdirSync('.runtime',{recursive:true});
  fs.writeFileSync('.runtime/accessibility-results.json',JSON.stringify(checks,null,2));
  const bad=checks.filter(c=>c.violations.length);
  console.log('Escenarios comprobados:',checks.length,'con hallazgos:',bad.length);
  for(const c of bad.slice(0,5))console.log(JSON.stringify(c));
  if(bad.length)process.exitCode=1;
  const p=await browser.newPage();await p.goto((process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3010')+'/servicios/movistar');
  await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.textContent),'Saltar al contenido principal');
  await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>document.activeElement.id),'contenido-principal');
  console.log('Teclado: salto de contenido verificado.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
