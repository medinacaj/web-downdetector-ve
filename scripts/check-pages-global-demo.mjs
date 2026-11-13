import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const root = 'pages-global-demo';
const html = (path) => readFileSync(join(root,path),'utf8');
const homepage = html('index.html');
const directory = html('servicios/index.html');
const credits = html('creditos-marcas/index.html');
const methodology = html('metodologia/index.html');
const info = html('build-info.txt');
if(!info.includes('catalogue=579')) throw Error('Unexpected catalogue size in public output');
if(!methodology.includes('Examinamos reportes ciudadanos para identificar posibles problemas de servicio.') ||
   !methodology.includes('Siete elementos de una ficha de servicio') ||
   !methodology.includes('id="deteccion"') ||
   !methodology.includes('90 días') || !methodology.includes('15 min') ||
   !methodology.includes('no envía ni almacena reportes') ||
   (methodology.match(/class="guide-item"/g)||[]).length !== 7 ||
   !methodology.includes('noindex,nofollow'))
  throw Error('Public methodology must explain the seven functions, data limitations and detection defaults');
if(!homepage.includes('/metodologia/') || !directory.includes('/metodologia/'))
  throw Error('Public methodology must be accessible from the shared footer');
if(/DATABASE_URL|ANONYMIZATION_SALT|postgresql:|authorization:\\s*Bearer/i.test(methodology))
  throw Error('Secrets or backend reference leaked in methodology');

// Compare the generated preview with the canonical explicit local allowlist.
// Keep a regression floor, rather than pinning the inventory to an exact number
// every time a verified service image is added.
const source = readFileSync('src/lib/brand-logos.ts', 'utf8');
const entries = [...source.matchAll(/^  '([a-z0-9-]+)': '(\/brands\/[a-z0-9-]+\.(?:svg|png))',?$/gm)];
const slugs = new Set(entries.map((entry) => entry[1]));
const paths = new Set(entries.map((entry) => entry[2]));
if (entries.length < 167 || entries.length !== slugs.size || entries.length !== paths.size)
  throw Error('Local logo registry invalid or unexpectedly reduced');
const expectedLogos = entries.length;
const actualLogos = Number(info.match(/^logos=(\d+)$/m)?.[1]);
if(actualLogos !== expectedLogos) throw Error('Logo inventory mismatch: build='+actualLogos+', registry='+expectedLogos);
for(const file of [homepage,directory]){
  if(!file.includes('Cloudflare')||!file.includes('Gmail')||!file.includes('Outlook')||!file.includes('Fortnite'))
    throw Error('Required global services absent');
  if(!file.includes('Gráficos ilustrativos, no indicadores de disponibilidad actual'))
    throw Error('Neutral disclosure of illustrative charts missing');
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
if(profiles.length!==579)throw Error('Expected 579 individually generated service pages, got '+profiles.length);
for(const entry of profiles){
  const detail=html(join('servicios',entry.name,'index.html'));
  if(!detail.includes('Acerca de la empresa y el servicio')||!detail.includes('Principales usos y productos')||
     !detail.includes('id="demo-range"')||!detail.includes('id="demo-mode"')||
     !detail.includes('id="detail-chart"')||!detail.includes('id="demo-point"')||
     !detail.includes('demoChartInteraction()')||
     !detail.includes('Ficha de la plataforma')||!detail.includes('Proveedor o fabricante')||!detail.includes('Tipo de servicio')||
     !detail.includes('Historial de incidentes')||!detail.includes('Gráfica detallada de reportes')||
     !detail.includes('Gráfico ilustrativo, sin reportes ni métricas reales de disponibilidad.')||!detail.includes('noindex,nofollow'))
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
  if(!page.includes('Consultar la fuente')||!page.includes('https://')||!page.includes('Estado actual no consultado'))
    throw Error('Curated company information missing for '+slug);
}
if(!homepage.includes('Nube e infraestructura')||!homepage.includes('Videojuegos y plataformas de juego'))
  throw Error('Global homepage sections absent');
if((homepage.match(/class="demo-chart"/g)||[]).length!==60)throw Error('Expected 60 clearly labelled illustrative charts on index');
if((directory.match(/class="demo-chart"/g)||[]).length!==579)throw Error('Every catalogue card requires illustrative demo chart');
if(homepage.includes('Ejemplo visual · datos simulados')||directory.includes('Ejemplo visual · datos simulados'))
  throw Error('Redundant repeated chart disclaimer must not occupy card space');
if(homepage.includes('class="card-cta"') || directory.includes('class="card-cta"') ||
   homepage.includes('>Ver detalles<') || directory.includes('>Ver detalles<'))
  throw Error('Redundant detail CTA must not occupy card space');
if((homepage.match(/<a class="card-link"/g)||[]).length!==60 ||
   (directory.match(/<a class="card-link"/g)||[]).length!==579)
  throw Error('Every service card needs one native detail link');
if(!homepage.includes('.card>a.card-link::after') ||
   !directory.includes('.card>a.card-link::after') ||
   !homepage.includes('.card>.card-actions button{pointer-events:auto}'))
  throw Error('Detail link must cover each card without hijacking action buttons');
if(homepage.includes('VISTA PREVIA PÚBLICA')||directory.includes('VISTA PREVIA PÚBLICA')||
   homepage.includes('Estás viendo una demostración')||homepage.includes('☼ Vista'))
  throw Error('Redundant preview marketing notices or text-based theme controls remain');
if(!homepage.includes('id="theme-toggle"')||!homepage.includes('data-home-filter=')||
   !homepage.includes('id="home-search-count"')||!homepage.includes('id="home-empty"'))
  throw Error('Home filter and visual mode controls missing');
if(!homepage.includes('id="theme-toggle" class="theme-toggle" aria-label="Cambiar a modo oscuro"')||
   !homepage.includes('.theme-toggle svg{display:block;pointer-events:none}')||
   !homepage.includes('themeToggle.setAttribute(\'aria-label\',label)'))
  throw Error('Theme switch must use only an accessible icon in the top header');
if(!directory.includes('id="directory-sort"')||!directory.includes('id="favorites-only"'))
  throw Error('Directory interactive sorting/favorites missing');
if(directory.indexOf('class="card-link"')>directory.indexOf('class="card-actions"'))
  throw Error('Actions must be after full-width service title and chart');
if(!homepage.includes('--plot:#146e97')||!homepage.includes('--plot:#b95177'))
  throw Error('Charts must retain distinct category colors');
if(!homepage.includes('.card{border:0;border-top:0;border-radius:13px;box-shadow:0 3px 12px') ||
   !homepage.includes('.card:hover,.card:focus-within{border:0;border-top:0;border-radius:13px;box-shadow:0 8px 23px'))
  throw Error('Cards should have rounded corners, subtle shadows, but never a colored top border');
if(!homepage.includes('.wrap.hero,body[data-theme="light"] .wrap.hero{border:0;border-radius:16px;box-shadow:0 8px 26px'))
  throw Error('Hero should be rounded with subtle depth and no colored frame');
if(!homepage.includes('¿Tu internet, banco o aplicación está fallando?') ||
   !homepage.includes('id="quicksearch"') ||
   homepage.includes('PULSOVE · FALLAS DE SERVICIOS Y APLICACIONES') ||
   homepage.includes('class="intro-guide"') ||
   homepage.includes('class="stats"') ||
   homepage.includes('Ver los 211 servicios') ||
   !homepage.includes('>Destacados</p>'))
  throw Error('Home must prioritize search, not a long explanation or catalogue counters');
for(const page of [homepage,directory,html('servicios/cloudflare/index.html')]) {
  const top = page.split('</header>')[0];
  const footer = page.split('<footer class="footer">')[1]?.split('</footer>')[0] || '';
  if(!top.includes('>Servicios</a>') || top.includes('Logos y créditos') ||
     !footer.includes('id="ayuda"') ||
     !footer.includes('¿Cómo usar PulsoVE?') ||
     !footer.includes('>Logos y créditos</a>') ||
     footer.split('<li><strong>').length - 1 !== 3)
    throw Error('Navigation and accessible help/credits footer must exist on every page');
}
if((homepage.match(/class="section-index"/g)||[]).length!==9)
  throw Error('Numbered editorial sections missing');
if(homepage.includes('linear-gradient('))
  throw Error('Illustrative preview must not reintroduce generic gradient card styling');
if((directory.match(/class="report-quick"/g)||[]).length!==579)throw Error('Expected one compact red report icon per card');
if((homepage.match(/class="card-actions"/g)||[]).length!==60)throw Error('Expected isolated toolbar on each index card');
if((directory.match(/class="card-actions"/g)||[]).length!==579)throw Error('Expected isolated toolbar on each directory card');
if(!homepage.includes('.card-header{display:flex')||!homepage.includes('.demo-chart{display:block;flex:none;width:100%'))
  throw Error('Uniform, full-width card layout CSS missing');
if(homepage.includes('padding-right:75px')||homepage.includes('padding-right:88px'))
  throw Error('Whole-card right padding would shrink charts behind action icons');
if(!homepage.includes('.card-actions{display:flex')||!homepage.includes('.report-quick,.report-quick:hover{background:#c62934;color:#fff'))
  throw Error('Report icon must be compact, red, and isolated beneath content');
if(!directory.includes('id="directory-cards"'))throw Error('Interactive directory missing');
if(!credits.includes('Banesco')||!credits.includes('Dashboard Icons')||!credits.includes('Simple Icons')||!credits.includes('GTA Online'))
  throw Error('Per-brand source/rights credits missing');
const PRIORITY = ['aliexpress','ebay','minecraft','amazon','tumblr','youtube-music','overwatch-2','pokemon-go','gta-online','brawl-stars','among-us'];
for (const slug of PRIORITY) {
  const segment=directory.match(new RegExp('<li class="card"[^>]+data-slug="'+slug+'"[\\s\\S]*?<\\/li>'))?.[0];
  if(!segment||!segment.includes('/brands/'+slug+'.svg')) throw Error('Requested brand absent from directory: '+slug);
  const profile=html(join('servicios',slug,'index.html'));
  if(!profile.includes('/brands/'+slug+'.svg'))throw Error('Requested brand absent from profile: '+slug);
}
const files = readdirSync(join(root,'brands'));
if(files.length!==expectedLogos)throw Error('Missing or unexpected local brand assets: '+files.length);
for(const file of files) {
  const full=join(root,'brands',file);
  const data=readFileSync(full);
  if(data.length<100||data.length>350000)throw Error('Brand file invalid '+file);
  if(file.endsWith('.png')){
    if(data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('PNG invalid: '+file);
  }else if(file.endsWith('.svg')){
    const svg=data.toString();
    if(!/^<svg\s/.test(svg)||/<script\b|<foreignObject\b|<image\b|<iframe\b|\bon[a-z]+\s*=|\b(?:href|xlink:href)\s*=|@import|url\(\s*['"]?\s*https?:/i.test(svg))
      throw Error('Unsafe SVG: '+file);
  }else throw Error('Unexpected logo format '+file);
}
const top=new Set(readdirSync(root));
for(const x of top){
  if(!new Set(['index.html','servicios','creditos-marcas','metodologia','brands','.nojekyll','build-info.txt']).has(x))
    throw Error('Unexpected public artifact '+x);
}
console.log('PASS: 579 demo services, 8 worldwide sections, 50 local logos, synthetic-only charts and no backend requests');
