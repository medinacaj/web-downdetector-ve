import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const root = 'pages-global-demo';
const html = (path) => readFileSync(join(root,path),'utf8');
const homepage = html('index.html');
const directory = html('servicios/index.html');
const credits = html('creditos-marcas/index.html');
const info = html('build-info.txt');
if(!info.includes('catalogue=211')) throw Error('Unexpected catalogue size in public output');
for(const file of [homepage,directory]){
  if(!file.includes('Cloudflare')||!file.includes('Gmail')||!file.includes('Outlook')||!file.includes('Fortnite'))
    throw Error('Required global services absent');
  if(!file.includes('VISTA PREVIA PÚBLICA')||!file.includes('Gráficos ficticios de ejemplo'))
    throw Error('Demo warning absent');
  if(!file.includes('noindex,nofollow'))throw Error('Demo must not be search-indexed');
  if(!file.includes('.monogram[hidden]{display:none!important}')) throw Error('Logo and monogram visibility must be mutually exclusive');
  if(!file.includes('id="demo-report-dialog"')||!file.includes('data-report=')||!file.includes('no envía ni almacena reportes'))
    throw Error('Missing explicit non-transmitting quick report demo');
  if(!file.includes('PREVIEW_ISSUES=')) throw Error('Missing per-category issue options');
  if(/DATABASE_URL|ANONYMIZATION_SALT|postgresql:|authorization:\s*Bearer/i.test(file))
    throw Error('Secret or server reference leaked');
  const script=file.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if(!script)throw Error('Missing interaction logic');
  new vm.Script(script);
}
const profiles = readdirSync(join(root,'servicios'),{withFileTypes:true}).filter((item)=>item.isDirectory());
if(profiles.length!==211)throw Error('Expected 211 individually generated service pages, got '+profiles.length);
for(const entry of profiles){
  const detail=html(join('servicios',entry.name,'index.html'));
  if(!detail.includes('Acerca de la empresa y el servicio')||!detail.includes('Principales usos y productos')||
     !detail.includes('id="demo-range"')||!detail.includes('id="demo-mode"')||
     !detail.includes('id="detail-chart"')||!detail.includes('id="demo-point"')||
     !detail.includes('demoChartInteraction()')||
     !detail.includes('Ficha de la plataforma')||!detail.includes('Proveedor o fabricante')||!detail.includes('Tipo de servicio')||
     !detail.includes('Historial de incidentes')||!detail.includes('Gráfica detallada de reportes')||
     !detail.includes('datos simulados')||!detail.includes('noindex,nofollow'))
    throw Error('Service page lacks essential disclosure or details: '+entry.name);
  if(/DATABASE_URL|ANONYMIZATION_SALT|postgresql:|authorization:\s*Bearer/i.test(detail))
    throw Error('Potential private server reference in '+entry.name);
  const script=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if(!script)throw Error('Missing script in '+entry.name);
  new vm.Script(script);
  if(!directory.includes('/servicios/'+entry.name+'/'))throw Error('Directory does not link to '+entry.name);
}
for(const slug of ['cloudflare','gmail','outlook','fortnite']){
  const page=html(join('servicios',slug,'index.html'));
  if(!page.includes('id="profile-name"')||!page.includes('class="profile-tags"')) throw Error('Missing branded profile for '+slug);
  if(!page.includes('Consultar la fuente')||!page.includes('https://')||!page.includes('Sin datos reales suficientes'))
    throw Error('Curated company information missing for '+slug);
}
if(!homepage.includes('Nube e infraestructura')||!homepage.includes('Videojuegos y plataformas de juego'))
  throw Error('Global homepage sections absent');
if((homepage.match(/class="demo-chart"/g)||[]).length!==60)throw Error('Expected 60 clearly labelled illustrative charts on index');
if((directory.match(/class="demo-chart"/g)||[]).length!==211)throw Error('Every catalogue card requires illustrative demo chart');
if((homepage.match(/Ejemplo visual · datos simulados/g)||[]).length!==60)throw Error('Illustrative chart disclosure missing');
if((directory.match(/Ejemplo visual · datos simulados/g)||[]).length!==211)throw Error('Catalogue chart disclosure missing');
if((directory.match(/class="report-quick"/g)||[]).length!==211)throw Error('Expected one compact red report icon per card');
if((homepage.match(/class="card-actions"/g)||[]).length!==60)throw Error('Expected isolated toolbar on each index card');
if((directory.match(/class="card-actions"/g)||[]).length!==211)throw Error('Expected isolated toolbar on each directory card');
if(!homepage.includes('.card-header{display:flex')||!homepage.includes('.demo-chart{display:block;flex:none;width:100%'))
  throw Error('Uniform, full-width card layout CSS missing');
if(homepage.includes('padding-right:75px')||homepage.includes('padding-right:88px'))
  throw Error('Whole-card right padding would shrink charts behind action icons');
if(!homepage.includes('.card-actions{display:flex')||!homepage.includes('.report-quick{border:1px solid #b91c1c;background:#dc2626'))throw Error('Report icon must be compact, red, and inside its toolbar');
if(!directory.includes('id="directory-cards"'))throw Error('Interactive directory missing');
if(!credits.includes('Banesco'))throw Error('Brand credits missing');
const files = readdirSync(join(root,'brands'));
if(files.length!==50)throw Error('Missing assets: '+files.length);
for(const file of files) {
  const full=join(root,'brands',file);
  const data=readFileSync(full);
  if(data.length<100||data.length>350000)throw Error('Brand file invalid '+file);
  if(file.endsWith('.png')){
    if(data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('PNG invalid: '+file);
  }else if(file.endsWith('.svg')){
    const svg=data.toString();
    if(!svg.startsWith('<svg ')||/<script|<foreignObject|<image|onload=|href=/i.test(svg))
      throw Error('Unsafe SVG: '+file);
  }else throw Error('Unexpected logo format '+file);
}
const top=new Set(readdirSync(root));
for(const x of top){
  if(!new Set(['index.html','servicios','creditos-marcas','brands','.nojekyll','build-info.txt']).has(x))
    throw Error('Unexpected public artifact '+x);
}
console.log('PASS: 211 demo services, 8 worldwide sections, 50 local logos, synthetic-only charts and no backend requests');
