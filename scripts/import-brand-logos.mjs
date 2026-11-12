/**
 * One-time audited import of explicit Wikimedia Commons marks.
 * No runtime requests to logo hosts, no automated search, no user tracking.
 * Run only in the dedicated GitHub Actions asset-import job.
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

export const logos = [
  ['cantv', 'CANTV_logo.svg'],
  ['movistar', 'Movistar_2020_logo.svg'],
  ['digitel', 'Digitel_(2014).svg'],
  ['movilnet', 'Movilnet-logo_0.png'],
  ['corpoelec', 'Logo_CORPOELEC_(Venezuela).jpg'],
  ['banco-de-venezuela', 'Bdv2022logo.png'],
  ['banesco', 'Banesco_Nuevo_Logo.svg'],
  ['mercantil', 'Banco_Mercantil.svg'],
  ['whatsapp', 'WhatsApp.svg'],
  ['instagram', 'Instagram_logo_2022.svg'],
  ['seniat', 'LogoSENIAT.png'],
];

async function acquire(slug, filename) {
  const hash=createHash('md5').update(filename,'utf8').digest('hex');
  const url='https://upload.wikimedia.org/wikipedia/commons/'
    +hash[0]+'/'+hash.slice(0,2)+'/'+encodeURIComponent(filename);
  let response;
  for (let attempt=0;attempt<6;attempt++){
    response=await fetch(url,{
      headers:{'User-Agent':'PulsoVE-logo-import/1.0 (GitHub Actions; informational brand directory)'},
      signal:AbortSignal.timeout(25000)
    });
    if (response.ok)break;
    if (response.status!==429&&response.status<500)
      throw Error(slug+': HTTP '+response.status+' from '+url);
    const seconds=Math.min(45,5*Math.pow(2,attempt));
    console.log(slug+': source throttled with HTTP '+response.status+'; retry '+(attempt+1)+' after '+seconds+'s');
    await new Promise(resolve=>setTimeout(resolve,seconds*1000));
  }
  if(!response?.ok)throw Error(slug+': source blocked; HTTP '+response?.status);
  const type=response.headers.get('content-type')||'';
  if(!/^image\/(svg\+xml|png|jpeg)(?:\s*;|$)/i.test(type))throw Error(slug+': unexpected mime '+type);
  const payload=Buffer.from(await response.arrayBuffer());
  if(payload.length===0||payload.length>1_000_000)throw Error(slug+': image size invalid: '+payload.length);
  // Decode and normalize SVG/JPG/PNG to inert, optimized, self-hosted PNG bytes.
  const png=await sharp(payload,{limitInputPixels:15_000_000})
    .resize({width:480,height:190,fit:'inside',withoutEnlargement:true})
    .png({compressionLevel:9}).toBuffer();
  const meta=await sharp(png).metadata();
  if(!meta.width||!meta.height||meta.width>480||meta.height>190)
    throw Error(slug+': invalid normalized dimensions');
  if(png.length>350_000)throw Error(slug+': oversized raster');
  await writeFile('public/brands/'+slug+'.png',png,{flag:'w'});
  console.log(slug+': OK '+meta.width+'x'+meta.height+', '+png.length+' bytes (Commons: '+filename+')');
}

await mkdir('public/brands',{recursive:true});
const batch = logos.slice(0, 7); // staged batch; later marks are imported separately
for(const [slug,filename] of batch){
  await acquire(slug,filename);
  await new Promise(resolve=>setTimeout(resolve,2200));
}
console.log('Imported '+batch.length+' explicit, locally served trademarks; no official affiliation implied.');
