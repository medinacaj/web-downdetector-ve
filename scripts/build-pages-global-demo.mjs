/**
 * Public GitHub Pages preview generated from the same reviewed seed catalog.
 * This is NOT the live incident system: no user reports, API calls or simulated outages.
 * Run with: npx tsx scripts/build-pages-global-demo.mjs
 */
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { servicesSeed } from '../src/lib/db/seed-data/services.ts';
import { categoriesSeed } from '../src/lib/db/seed-data/categories.ts';
import { issueTypesSeed } from '../src/lib/db/seed-data/issue-types.ts';
import { statesSeed } from '../src/lib/db/seed-data/states.ts';
import { HOME_SERVICE_SLUGS, WORLDWIDE_SPOTLIGHT } from '../src/lib/queries/home-trends.ts';
import { HOME_BRAND_LOGOS, logoForService } from '../src/lib/brand-logos.ts';
import { MICROSOFT_FEEDS } from '../src/lib/official-status/microsoft-rss.ts';

const BASE='/web-downdetector-ve';
const OUTPUT='pages-global-demo';
const escape=(v)=>String(v).replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const categoryNames=new Map(categoriesSeed.map((c)=>[c.slug,c.name]));
const catalog=servicesSeed.map((s)=>({
  slug:s.slug,name:s.name,categorySlug:s.categorySlug,
  categoryName:categoryNames.get(s.categorySlug)||s.categorySlug,
  description:s.description,logo:logoForService(s.slug)
}));
const bySlug=new Map(catalog.map((s)=>[s.slug,s]));
if(catalog.length<140||new Set(catalog.map((s)=>s.slug)).size!==catalog.length)
  throw Error('Global catalogue is missing or contains duplicate services');
for(const slug of ['cloudflare','gmail','outlook','fortnite'])if(!bySlug.has(slug))throw Error('Missing '+slug);

const CSS=[
':root{color-scheme:light;--bg:#090d13;--card:#fff;--ink:#172033;--muted:#64748b;--cyan:#00c2a8}',
'*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font:15px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e8edf5;background:var(--bg)}',
'a{color:inherit;text-decoration:none}button,input,select{font:inherit}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--cyan);outline-offset:3px}',
'.wrap{max-width:1180px;margin:auto;padding:0 18px}.top{position:sticky;top:0;z-index:20;background:rgba(9,13,19,.96);border-bottom:1px solid #334155;backdrop-filter:blur(8px)}',
'.nav{min-height:70px;display:flex;align-items:center;gap:20px;flex-wrap:wrap}.brand{font-size:24px;font-weight:900;letter-spacing:-.6px}.brand span{color:var(--cyan)}.navlinks{display:flex;gap:16px;font-size:14px;color:#cbd5e1;margin-left:auto}',
'.banner{background:#193342;border-bottom:1px solid #286575;color:#e6fbff;padding:11px 0;font-size:13px;text-align:center}',
'.hero{padding:52px 0 26px}.eyebrow{text-transform:uppercase;letter-spacing:.2em;color:var(--cyan);font-size:11px;font-weight:800}.hero h1{max-width:750px;font-size:clamp(30px,5vw,52px);line-height:1.1;margin:8px 0 14px;letter-spacing:-1px}.hero p{color:#acbdd1;max-width:760px}',
'.stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}.stat{border:1px solid #294458;background:#11202d;border-radius:12px;padding:12px 16px;min-width:130px}.stat strong{display:block;font-size:22px}.stat small{font-size:11px;color:#b7cad8}',
'.filters{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:22px 0}.input{background:#fff;color:#172033;border:0;border-radius:12px;min-height:44px;padding:10px 14px;min-width:210px;flex:1;max-width:600px}.chip{display:inline-block;background:#192a38;border:1px solid #385368;color:#eff8fd;border-radius:999px;padding:7px 12px;font-size:12px}.chip:hover{border-color:var(--cyan)}',
'.group{padding:18px 0 26px;scroll-margin-top:96px}.section-title{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 4px}.section-title h2{font-size:clamp(20px,3vw,27px);line-height:1.2;margin:0}.section-title a{color:#70e7d4;font-size:13px}.hint{font-size:13px;color:#a8b9ce;margin:0 0 16px}',
'.cards{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.card{position:relative;min-width:0;background:var(--card);color:var(--ink);border-radius:18px;box-shadow:0 5px 15px #0003;overflow:hidden}.card:hover{box-shadow:0 9px 25px #0005}',
'.card-link{display:flex;flex-direction:column;min-height:240px;padding:14px 13px 12px;padding-right:40px}.name{font-size:clamp(13px,1.9vw,17px);font-weight:750;line-height:1.25;min-height:34px;overflow-wrap:anywhere}.category{font-size:10px;color:#64748b;margin-top:4px;line-height:1.3}',
'.logo-area{flex:1;min-height:93px;display:flex;justify-content:center;align-items:center;padding:14px 0}.logo{display:block;max-width:100%;width:145px;height:75px;object-fit:contain}.monogram{border-radius:17px;background:#dceef3;color:#14546a;font-weight:800;letter-spacing:-1px;font-size:26px;width:70px;height:70px;display:grid;place-items:center}',
'.logo[hidden],.monogram[hidden]{display:none!important}',
'.signal{color:#64748b;font-size:10px;line-height:1.3;border-top:1px solid #e2e8f0;padding-top:8px}.dashed{height:17px;border-bottom:2px dashed #9caec1;margin:4px 0 8px}.notice{font-size:10px;color:#59677a}',
'.star{position:absolute;right:8px;top:8px;z-index:3;background:#eef8ff;color:#028bd1;border:1px solid #d4ecfa;width:35px;height:35px;border-radius:50%;cursor:pointer;font-size:22px;line-height:1}.star[aria-pressed=true]{color:#005a98;background:#d0efff}',
'.report-quick{display:flex;justify-content:center;align-items:center;width:calc(100% - 20px);margin:0 10px 10px;min-height:40px;background:#0d7378;border:0;border-radius:9px;color:#fff;font-weight:750;font-size:12px;cursor:pointer}.report-quick:hover{background:#07565c}',
'.report-dialog{border:0;border-radius:17px;padding:22px;width:min(92vw,470px);max-height:85vh;overflow:auto;color:#172033;background:#fff;box-shadow:0 20px 70px #0008}.report-dialog::backdrop{background:#060f1dc9}',
'.report-dialog h2{font-size:22px;margin:0 0 9px}.report-dialog p{font-size:13px;color:#475569}.report-dialog label{display:block;font-size:13px;font-weight:650;margin-top:13px}',
'.report-dialog select{display:block;width:100%;min-height:44px;padding:8px;border:1px solid #94a3b8;border-radius:9px;background:#fff;color:#172033;margin-top:5px}',
'.report-dialog .check{display:flex;align-items:flex-start;gap:9px;font-weight:450}.report-dialog .check input{margin-top:4px}.report-dialog .buttons{display:flex;gap:10px;margin-top:20px}',
'.report-dialog .buttons button{flex:1;min-height:44px;padding:8px;border-radius:9px;border:1px solid #94a3b8;background:#fff;color:#172033;cursor:pointer}.report-dialog .buttons button[type=submit]{background:#08767a;color:#fff;border-color:#08767a}',
'.report-dialog .report-feedback{color:#07565c;font-weight:650;margin-top:12px}',
'.directory{padding-bottom:70px}.filterbar{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0}.filterbar select{min-height:44px;border:0;border-radius:12px;padding:8px 12px;background:#fff;color:#172033;flex:1;max-width:330px}.result{color:#a7c1ce;font-size:13px}',
'.footer{border-top:1px solid #233647;padding:34px 0 50px;color:#a8b9ce;font-size:12px;margin-top:20px}.credits{max-width:850px;padding:30px 0 70px}.credits a{color:#70e7d4;text-decoration:underline}',
'.legal{border-radius:14px;border:1px solid #31516a;background:#102331;padding:16px;color:#cde2ed;font-size:13px}.noresults{padding:22px;background:#102331;border:1px solid #31516a;border-radius:12px}',
'@media (min-width:760px){.cards{grid-template-columns:repeat(3,minmax(0,1fr))}.card-link{min-height:268px;padding:17px;padding-right:53px}.star{right:13px;top:12px;width:40px;height:40px}.logo{width:175px;height:98px}.logo-area{min-height:118px}}',
'@media (min-width:1060px){.cards{grid-template-columns:repeat(6,minmax(0,1fr))}.card-link{min-height:245px;padding:12px 10px 10px;padding-right:40px}.logo{width:140px;height:80px}.logo-area{min-height:100px}.name{font-size:14px}}',
'@media (max-width:375px){.wrap{padding:0 11px}.cards{gap:9px}.card-link{min-height:229px;padding:12px 8px;padding-right:34px}.name{font-size:13px}.star{right:5px;top:6px;width:30px;height:30px;font-size:19px}.logo{width:125px}.navlinks{gap:9px;font-size:12px}}',
'@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}'
].join('\n');

function monogram(name){const parts=name.trim().split(/\s+/);return parts.length>1?parts.slice(0,2).map((s)=>s[0]).join('').toUpperCase():name.slice(0,2).toUpperCase();}
function card(s) {
  const logo=s.logo?'<img class="logo" loading="lazy" src="'+BASE+escape(s.logo)+'" alt="Logo de '+escape(s.name)+'" onerror="this.hidden=true;this.nextElementSibling.hidden=false">'+
    '<span class="monogram" hidden>'+escape(monogram(s.name))+'</span>'
    :'<span class="monogram">'+escape(monogram(s.name))+'</span>';
  return '<li class="card" data-name="'+escape(s.name.toLocaleLowerCase('es'))+'" data-category="'+escape(s.categorySlug)+'" data-slug="'+escape(s.slug)+'">'+
    '<button type="button" class="star" data-fav="'+escape(s.slug)+'" aria-pressed="false" aria-label="Añadir '+escape(s.name)+' a favoritos">☆</button>'+
    '<a class="card-link" href="'+BASE+'/servicios/?s='+encodeURIComponent(s.slug)+'" aria-label="Ver ficha de '+escape(s.name)+'">'+
    '<span class="name">'+escape(s.name)+'</span><span class="category">'+escape(s.categoryName)+'</span>'+
    '<span class="logo-area">'+logo+'</span>'+
    '<span class="signal"><span>Actividad: no disponible en la demo</span><span class="dashed" aria-hidden="true"></span>'+
    '<span class="notice">Sin mediciones en esta versión</span></span></a>'+
    '<button type="button" class="report-quick" data-report="'+escape(s.slug)+'" aria-label="Reportar falla de '+escape(s.name)+'">Reportar falla</button></li>';
}
function header(){
 return '<header class="top"><div class="wrap nav"><a class="brand" href="'+BASE+'/">Pulso<span>VE</span></a>'+
   '<nav class="navlinks" aria-label="Navegación"><a href="'+BASE+'/">Inicio</a><a href="'+BASE+'/servicios/">142 servicios</a><a href="'+BASE+'/creditos-marcas/">Logos y créditos</a></nav></div></header>'+
   '<div class="banner" role="note"><div class="wrap"><strong>VISTA PREVIA PÚBLICA</strong> · Catálogo demostrativo, sin reportes reales ni medición de caídas. La app operativa requiere servidor y base de datos.</div></div>';
}

const DEMO_REPORT_ISSUES = Object.fromEntries(categoriesSeed.map((category) => [
  category.slug, issueTypesSeed.filter((issue) =>
    issue.categorySlug === category.slug || issue.categorySlug === null
  ).map((issue) => ({slug: issue.slug, name: issue.name}))
]));
const REPORT_MODAL = '<dialog id="demo-report-dialog" class="report-dialog" aria-labelledby="demo-report-title">'+
'<h2 id="demo-report-title">Reportar falla: <span id="demo-report-service"></span></h2>'+
'<p><strong>Simulación:</strong> esta demo no envía ni almacena reportes. El formulario operativo requiere el servidor de PulsoVE.</p>'+
'<form id="demo-report-form" method="dialog">'+
'<label for="demo-issue">Tipo de falla<select id="demo-issue" name="issue" required></select></label>'+
'<label for="demo-state">Estado de Venezuela<select id="demo-state" name="state" required><option value="">Seleccionar estado</option>'+
statesSeed.map((state)=>'<option value="'+escape(state.code)+'">'+escape(state.name)+'</option>').join('')+'</select></label>'+
'<label class="check"><input id="demo-consent" type="checkbox" required>Entiendo que esto es una prueba, sin envío ni almacenamiento de datos.</label>'+
'<p class="report-feedback" id="demo-report-feedback" role="status" aria-live="polite"></p>'+
'<div class="buttons"><button type="button" id="demo-report-close">Cancelar</button>'+
'<button type="submit">Probar reporte (demo)</button></div></form></dialog>';

function layout(title,body,description){
 return '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta name="robots" content="noindex,nofollow"><title>'+escape(title)+' — PulsoVE (demo)</title>'+
  '<meta name="description" content="'+escape(description)+'"><style>'+CSS+'</style></head><body>'+header()+
  '<main id="contenido">'+body+'</main><footer class="footer"><div class="wrap">PulsoVE · Vista previa técnica independiente. Sin datos productivos ni monitoreo en tiempo real. '+
  '<a href="'+BASE+'/creditos-marcas/">Créditos y marcas</a>.</div></footer>'+REPORT_MODAL+
  '<script>const PREVIEW_ISSUES='+JSON.stringify(DEMO_REPORT_ISSUES).replace(/</g,'\\u003c')+';'+clientEnhance.toString()+';clientEnhance();</script></body></html>';
}
function group(title,desc,items,id){
 return '<section class="group" id="'+escape(id)+'"><div class="section-title"><h2>'+escape(title)+'</h2>'+
  '<a href="'+BASE+'/servicios/">Ver todos</a></div><p class="hint">'+escape(desc)+'</p>'+
  '<ul class="cards">'+items.map(card).join('')+'</ul></section>';
}
const homeSelected=HOME_SERVICE_SLUGS.map((slug)=>bySlug.get(slug)).filter(Boolean);
const homeSections=WORLDWIDE_SPOTLIGHT.map((section)=>({
 id:section.id,title:section.title,description:section.description,
 items:section.slugs.map((slug)=>bySlug.get(slug)).filter(Boolean)
}));
if(homeSections.some((s)=>s.items.length!==6))throw Error('All five global spotlight groups need 6 items');

const hero='<div class="wrap hero"><div class="eyebrow">Monitorea las plataformas que usas</div>'+
'<h1>Servicios de Venezuela y las plataformas más conocidas del mundo</h1>'+
'<p>Encuentra Cloudflare, Outlook, Gmail, Fortnite, juegos, redes, nube, bancos y muchas más. Esta vista muestra el catálogo; los estados reales de disponibilidad requieren la aplicación conectada.</p>'+
'<div class="stats"><div class="stat"><strong>'+catalog.length+'</strong><small>Servicios del catálogo</small></div>'+
'<div class="stat"><strong>'+categoriesSeed.length+'</strong><small>Categorías</small></div>'+
'<div class="stat"><strong>30</strong><small>Plataformas internacionales destacadas</small></div></div>'+
'<div class="filters"><input id="quicksearch" type="search" class="input" placeholder="Buscar Gmail, Cloudflare, Fortnite…" aria-label="Buscar entre tarjetas visibles">'+
'<a class="chip" href="'+BASE+'/servicios/">Abrir directorio de 142 servicios</a></div>'+
'<div class="filters">'+homeSections.map((s)=>'<a class="chip" href="#'+escape(s.id)+'">'+escape(s.title)+'</a>').join('')+'</div></div>';
const officialSourcesPanel='<section class="group" id="microsoft-status"><div class="section-title"><h2>Estado oficial de Microsoft</h2></div>'+
'<p class="hint">En esta vista previa estática no se consulta el RSS ni se afirman estados actuales. La aplicación conectada actualiza las fuentes cada cinco minutos.</p>'+
'<ul class="cards">'+MICROSOFT_FEEDS.map((feed)=>'<li class="card"><div class="card-link"><strong class="name">'+escape(feed.name)+'</strong>'+
'<p class="category">'+escape(feed.scope)+'</p><div class="logo-area"><span class="monogram">MS</span></div>'+
'<span class="signal">Estado actual: no consultado en esta demo</span><a class="chip" target="_blank" rel="noopener noreferrer" href="'+escape(feed.statusUrl)+'">Fuente oficial</a></div></li>').join('')+'</ul></section>';
const indexBody=hero+'<div class="wrap">'+group('Destacados de Venezuela','Servicios tradicionales del catálogo, con identificadores de marca cuando hay archivos verificados.',homeSelected,'ve')+
homeSections.map((s)=>group(s.title,s.description,s.items,s.id)).join('')+
'<p class="legal">Esta demo no inventa gráficos, números de reportes ni porcentajes de disponibilidad. Los botones de favoritos solo guardan slugs en este navegador. No se envían datos al servidor.</p></div>';
const indexHtml=layout('Servicios y plataformas internacionales',indexBody,'Catálogo demostrativo de plataformas internacionales y servicios venezolanos.');

const options=categoriesSeed.map((cat)=>'<option value="'+escape(cat.slug)+'">'+escape(cat.name)+'</option>').join('');
const dirBody='<div class="wrap directory"><div class="hero"><div class="eyebrow">Directorio completo</div>'+
'<h1>Explora '+catalog.length+' servicios</h1>'+
'<p>Correo, nube, inteligencia artificial, videojuegos, redes y servicios de Venezuela. Este directorio es una demostración sin seguimiento de incidentes.</p>'+
'<div class="filterbar"><input id="directory-search" class="input" type="search" placeholder="Buscar plataforma por nombre…" aria-label="Buscar plataformas">'+
'<select id="category-filter" aria-label="Filtrar por categoría"><option value="">Todas las categorías</option>'+options+'</select>'+
'<label class="chip"><input type="checkbox" id="favorites-only"> Solo mis favoritos</label></div>'+
'<p class="result" id="result-count" aria-live="polite">'+catalog.length+' servicios</p></div>'+
'<ul class="cards" id="directory-cards">'+catalog.map(card).join('')+'</ul>'+
'<p class="noresults" id="empty-result" hidden>No se encontraron servicios con estos filtros.</p></div>';
const directoryHtml=layout('Directorio global de servicios',dirBody,'Directorio demostrativo de '+catalog.length+' plataformas, servicios cloud, correo y juegos.');

const credits=Object.entries(HOME_BRAND_LOGOS).map(([slug,path])=>'<li><strong>'+escape(bySlug.get(slug)?.name||slug)+
 '</strong> · archivo local '+escape(path)+' · Fuente de iconografía: '+(path.endsWith('.svg')?'Simple Icons (CC0 sobre el gráfico; marcas registradas reservadas)':'Wikimedia Commons (consultar derechos y licencia en la ficha original)')+'</li>').join('');
const creditBody='<div class="wrap credits"><h1>Créditos y uso editorial de marcas</h1><p>Los gráficos identifican productos y servicios de sus titulares. PulsoVE no pertenece a ellos ni cuenta con su aval. Marcas protegidas, aunque la licencia de una representación gráfica permita su redistribución.</p>'+
'<ul>'+credits+'</ul><p>La atribución individual y el historial de archivos originales se documentan en <code>docs/LOGOS_EMPRESAS.md</code> del repositorio. El archivo Banesco requiere la atribución de licencia CC BY-SA 3.0.</p>'+
'<a href="'+BASE+'/">Volver al catálogo</a></div>';
const creditsHtml=layout('Créditos de marcas',creditBody,'Créditos de logotipos mostrados en PulsoVE.');

/** This function is stringified verbatim into the static demonstration. */
function clientEnhance(){
 const KEY='pulsove:favorites:v1';
 function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.filter((slug)=>typeof slug==='string').slice(0,80):[]}catch{return []}}
 function refresh(){
   const saved=read();
   document.querySelectorAll('[data-fav]').forEach((el)=>{
     const active=saved.includes(el.dataset.fav);
     el.setAttribute('aria-pressed',String(active));
     el.textContent=active?'★':'☆';
     el.setAttribute('aria-label',(active?'Quitar ':'Añadir ')+el.dataset.fav+' '+(active?'de':'a')+' favoritos');
   });
   if(document.querySelector('#favorites-only'))filterDirectory();
 }
 function filterDirectory(){
   const text=(document.querySelector('#directory-search')?.value||'').trim().toLocaleLowerCase('es');
   const cat=document.querySelector('#category-filter')?.value||'';
   const fav=!!document.querySelector('#favorites-only')?.checked;
   const saved=read();let visible=0;
   document.querySelectorAll('#directory-cards .card').forEach((el)=>{
      const ok=(!text||el.dataset.name.includes(text)||el.dataset.slug.includes(text))&&(!cat||el.dataset.category===cat)&&(!fav||saved.includes(el.dataset.slug));
      el.hidden=!ok;if(ok)visible++;
   });
   const count=document.querySelector('#result-count');if(count)count.textContent=visible+' servicios';
   const empty=document.querySelector('#empty-result');if(empty)empty.hidden=visible!==0;
 }
 document.querySelectorAll('[data-fav]').forEach((el)=>el.addEventListener('click',()=>{
   const id=el.dataset.fav;const list=read();
   const updated=list.includes(id)?list.filter((item)=>item!==id):[...list,id].slice(-80);
   try{localStorage.setItem(KEY,JSON.stringify(updated))}catch{}
   refresh();
 }));
 for(const selector of ['#directory-search','#category-filter','#favorites-only']){
   const field=document.querySelector(selector);field?.addEventListener('input',filterDirectory);field?.addEventListener('change',filterDirectory);
 }
 const demoDialog=document.querySelector('#demo-report-dialog');
 const reportForm=document.querySelector('#demo-report-form');
 const reportIssue=document.querySelector('#demo-issue');
 const reportResult=document.querySelector('#demo-report-feedback');
 document.querySelectorAll('button[data-report]').forEach((button)=>button.addEventListener('click',()=>{
   const item=button.closest('.card');
   const name=item?.querySelector('.name')?.textContent||button.dataset.report;
   const issueList=PREVIEW_ISSUES[item?.dataset.category]||[];
   document.querySelector('#demo-report-service').textContent=name;
   reportForm.reset();
   reportResult.textContent='';
   reportIssue.replaceChildren();
   for(const issue of issueList){
     const option=document.createElement('option');
     option.value=issue.slug;
     option.textContent=issue.name;
     reportIssue.append(option);
   }
   if(!issueList.length){const fallback=document.createElement('option');fallback.value='otro';fallback.textContent='Otro';reportIssue.append(fallback);}
   demoDialog.showModal();
 }));
 document.querySelector('#demo-report-close')?.addEventListener('click',()=>demoDialog.close());
 reportForm?.addEventListener('submit',(event)=>{
   event.preventDefault();
   if(!reportForm.reportValidity())return;
   reportResult.textContent='Simulación completada. No se envió ni guardó ningún reporte.';
 });
 const quick=document.querySelector('#quicksearch');quick?.addEventListener('input',()=>{
   const text=quick.value.toLocaleLowerCase('es').trim();
   document.querySelectorAll('main .card').forEach((el)=>{el.hidden=!!text&&!(el.dataset.name.includes(text)||el.dataset.slug.includes(text))});
 });
 const query=new URLSearchParams(location.search);
 const selected=query.get('s');
 if(selected&&document.querySelector('#directory-search')){
   const input=document.querySelector('#directory-search');
   const target=document.querySelector('[data-slug="'+CSS.escape(selected)+'"]');
   if(target){input.value=target.dataset.name;filterDirectory();target.scrollIntoView({block:'center'});}
 }
 refresh();
}

await mkdir(OUTPUT,{recursive:true});
await mkdir(join(OUTPUT,'servicios'),{recursive:true});
await mkdir(join(OUTPUT,'creditos-marcas'),{recursive:true});
await mkdir(join(OUTPUT,'brands'),{recursive:true});
await Promise.all([
 writeFile(join(OUTPUT,'index.html'),indexHtml),
 writeFile(join(OUTPUT,'servicios','index.html'),directoryHtml),
 writeFile(join(OUTPUT,'creditos-marcas','index.html'),creditsHtml),
 writeFile(join(OUTPUT,'.nojekyll'),''),
 writeFile(join(OUTPUT,'build-info.txt'),'mode=synthetic-public-demo\ncatalogue='+catalog.length+'\nsource-commit='+(process.env.GITHUB_SHA||'local')+'\n')
]);
for(const path of Object.values(HOME_BRAND_LOGOS)){
  const filename=path.slice(1);
  await mkdir(join(OUTPUT,'brands'),{recursive:true});
  await copyFile(join('public',filename),join(OUTPUT,filename));
}
console.log('Built GitHub Pages public demo: '+catalog.length+' services / '+categoriesSeed.length+' categories / '+homeSections.length+' global sections / '+Object.keys(HOME_BRAND_LOGOS).length+' local logos');
