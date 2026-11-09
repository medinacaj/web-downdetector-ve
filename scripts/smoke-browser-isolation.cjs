// Regresión real del guardia: dos servidores loopback, sin contacto con terceros.
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {forwardLocalRead}=require('./smoke-browsers.cjs');
(async()=>{
 let targetHits=0,browser;
 const target=http.createServer((_req,res)=>{targetHits++;res.end('synthetic redirect target');});
 await new Promise(resolve=>target.listen(0,'127.0.0.1',resolve));
 const other='http://127.0.0.1:'+target.address().port;
 const app=http.createServer((req,res)=>{if(req.url==='/jump'){res.writeHead(302,{location:other+'/marker'});res.end();}else{res.setHeader('Content-Type','text/html');res.end('<html><body><img src="/jump" alt="synthetic"></body></html>');}});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+app.address().port;
 const stats={redirectsBlocked:0,blockedByOrigin:0};
 try{
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.route('**/*',async route=>{if(new URL(route.request().url()).origin!==origin){stats.blockedByOrigin++;await route.abort();return;}await forwardLocalRead(route,stats);});
  const page=await context.newPage();await page.goto(origin,{waitUntil:'load'});
  console.log(JSON.stringify({targetHits,...stats}));
  assert.equal(targetHits,0,'El guardia permitió seguir una redirección a otro origen local.');
  assert.equal(stats.redirectsBlocked,1,'El control positivo no ejercitó la redirección.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>app.close(resolve));await new Promise(resolve=>target.close(resolve));}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
