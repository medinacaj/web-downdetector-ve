import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const root = 'pages-global-demo';
const html = (path) => readFileSync(join(root,path),'utf8');
const homepage = html('index.html');
const directory = html('servicios/index.html');
const credits = html('creditos-marcas/index.html');
const info = html('build-info.txt');
if(!info.includes('catalogue=142')) throw Error('Unexpected catalogue size in public output');
for(const file of [homepage,directory]){
  if(!file.includes('Cloudflare')||!file.includes('Gmail')||!file.includes('Outlook')||!file.includes('Fortnite'))
    throw Error('Required global services absent');
  if(!file.includes('VISTA PREVIA PÚBLICA')||!file.includes('sin reportes reales'))
    throw Error('Demo warning absent');
  if(!file.includes('noindex,nofollow'))throw Error('Demo must not be search-indexed');
  if(/DATABASE_URL|ANONYMIZATION_SALT|postgresql:|authorization:\s*Bearer/i.test(file))
    throw Error('Secret or server reference leaked');
  const script=file.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if(!script)throw Error('Missing interaction logic');
  new vm.Script(script);
}
if(!homepage.includes('Nube e infraestructura')||!homepage.includes('Videojuegos y plataformas de juego'))
  throw Error('Global homepage sections absent');
if(!directory.includes('id="directory-cards"'))throw Error('Interactive directory missing');
if(!credits.includes('Banesco'))throw Error('Brand credits missing');
const files = readdirSync(join(root,'brands'));
if(files.length!==29)throw Error('Missing assets: '+files.length);
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
console.log('PASS: 142 public-demo services, 5 worldwide sections, 29 safe local logos, readable scripts; no backend secret or invented status');
