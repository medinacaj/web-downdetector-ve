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
import { brandLogoSource } from '../src/lib/brand-logo-sources.ts';
import { MICROSOFT_FEEDS } from '../src/lib/official-status/microsoft-rss.ts';
import { getServiceProfile } from '../src/lib/catalog/service-profiles.ts';

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
if(catalog.length!==211||new Set(catalog.map((s)=>s.slug)).size!==catalog.length)
  throw Error('Global catalogue is missing or contains duplicate services');
for(const slug of ['cloudflare','gmail','outlook','fortnite'])if(!bySlug.has(slug))throw Error('Missing '+slug);

const CSS=[
".profile-about{line-height:1.65;color:#cbdce7}.profile-list{margin:5px 0 14px;padding-left:19px;color:#bfd5df}.profile-list li{padding:2px 0}.profile-source{color:#78e9dc;text-decoration:underline;text-underline-offset:3px}.profile-source:hover{color:#b4fff5}",
".chart-controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;margin:18px 0}.chart-controls label{font-size:12px;font-weight:700;color:#b9cbdc}.chart-controls select{display:block;margin-top:6px;min-width:120px;width:100%;max-width:220px;border:1px solid #486b7b;border-radius:9px;background:#102534;color:#fff;padding:10px 12px;min-height:42px;cursor:pointer}.chart-controls .periods{display:flex;flex-wrap:wrap;gap:6px}.chart-shell{position:relative}.chart-summary{display:flex;gap:16px;flex-wrap:wrap;color:#c7dce8;font-size:13px}.chart-summary strong{color:#80eadd;font-size:16px}.profile-chart{padding:10px 12px}.profile-chart svg{height:clamp(210px,30vw,340px);touch-action:pan-y;cursor:crosshair}.chart-readout{font-size:13px;line-height:1.6;color:#aef1e7;margin-top:8px;min-height:25px}.chart-observation{margin-top:12px;border:1px solid #3e6980;border-radius:12px;background:#183347;padding:14px}.chart-observation strong{color:#b9f4eb}.chart-observation p{margin:7px 0 0}.chart-key{display:inline-flex;gap:9px;align-items:center;font-size:12px;color:#b7c9d7}.chart-key:before{content:\"\";width:10px;height:10px;border-radius:50%;background:#6edac9}.chart-key.sample:before{background:#ffa96b}.profile-panel button,.profile-chart select{font:inherit}",
"@media(max-width:450px){.chart-controls{display:grid;grid-template-columns:1fr 1fr}.chart-controls label{min-width:0}.chart-controls select{min-width:0;width:100%}.profile-chart{padding:6px}.profile-panel{padding:15px}.profile-hero{padding:18px}.chart-summary{gap:9px}}",
'.service-detail{padding:26px 0 66px}.breadcrumbs{color:#a8b9ce;font-size:13px;margin:8px 0 22px}.breadcrumbs a{text-decoration:underline;text-underline-offset:3px}.profile-hero{display:grid;gap:18px;align-items:center;border:1px solid #31516a;border-radius:20px;background:#112331;padding:24px}.profile-hero h1{font-size:clamp(28px,4vw,45px);line-height:1.12;margin:4px 0 12px}.profile-hero p{color:#c1d3de;margin:0;max-width:750px}.profile-logo{width:116px;height:110px;border-radius:20px;background:#fff;color:#14546a;display:flex;align-items:center;justify-content:center;padding:14px}.profile-logo .logo{height:82px;width:100%;max-width:100%;object-fit:contain}.profile-logo .monogram{width:78px;height:78px}.profile-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.profile-tags span{display:inline-block;padding:6px 11px;border:1px solid #356077;border-radius:100px;color:#d7f5f0;background:#1a3745;font-size:12px}.profile-grid{display:grid;gap:14px;grid-template-columns:minmax(0,1fr);margin-top:20px}.profile-panel{border:1px solid #294458;border-radius:16px;background:#11202d;padding:20px;min-width:0}.profile-panel h2{margin:0 0 12px;font-size:21px}.profile-panel h3{font-size:14px;margin:0 0 6px;color:#a8cbd6}.profile-panel p{margin:0 0 13px;color:#b9ccd8;font-size:14px}.profile-value{font-weight:700;color:#fff;font-size:17px}.profile-note{font-size:12px!important;color:#97b5c5!important}.profile-chart{width:100%;margin:14px 0 8px;border:1px solid #31495f;border-radius:13px;background:#0e1c29;padding:18px}.profile-chart svg{display:block;width:100%;height:200px;color:#76e9d7}.profile-incident{padding:13px;border:1px dashed #536e7f;border-radius:10px;color:#c5dae6}.profile-back{display:inline-block;margin-top:22px;padding:12px 18px;border-radius:11px;background:#176d73;color:#fff;font-weight:700}.profile-back:hover{background:#0f888f}',
'@media(min-width:760px){.profile-hero{grid-template-columns:130px minmax(0,1fr);padding:30px}.profile-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.profile-wide{grid-column:1/-1}}',
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
'.cards{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:1fr;gap:13px;align-items:stretch}.card{display:flex;flex-direction:column;min-width:0;background:var(--card);color:var(--ink);border-radius:18px;box-shadow:0 5px 15px #0003;overflow:hidden}.card:hover{box-shadow:0 9px 25px #0005}.card[hidden]{display:none!important}',
'.card-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex:none;min-height:42px;padding:6px 12px 0}',
'.card-link{display:flex;flex:1;min-width:0;flex-direction:column;min-height:250px;padding:5px 12px 12px}.card-header{display:flex;min-width:0;min-height:52px;flex-direction:column}',
'.name{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font-size:clamp(13px,1.8vw,17px);font-weight:750;line-height:1.25;min-height:32px;overflow-wrap:anywhere}.category{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;color:#64748b;margin-top:3px;line-height:1.3}',
'.logo-area{display:flex;flex:none;height:80px;min-height:0;width:100%;align-items:center;justify-content:center;padding:5px 0}.logo{display:block;max-width:100%;width:145px;height:70px;object-fit:contain}.monogram{border-radius:14px;background:#dceef3;color:#14546a;font-weight:800;letter-spacing:-1px;font-size:25px;width:66px;height:66px;display:grid;place-items:center}',
'.logo[hidden],.monogram[hidden]{display:none!important}',
'.signal{display:flex;flex:none;min-height:104px;width:100%;min-width:0;flex-direction:column;justify-content:flex-end;margin-top:auto;border-top:1px solid #e2e8f0;padding-top:6px;color:#64748b;font-size:10px;line-height:1.25}.demo-chart{display:block;flex:none;width:100%;height:52px;margin:3px 0;color:#5771b5}.demo-label{display:block;min-height:21px;font-size:9px;line-height:1.2;font-weight:700;color:#485a7e}.notice{display:block;min-height:20px;font-size:9px;line-height:1.2;color:#59677a}',
'.star,.report-quick{position:static;z-index:auto;flex:none;display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;cursor:pointer;line-height:1}.star{background:#eef8ff;color:#028bd1;border:1px solid #d4ecfa;font-size:22px}.star[aria-pressed=true]{color:#005a98;background:#d0efff}',
'.report-quick{border:1px solid #b91c1c;background:#dc2626;color:#fff;font-weight:900;font-size:23px}.report-quick:hover{background:#b91c1c}.report-quick:focus-visible{outline:3px solid #991b1b;outline-offset:3px}',
'.report-dialog{border:0;border-radius:17px;padding:22px;width:min(92vw,470px);max-height:85vh;overflow:auto;color:#172033;background:#fff;box-shadow:0 20px 70px #0008}.report-dialog::backdrop{background:#060f1dc9}',
'.report-dialog h2{font-size:22px;margin:0 0 9px}.report-dialog p{font-size:13px;color:#475569}.report-dialog label{display:block;font-size:13px;font-weight:650;margin-top:13px}',
'.report-dialog select{display:block;width:100%;min-height:44px;padding:8px;border:1px solid #94a3b8;border-radius:9px;background:#fff;color:#172033;margin-top:5px}',
'.report-dialog .check{display:flex;align-items:flex-start;gap:9px;font-weight:450}.report-dialog .check input{margin-top:4px}.report-dialog .buttons{display:flex;gap:10px;margin-top:20px}',
'.report-dialog .buttons button{flex:1;min-height:44px;padding:8px;border-radius:9px;border:1px solid #94a3b8;background:#fff;color:#172033;cursor:pointer}.report-dialog .buttons button[type=submit]{background:#08767a;color:#fff;border-color:#08767a}',
'.report-dialog .report-feedback{color:#07565c;font-weight:650;margin-top:12px}',
'.directory{padding-bottom:70px}.filterbar{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0}.filterbar select{min-height:44px;border:0;border-radius:12px;padding:8px 12px;background:#fff;color:#172033;flex:1;max-width:330px}.result{color:#a7c1ce;font-size:13px}',
'.footer{border-top:1px solid #233647;padding:34px 0 50px;color:#a8b9ce;font-size:12px;margin-top:20px}.credits{max-width:850px;padding:30px 0 70px}.credits a{color:#70e7d4;text-decoration:underline}',
'.legal{border-radius:14px;border:1px solid #31516a;background:#102331;padding:16px;color:#cde2ed;font-size:13px}.noresults{padding:22px;background:#102331;border:1px solid #31516a;border-radius:12px}',
'@media (min-width:760px){.cards{grid-template-columns:repeat(3,minmax(0,1fr))}.card-link{min-height:259px;padding:6px 15px 14px}.card-actions{min-height:46px;padding:7px 15px 0}.star,.report-quick{width:38px;height:38px}.logo-area{height:88px}.logo{width:170px;height:76px}.demo-chart{height:58px}.signal{min-height:111px}.name{font-size:16px}}',
'@media (min-width:1060px){.cards{grid-template-columns:repeat(6,minmax(0,1fr))}.card-link{min-height:251px;padding:5px 11px 12px}.card-actions{min-height:42px;padding:6px 10px 0}.star,.report-quick{width:34px;height:34px}.logo-area{height:80px}.logo{width:145px;height:70px}.demo-chart{height:54px}.signal{min-height:106px}.name{font-size:14px}}',
'@media (max-width:375px){.wrap{padding:0 11px}.cards{gap:9px}.card-link{min-height:250px;padding:5px 9px 10px}.card-actions{min-height:38px;padding:5px 8px 0}.star,.report-quick{width:32px;height:32px;font-size:20px}.name{font-size:13px}.logo-area{height:78px}.logo{width:125px;height:68px}.navlinks{gap:9px;font-size:12px}}',
'@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}',
"/* DIRECTORY EDITION — no boxed cards, glow, ornamental gradients or AI-style ribbons. */\n:root{--bg:#f2f3f2;--card:#fff;--ink:#1a2630;--muted:#58656d;--cyan:#087d78;color-scheme:light}\nbody,body[data-theme=\"light\"]{background:#f2f3f2;color:#1b2932;font-family:system-ui,-apple-system,\"Segoe UI\",sans-serif}\n.top,body[data-theme=\"light\"] .top{background:#f2f3f2;border-bottom:1px solid #c8ced0;backdrop-filter:none;box-shadow:none}\n.nav{gap:18px;min-height:68px}\n.brand,body[data-theme=\"light\"] .brand{color:#172a30;font-size:25px;font-weight:900;letter-spacing:-1.5px}\n.brand span,body[data-theme=\"light\"] .brand span{color:#008b7b}\n.navlinks,body[data-theme=\"light\"] .navlinks{color:#43515b;font-size:13px;font-weight:650}\n.navlinks a{padding:9px 0;border-bottom:2px solid transparent}\n.navlinks a:hover,.navlinks a[aria-current=page],body[data-theme=\"light\"] .navlinks a:hover,body[data-theme=\"light\"] .navlinks a[aria-current=page]{background:none;color:#007c75;border-bottom-color:#007c75}\n.theme-toggle,body[data-theme=\"light\"] .theme-toggle{border:0;border-radius:0;background:none;color:#3b5c61;padding:8px 0 8px 10px;font-size:12px;font-weight:800;min-height:42px}\n.theme-toggle:hover{background:none;color:#007c75;text-decoration:underline;text-underline-offset:4px}\n.banner,body[data-theme=\"light\"] .banner{background:#e7eceb;color:#435a61;border:0;border-bottom:1px solid #d5dedc;text-align:left;padding:7px 0;font-size:11px}\n.banner strong{font-weight:900;color:#276960}\n.wrap.hero,body[data-theme=\"light\"] .wrap.hero{background:#152c33;color:#fff;border:0;border-radius:0;box-shadow:none;margin-top:22px;padding:31px 26px 26px}\n.hero-top{display:grid;grid-template-columns:minmax(0,1fr);gap:22px;align-items:end}\n.hero .eyebrow{color:#62dec5;letter-spacing:.22em;font-size:10px}\n.hero h1,body[data-theme=\"light\"] .hero h1{color:#fff;font-size:clamp(32px,4.5vw,57px);line-height:1.04;letter-spacing:-1.8px;max-width:720px;margin:8px 0 17px;font-weight:800}\n.hero p,body[data-theme=\"light\"] .hero p{color:#bbd4d3;font-size:14px;line-height:1.65;max-width:610px;margin:0}\n.hero .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:0}\n.hero .stat,body[data-theme=\"light\"] .hero .stat{border:0;border-left:2px solid #33736b;border-radius:0;background:none;box-shadow:none;min-width:0;padding:0 0 0 13px}\n.hero .stat strong,body[data-theme=\"light\"] .hero .stat strong{font-size:clamp(22px,3vw,34px);line-height:1.05;color:#fff;font-weight:800}\n.hero .stat small,body[data-theme=\"light\"] .hero .stat small{color:#a7c7c6;font-size:10px;line-height:1.35;max-width:150px;margin-top:6px}\n.hero-tools{border-top:1px solid #3c585c;margin-top:24px;padding-top:16px}\n.hero .filters{margin:8px 0;gap:6px}\n.input{min-height:45px;border:0;border-radius:0;background:#fff;color:#142c31;padding:10px 13px}\n.hero .input{background:#fff;border:0;max-width:none}\n.chip,.hero .chip,body[data-theme=\"light\"] .hero .chip{border:0;border-bottom:2px solid transparent;border-radius:0;background:#233d42;color:#cbe0dd;padding:8px 11px;font-size:12px;font-weight:650;box-shadow:none;cursor:pointer;transition:color .16s,background .16s}\n.chip:hover,.chip[aria-pressed=true],.hero .chip:hover,.hero .chip[aria-pressed=true],body[data-theme=\"light\"] .hero .chip:hover,body[data-theme=\"light\"] .hero .chip[aria-pressed=true]{background:#1c534e;color:#fff;border-bottom-color:#62dec5;transform:none}\n.hero .reset-home-search{border:0;border-radius:0;background:#3a5b5e;color:#fff;padding:10px 14px;cursor:pointer}\n.home-search-status,body[data-theme=\"light\"] .home-search-status{color:#add6cc;font-size:11px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;margin-top:12px}",
"/* Editorial grid: whitespace and typographic rank instead of individual borders. */\n.group,.group:nth-of-type(2n),.group:nth-of-type(3n),.group:nth-of-type(5n),body[data-theme=\"light\"] .group,body[data-theme=\"light\"] .group:nth-of-type(2n),body[data-theme=\"light\"] .group:nth-of-type(3n),body[data-theme=\"light\"] .group:nth-of-type(5n){background:none;border:0;border-radius:0;box-shadow:none;padding:19px 0 23px;margin:16px 0 20px}\n.group+.group{border-top:1px solid #d2d8d7}\n.section-title{align-items:center;gap:12px;margin-bottom:7px}\n.section-heading{display:flex;align-items:baseline;gap:12px;min-width:0}\n.section-index{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;font-weight:800;color:#03756b;letter-spacing:.03em;min-width:20px}\n.group .section-title h2,body[data-theme=\"light\"] .group .section-title h2{font-weight:820;font-size:clamp(19px,2.7vw,27px);color:#182b30;letter-spacing:-.035em}\n.group .section-title a,body[data-theme=\"light\"] .group .section-title a{color:#08756c;font-weight:800;font-size:12px;white-space:nowrap}\n.group .section-title a:hover{text-decoration:underline;text-underline-offset:3px}\n.group .hint,body[data-theme=\"light\"] .group .hint{color:#5f6d70;font-size:12px;margin:0 0 18px}\n.cards{gap:12px;grid-auto-rows:1fr}\n.card,.card:hover,.card:focus-within{border:0;border-radius:0;box-shadow:none;background:#fff;transform:none;overflow:hidden;position:relative;transition:background .16s}\n.card:hover,.card:focus-within{background:#e4f0ee;box-shadow:none}\n.card[hidden],.group[hidden],#home-empty[hidden],#reset-home-search[hidden]{display:none!important}\n.card{--plot:#187c81}\n.card[data-category=\"nube-e-infraestructura\"],.card[data-category=\"telecomunicaciones\"]{--plot:#146e97}\n.card[data-category=\"plataformas-digitales\"],.card[data-category=\"correo-y-productividad\"]{--plot:#7660a2}\n.card[data-category=\"videojuegos\"],.card[data-category=\"streaming\"]{--plot:#b95177}\n.card[data-category=\"comercio-global\"],.card[data-category=\"banca-y-pagos\"]{--plot:#9a691c}\n.card[data-category=\"servicios-publicos\"],.card[data-category=\"delivery-y-movilidad\"]{--plot:#23816b}\n.card[data-category=\"inteligencia-artificial\"]{--plot:#7056b3}\n.card[data-category=\"apuestas-y-loterias\"]{--plot:#93516c}\n.card-link{order:1;flex:1;min-height:0!important;padding:13px 12px 2px!important}\n.card-header{min-height:56px}\n.name{font-size:clamp(13px,1.8vw,16px);font-weight:820;letter-spacing:-.025em;line-height:1.25;min-height:35px;color:#14272e;overflow-wrap:anywhere}\n.category{font-size:10px;line-height:1.4;color:#526668;font-weight:720;margin-top:4px}\n.category:before{content:\"\";display:inline-block;vertical-align:middle;height:5px;width:5px;background:var(--plot);margin:0 6px 2px 0}\n.logo-area{height:76px;flex:none;padding:6px 0}\n.logo{height:70px;width:100%;max-width:175px;object-fit:contain}\n.monogram{width:65px;height:65px;border-radius:0;background:#ebf0ee;color:#18484b;font-size:24px}\n.signal{margin-top:auto;min-height:82px;border-top:0;padding-top:6px;color:#4c6667}\n.demo-chart{height:53px!important;margin:0;color:var(--plot)}\n.card-cta{display:flex;justify-content:space-between;align-items:center;gap:6px;margin:0;min-height:23px;color:#285b59;font-size:11px;font-weight:800}\n.card-cta .arrow{font-size:18px;transition:transform .18s}\n.card:hover .card-cta .arrow{transform:translateX(3px)}\n.card-actions{order:2;flex:none;justify-content:flex-end;min-height:45px!important;padding:3px 10px 7px!important;background:transparent;border:0;gap:9px}\n.star,.report-quick{position:static;flex:none;border:0;border-radius:0;background:transparent;width:34px!important;height:34px!important;font-size:22px;transition:background .15s,color .15s}\n.star{color:#246a74}\n.star:hover,.star[aria-pressed=true]{background:#cfe9e5;color:#0d716b}\n.report-quick,.report-quick:hover{background:#c62934;color:#fff;font-size:22px;font-weight:900}\n.report-quick:hover{background:#981923}\n.report-quick:focus-visible{outline:2px solid #9d141e;outline-offset:2px}\n.legal,body[data-theme=\"light\"] .legal{background:#e8eceb;border:0;border-radius:0;color:#486366;padding:14px 15px;font-size:12px}\n.noresults{background:#e7efed;border:0;border-radius:0;color:#275852}\n",
"/* Directory, profiles and light/dark theme retain the same typographic system. */\n.directory>.hero{background:none;margin:0;padding:28px 0 10px}\n.directory>.hero h1,.directory>.hero p,body[data-theme=\"light\"] .directory>.hero h1,body[data-theme=\"light\"] .directory>.hero p{color:#1c3336}\n.directory .eyebrow{color:#00786e}\n.directory .filterbar,body[data-theme=\"light\"] .directory .filterbar{background:#e5eae8;border:0;border-radius:0;box-shadow:none;padding:12px;gap:8px}\n.directory .filterbar select{border:0;border-radius:0;background:#fff;color:#21353b;min-height:44px}\n.directory .filterbar .chip,body[data-theme=\"light\"] .directory .filterbar .chip{display:flex;align-items:center;gap:7px;background:#d7e1df;color:#254647;border:0;border-radius:0}\n.directory .result,body[data-theme=\"light\"] .directory .result{color:#436564;font-size:12px;font-weight:800}\n.directory .cards{margin-top:17px}\n.credits{color:#1c343b}\n.credits a{color:#08776f}\n.footer,body[data-theme=\"light\"] .footer{background:#e5eae9;border-top:1px solid #cbd4d1;color:#4a6567}\n.profile-hero,.profile-panel{border:0;border-radius:0;background:#fff;color:#213537}\n.profile-hero h1,.profile-panel h2{color:#1b3335}\n.profile-hero p,.profile-panel p,.profile-panel h3{color:#4e6366}\n.profile-value{color:#213536}\n.profile-tags span{border:0;border-radius:0;background:#e4ebe9;color:#2f5658}\n.profile-chart{background:#f2f5f4;border:0;border-radius:0}\n.profile-incident{border:0;border-left:3px solid #4a9690;border-radius:0;background:#edf2f1;color:#345b5b}\n.profile-back{border-radius:0;background:#08786f}\n.profile-source{color:#067b74}\n.report-dialog{border-radius:0}\n.report-dialog .buttons button,.report-dialog select{border-radius:0}\nbody[data-theme=\"dark\"]{background:#101c20;color:#d5e4e3}\nbody[data-theme=\"dark\"] .top{background:#101c20;border-bottom-color:#355154}\nbody[data-theme=\"dark\"] .brand{color:#eaf4f2}\nbody[data-theme=\"dark\"] .brand span{color:#64cbb8}\nbody[data-theme=\"dark\"] .navlinks{color:#b2d0c9}\nbody[data-theme=\"dark\"] .navlinks a:hover,body[data-theme=\"dark\"] .navlinks a[aria-current=page]{color:#8be2cc;border-bottom-color:#8be2cc}\nbody[data-theme=\"dark\"] .theme-toggle{color:#b1d5ce}\nbody[data-theme=\"dark\"] .banner{background:#1b2c31;border-color:#2e484b;color:#b7cccb}\nbody[data-theme=\"dark\"] .group+.group{border-top-color:#335052}\nbody[data-theme=\"dark\"] .group .section-title h2{color:#edf6f4}\nbody[data-theme=\"dark\"] .group .hint{color:#afc3bf}\nbody[data-theme=\"dark\"] .group .section-title a{color:#8bddc8}\nbody[data-theme=\"dark\"] .section-index{color:#7ed9bd}\nbody[data-theme=\"dark\"] .card{background:#1e3034;color:#e6f0ed}\nbody[data-theme=\"dark\"] .card:hover,body[data-theme=\"dark\"] .card:focus-within{background:#2b4445}\nbody[data-theme=\"dark\"] .card .name{color:#f0f8f5}\nbody[data-theme=\"dark\"] .card .category{color:#afc8c2}\nbody[data-theme=\"dark\"] .card-cta{color:#a4ddd0}\nbody[data-theme=\"dark\"] .star{color:#b6ded4}\nbody[data-theme=\"dark\"] .star[aria-pressed=true],body[data-theme=\"dark\"] .star:hover{background:#365953}\nbody[data-theme=\"dark\"] .card .monogram{background:#324b4a;color:#e4f1ee}\nbody[data-theme=\"dark\"] .directory>.hero h1,body[data-theme=\"dark\"] .directory>.hero p{color:#dce9e6}\nbody[data-theme=\"dark\"] .directory .filterbar{background:#25393d}\nbody[data-theme=\"dark\"] .directory .filterbar .chip{background:#344b4d;color:#d4e7e0}\nbody[data-theme=\"dark\"] .directory .result{color:#aacdc6}\nbody[data-theme=\"dark\"] .legal,body[data-theme=\"dark\"] .noresults{background:#223639;color:#bbd4d0}\nbody[data-theme=\"dark\"] .footer{background:#152528;border-top-color:#365052;color:#b0cac5}\nbody[data-theme=\"dark\"] .profile-hero,body[data-theme=\"dark\"] .profile-panel{background:#1e3034;color:#eaf4ef}\nbody[data-theme=\"dark\"] .profile-hero h1,body[data-theme=\"dark\"] .profile-panel h2,body[data-theme=\"dark\"] .profile-value{color:#edf7f3}\nbody[data-theme=\"dark\"] .profile-hero p,body[data-theme=\"dark\"] .profile-panel p,body[data-theme=\"dark\"] .profile-panel h3{color:#afc9c1}\nbody[data-theme=\"dark\"] .profile-tags span{background:#324b4b;color:#daece6}\nbody[data-theme=\"dark\"] .profile-chart{background:#14272a}\nbody[data-theme=\"dark\"] .profile-incident{background:#263c3f;color:#d2e8e1}\nbody[data-theme=\"dark\"] .profile-source{color:#8fe4cf}",
"@media(min-width:900px){.hero-top{grid-template-columns:minmax(0,1.5fr) minmax(220px,.6fr);gap:30px}.hero .stats{grid-template-columns:1fr}.hero .stat{display:flex;justify-content:space-between;align-items:baseline;gap:12px}.hero .stat small{max-width:135px;text-align:right}}\n@media(max-width:760px){.wrap.hero{padding:25px 17px}.hero .stat strong{font-size:22px}.hero .stat{padding-left:9px}.hero .stats{gap:8px}.group{padding:14px 0 19px}.cards{gap:10px}.card-link{padding:12px 9px 2px!important}.logo-area{height:70px}.logo{height:64px}.card-actions{min-height:41px!important}}\n@media(max-width:375px){.wrap{padding:0 11px}.wrap.hero{padding:22px 11px}.hero .stats{gap:7px}.hero .stat strong{font-size:20px}.hero .stat small{font-size:9px}.cards{gap:9px}.card-link{padding:11px 8px 2px!important}.name{font-size:13px}.logo-area{height:63px}.logo{height:60px}.demo-chart{height:48px!important}.star,.report-quick{width:32px!important;height:32px!important}.section-heading{gap:8px}}\n@media(prefers-reduced-motion:reduce){.card-cta .arrow{transition:none}.card:hover .card-cta .arrow{transform:none}}"
,
".breadcrumbs{color:#486267}.profile-note{color:#587278!important}.chart-controls label{color:#3e6267}.chart-summary{color:#456c6b}.chart-summary strong{color:#0b7b72}.chart-readout{color:#186f6b}.chart-observation{background:#e7f1ed;border:0;border-radius:0;color:#275955}.chart-observation strong{color:#13685d}.chart-key{color:#4d6868}.profile-chart svg{color:#178376}\nbody[data-theme=\"dark\"] .breadcrumbs{color:#b2ccca}\nbody[data-theme=\"dark\"] .profile-note{color:#9cc3bc!important}\nbody[data-theme=\"dark\"] .chart-controls label,body[data-theme=\"dark\"] .chart-summary{color:#bad3cd}\nbody[data-theme=\"dark\"] .chart-summary strong,body[data-theme=\"dark\"] .chart-readout{color:#89dfcf}\nbody[data-theme=\"dark\"] .chart-observation{background:#243e3e;color:#c9e5da}\nbody[data-theme=\"dark\"] .chart-observation strong{color:#9fe4d1}\nbody[data-theme=\"dark\"] .profile-chart svg{color:#76e9d7}"
,
"\n/* Visual correction: round the surfaces, not with a colored border-strip. */\n.card{border:0;border-top:0;border-radius:13px;box-shadow:0 3px 12px rgba(19,39,44,.11);overflow:hidden;transition:background .18s ease,box-shadow .18s ease,transform .18s ease}\n.card:hover,.card:focus-within{border:0;border-top:0;border-radius:13px;box-shadow:0 8px 23px rgba(19,39,44,.17);transform:translateY(-2px)}\n.wrap.hero,body[data-theme=\"light\"] .wrap.hero{border:0;border-radius:16px;box-shadow:0 8px 26px rgba(15,35,40,.12)}\n.profile-hero,.profile-panel{border:0;border-radius:13px;box-shadow:0 3px 14px rgba(14,34,39,.08)}\n.profile-chart{border-radius:11px}\n.profile-incident{border-radius:8px}\n.report-dialog{border-radius:13px}\nbody[data-theme=\"dark\"] .card{border:0;border-top:0;box-shadow:0 4px 15px rgba(0,0,0,.23)}\nbody[data-theme=\"dark\"] .card:hover,body[data-theme=\"dark\"] .card:focus-within{box-shadow:0 9px 25px rgba(0,0,0,.3)}\nbody[data-theme=\"dark\"] .profile-hero,body[data-theme=\"dark\"] .profile-panel{border:0;box-shadow:0 4px 14px rgba(0,0,0,.19)}\n@media(prefers-reduced-motion:reduce){.card:hover,.card:focus-within{transform:none}}\n"
,
".card .logo-area{background:#fff;border-radius:9px;margin:4px 5px 0;box-sizing:border-box;padding:6px 8px;height:76px}.card .logo{display:block;width:100%;max-width:170px;height:64px;max-height:100%;object-fit:contain;object-position:center}.profile-logo .logo{max-width:100%;height:80px;object-fit:contain;object-position:center} @media(max-width:375px){.card .logo-area{height:68px;padding:5px 6px}.card .logo{height:58px}}"
,
"/* One accessible anchor covers the entire catalog tile; only the separate action buttons intercept clicks. */\n.card{position:relative}\n.card>a.card-link::after{content:\"\";position:absolute;inset:0;z-index:2;border-radius:13px;cursor:pointer}\n.card>a.card-link:focus-visible{outline:none}\n.card>a.card-link:focus-visible::after{outline:3px solid var(--cyan);outline-offset:-3px}\n.card>.card-actions{position:relative;z-index:3;pointer-events:none}\n.card>.card-actions button{pointer-events:auto}"
,
"/* First-visit guidance for the public static preview: native links, no onboarding modal. */\n.intro-lead{font-size:15px!important;color:#e1f4f0!important;max-width:680px!important}\n.intro-disclaimer{margin-top:12px!important;color:#d7eee9!important;font-size:12px!important;line-height:1.6!important}\n.intro-disclaimer strong{color:#fff}\n.intro-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:20px 0 12px}\n.intro-primary{display:inline-flex;min-height:42px;align-items:center;justify-content:center;padding:10px 16px;border-radius:9px;background:#73e4ce;color:#113b35;font-size:14px;font-weight:800;text-decoration:none}\n.intro-primary:hover,.intro-primary:focus-visible{background:#a1f3e3}\n.intro-secondary{display:inline-flex;min-height:40px;align-items:center;color:#e1f5ef;font-size:13px;font-weight:700;text-underline-offset:4px;text-decoration:underline}\n.intro-guide{scroll-margin-top:90px;margin-top:18px;padding-top:16px;border-top:1px solid #3c585c}\n.intro-guide h2{font-size:13px;font-weight:800;color:#fff;margin:0 0 11px}\n.intro-steps{list-style:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin:0;padding:0}\n.intro-steps li{display:flex;min-width:0;flex-direction:column;gap:4px;line-height:1.55}\n.intro-steps strong{color:#84e7d5;font-size:12px}\n.intro-steps span{color:#e5f6f2;font-size:12px}\n@media(max-width:760px){.intro-steps{grid-template-columns:1fr;gap:9px}.intro-steps li{flex-direction:row;gap:9px}.intro-steps strong{flex:0 0 76px}.intro-steps span{min-width:0}.intro-actions{margin:14px 0 9px}}\n"
,
"/* Header theme control: icon only, with a 44px touch target and visible focus. */\n.theme-toggle,body[data-theme=\"light\"] .theme-toggle,body[data-theme=\"dark\"] .theme-toggle{width:44px;height:44px;min-width:44px;min-height:44px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:10px;background:transparent;cursor:pointer;line-height:1;color:inherit;flex-shrink:0}\n.theme-toggle:hover{background:rgba(0,131,116,.1);text-decoration:none}\n.theme-toggle:focus-visible{outline:2px solid #00a58c;outline-offset:3px}\nbody[data-theme=\"dark\"] .theme-toggle:hover{background:rgba(139,226,204,.15)}\n.theme-toggle svg{display:block;pointer-events:none}\n"
,
"/* Compact header with one horizontal row; no wrapped second navigation line. */\n.top .wrap.nav{height:54px;min-height:54px;max-height:54px;display:flex;flex-wrap:nowrap;align-items:center;gap:12px}\n.top .brand{font-size:20px;line-height:1;flex:none;white-space:nowrap}\n.top .navlinks{display:flex;flex:1;min-width:0;align-items:center;gap:15px;overflow-x:auto;white-space:nowrap;scrollbar-width:none;margin-left:auto}\n.top .navlinks::-webkit-scrollbar{display:none}\n.top .navlinks a{flex:none;font-size:13px;line-height:1.4;padding:8px 1px}\n.top .theme-toggle{width:44px;min-width:44px;height:44px;min-height:44px;flex:none}\n.top .navlinks a:nth-child(1){color:#216f88}\n.top .navlinks a:nth-child(2){color:#69499b}\n.top .navlinks a:nth-child(3){color:#a23c65}\n.top .navlinks a:hover{color:#133c48}\nbody[data-theme=\"dark\"] .top .navlinks a:nth-child(1){color:#96d7f1}\nbody[data-theme=\"dark\"] .top .navlinks a:nth-child(2){color:#cbb7f9}\nbody[data-theme=\"dark\"] .top .navlinks a:nth-child(3){color:#ffb2d1}\nbody[data-theme=\"dark\"] .top .navlinks a:hover{color:#fff}\n.wrap.hero,body[data-theme=\"light\"] .wrap.hero{margin-top:14px;padding:24px 24px 22px}\n.hero .intro-steps li:nth-child(2) strong{color:#f4ce8c}\n.hero .intro-steps li:nth-child(3) strong{color:#ffb3bb}\n.hero .intro-guide{margin-top:12px;padding-top:11px}\n.hero .intro-actions{margin-top:14px;margin-bottom:6px}\n.hero .intro-primary{background:#f0d17f;color:#373012}\n.hero .intro-primary:hover,.hero .intro-primary:focus-visible{background:#f7e0a5}\n.hero .intro-secondary{color:#b8c9ff}\n.group#nube .section-title h2,.group#correo .section-title h2{color:#235f99}\n.group#juegos .section-title h2,.group#juegos-nuevos .section-title h2{color:#a63761}\n.group#comercio .section-title h2,.group#entretenimiento .section-title h2{color:#83551f}\n.group#ia-comunidad .section-title h2,.group#redes-globales .section-title h2{color:#7355a3}\nbody[data-theme=\"dark\"] .group#nube .section-title h2,body[data-theme=\"dark\"] .group#correo .section-title h2{color:#a3d6fd}\nbody[data-theme=\"dark\"] .group#juegos .section-title h2,body[data-theme=\"dark\"] .group#juegos-nuevos .section-title h2{color:#ffb0c8}\nbody[data-theme=\"dark\"] .group#comercio .section-title h2,body[data-theme=\"dark\"] .group#entretenimiento .section-title h2{color:#ffdb9c}\nbody[data-theme=\"dark\"] .group#ia-comunidad .section-title h2,body[data-theme=\"dark\"] .group#redes-globales .section-title h2{color:#d4bafa}\n.card{--logo-wash:#e9f4f1}\n.card[data-category=\"nube-e-infraestructura\"],.card[data-category=\"telecomunicaciones\"]{--logo-wash:#e7f3fc}\n.card[data-category=\"plataformas-digitales\"],.card[data-category=\"correo-y-productividad\"]{--logo-wash:#f1edfc}\n.card[data-category=\"videojuegos\"],.card[data-category=\"streaming\"]{--logo-wash:#fbeaf0}\n.card[data-category=\"comercio-global\"],.card[data-category=\"banca-y-pagos\"]{--logo-wash:#fff3dc}\n.card[data-category=\"servicios-publicos\"],.card[data-category=\"delivery-y-movilidad\"]{--logo-wash:#e8f6e8}\n.card[data-category=\"inteligencia-artificial\"]{--logo-wash:#f1eaff}\n.card[data-category=\"apuestas-y-loterias\"]{--logo-wash:#fbeef2}\n.card .logo-area{background:var(--logo-wash)}\n.card .category{color:var(--plot);font-weight:700}\nbody[data-theme=\"dark\"] .card[data-category=\"nube-e-infraestructura\"],body[data-theme=\"dark\"] .card[data-category=\"telecomunicaciones\"]{--plot:#a3d6fd}\nbody[data-theme=\"dark\"] .card[data-category=\"plataformas-digitales\"],body[data-theme=\"dark\"] .card[data-category=\"correo-y-productividad\"]{--plot:#d4bafa}\nbody[data-theme=\"dark\"] .card[data-category=\"videojuegos\"],body[data-theme=\"dark\"] .card[data-category=\"streaming\"]{--plot:#ffb0c8}\nbody[data-theme=\"dark\"] .card[data-category=\"comercio-global\"],body[data-theme=\"dark\"] .card[data-category=\"banca-y-pagos\"]{--plot:#ffdb9c}\nbody[data-theme=\"dark\"] .card[data-category=\"servicios-publicos\"],body[data-theme=\"dark\"] .card[data-category=\"delivery-y-movilidad\"]{--plot:#9ce6c5}\nbody[data-theme=\"dark\"] .card[data-category=\"inteligencia-artificial\"]{--plot:#d4bafa}\nbody[data-theme=\"dark\"] .card[data-category=\"apuestas-y-loterias\"]{--plot:#f4b0cf}\nbody[data-theme=\"dark\"] .card .category{color:var(--plot)}\n@media(max-width:760px){.top .wrap.nav{height:54px;min-height:54px;max-height:54px;gap:8px}.top .brand{font-size:18px}.top .navlinks{gap:12px}.top .navlinks a{font-size:12px}.wrap.hero,body[data-theme=\"light\"] .wrap.hero{margin-top:10px;padding:21px 16px 19px}}\n@media(max-width:375px){.top .wrap.nav{gap:7px}.top .brand{font-size:17px}.top .navlinks{gap:10px}.wrap.hero,body[data-theme=\"light\"] .wrap.hero{padding:19px 12px}}\n"
,
"/* Intentional: compact first screen. The full explanation lives in the footer. */\n.wrap.hero,body[data-theme=\"light\"] .wrap.hero,body[data-theme=\"dark\"] .wrap.hero{padding:20px 22px 16px;margin-top:10px}\n.hero .hero-top{display:block}\n.hero .hero-copy{max-width:100%}\n.hero .hero-copy h1{font-size:clamp(21px,3.3vw,32px);line-height:1.2;margin:0 0 7px}\n.hero .intro-lead{font-size:14px!important;line-height:1.55;margin:0 0 12px!important;max-width:680px!important}\n.hero .stats,.hero .intro-guide,.hero .eyebrow,.hero .intro-actions{display:none}\n.hero .hero-tools{padding-top:8px;margin-top:0}\n.hero .hero-tools .filters{gap:8px;flex-wrap:wrap}\n.hero .home-search-status{font-size:12px}\n.footer-inner{padding-top:22px;padding-bottom:18px}\n.footer-help{padding:0 0 18px}\n.footer-help h2{font-size:17px;line-height:1.4;margin:0 0 6px;color:#effaf7}\n.footer-help p{font-size:13px;line-height:1.6;color:#b9d5d3;margin:0 0 12px}\n.footer-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;list-style:none;margin:0;padding:0}\n.footer-steps li{display:flex;flex-direction:column;gap:4px;min-width:0}\n.footer-steps strong{color:#a7e5d7;font-size:13px}\n.footer-steps li:nth-child(2) strong{color:#ffdfa1}\n.footer-steps li:nth-child(3) strong{color:#ffc4d5}\n.footer-steps span{color:#cbdcde;font-size:12px;line-height:1.6}\n.footer-bottom{display:flex;justify-content:space-between;flex-wrap:wrap;align-items:center;gap:14px;border-top:1px solid #37515e;padding-top:14px;color:#b9d5d3;font-size:12px}\n.footer-bottom nav{display:flex;gap:20px;flex-wrap:wrap}\n.footer-bottom a{color:#b7ece2;text-decoration:underline;text-underline-offset:3px}\nbody[data-theme=\"light\"] .footer-help h2{color:#143d4c}\nbody[data-theme=\"light\"] .footer-help p,body[data-theme=\"light\"] .footer-steps span,body[data-theme=\"light\"] .footer-bottom{color:#3c5661}\nbody[data-theme=\"light\"] .footer-steps strong{color:#18665b}\nbody[data-theme=\"light\"] .footer-steps li:nth-child(2) strong{color:#80520e}\nbody[data-theme=\"light\"] .footer-steps li:nth-child(3) strong{color:#a63761}\nbody[data-theme=\"light\"] .footer-bottom{border-color:#d2dfe4}\nbody[data-theme=\"light\"] .footer-bottom a{color:#146b84}\n@media(max-width:760px){.wrap.hero,body[data-theme=\"light\"] .wrap.hero,body[data-theme=\"dark\"] .wrap.hero{padding:17px 14px 14px;margin-top:8px}.footer-steps{grid-template-columns:1fr;gap:10px}.footer-steps li{flex-direction:row;gap:9px}.footer-steps strong{flex:0 0 64px}.footer-steps span{min-width:0}.hero .hero-tools .filters{gap:6px}}\n"
].join('\n');

function monogram(name){const parts=name.trim().split(/\s+/);return parts.length>1?parts.slice(0,2).map((s)=>s[0]).join('').toUpperCase():name.slice(0,2).toUpperCase();}

/** DETERMINISTIC DEMO ONLY, independent of uptime, reports and time. */
function illustrativeSparkline(slug){
  let seed=2166136261;
  for(const char of slug){seed^=char.charCodeAt(0);seed=Math.imul(seed,16777619)>>>0;}
  const points=[];
  for(let i=0;i<25;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const variation=(seed>>>16)%17;
    const spike=(i%8===((seed>>>24)%8))?((seed>>>20)%24):0;
    const y=43-(8+variation+spike)*0.75;
    points.push((5+i*12.08).toFixed(1)+','+Math.max(5,Math.min(43,y)).toFixed(1));
  }
  return '<svg class="demo-chart" viewBox="0 0 300 48" preserveAspectRatio="none" role="img" '+
    'aria-label="Gráfico ilustrativo de '+escape(slug)+'; no representa incidentes reales">'+
    '<line x1="4" y1="43" x2="296" y2="43" stroke="currentColor" opacity=".17"/>'+
    '<polyline fill="none" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" points="'+points.join(' ')+'"/>'+
    '</svg>';
}

function card(s) {
  const logo=s.logo?'<img class="logo" loading="lazy" src="'+BASE+escape(s.logo)+'" alt="Logo de '+escape(s.name)+'" onerror="this.hidden=true;this.nextElementSibling.hidden=false">'+
    '<span class="monogram" hidden>'+escape(monogram(s.name))+'</span>'
    :'<span class="monogram">'+escape(monogram(s.name))+'</span>';
  return '<li class="card" data-name="'+escape(s.name.toLocaleLowerCase('es'))+'" data-category="'+escape(s.categorySlug)+'" data-slug="'+escape(s.slug)+'">'+
    '<a class="card-link" href="'+BASE+'/servicios/'+encodeURIComponent(s.slug)+'/'+'" aria-label="Ver ficha de '+escape(s.name)+'">'+
      '<span class="card-header"><span class="name">'+escape(s.name)+'</span><span class="category">'+escape(s.categoryName)+'</span></span>'+
      '<span class="logo-area">'+logo+'</span>'+
      '<span class="signal">'+illustrativeSparkline(s.slug)+
        '</span></a>'+
    '<div class="card-actions" role="group" aria-label="Acciones de '+escape(s.name)+'">'+
      
      '<button type="button" class="report-quick" data-report="'+escape(s.slug)+'" aria-label="Reportar falla de '+escape(s.name)+'" title="Reportar falla de '+escape(s.name)+'"><span aria-hidden="true">!</span></button>'+
      '<button type="button" class="star" data-fav="'+escape(s.slug)+'" aria-pressed="false" aria-label="Añadir '+escape(s.name)+' a favoritos">☆</button></div></li>';
}
function header(){
 return '<header class="top"><div class="wrap nav"><a class="brand" href="'+BASE+'/">Pulso<span>VE</span></a>'+
   '<nav class="navlinks" aria-label="Navegación"><a href="'+BASE+'/">Inicio</a><a href="'+BASE+'/servicios/">Servicios</a></nav>'+
   '<button type="button" id="theme-toggle" class="theme-toggle" aria-label="Cambiar a modo oscuro" title="Cambiar a modo oscuro" aria-pressed="false"><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg></button></div></header>';
}

const DEMO_REPORT_ISSUES = Object.fromEntries(categoriesSeed.map((category) => [
  category.slug, issueTypesSeed.filter((issue) =>
    issue.categorySlug === category.slug || issue.categorySlug === null
  ).map((issue) => ({slug: issue.slug, name: issue.name}))
]));
const REPORT_MODAL = '<dialog id="demo-report-dialog" class="report-dialog" aria-labelledby="demo-report-title">'+
'<h2 id="demo-report-title">Reportar falla: <span id="demo-report-service"></span></h2>'+
'<p>Este formulario no envía ni almacena reportes.</p>'+
'<form id="demo-report-form" method="dialog">'+
'<label for="demo-issue">Tipo de falla<select id="demo-issue" name="issue" required></select></label>'+
'<label for="demo-state">Estado de Venezuela<select id="demo-state" name="state" required><option value="">Seleccionar estado</option>'+
statesSeed.map((state)=>'<option value="'+escape(state.code)+'">'+escape(state.name)+'</option>').join('')+'</select></label>'+
'<label class="check"><input id="demo-consent" type="checkbox" required>Entiendo que no se enviará ningún reporte.</label>'+
'<p class="report-feedback" id="demo-report-feedback" role="status" aria-live="polite"></p>'+
'<div class="buttons"><button type="button" id="demo-report-close">Cancelar</button>'+
'<button type="submit">Probar formulario</button></div></form></dialog>';

function layout(title,body,description){
 return '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta name="robots" content="noindex,nofollow"><title>'+escape(title)+' — PulsoVE</title>'+
  '<meta name="description" content="'+escape(description)+'"><style>'+CSS+'</style></head><body>'+header()+
  '<main id="contenido">'+body+'</main><footer class="footer"><div class="wrap footer-inner">'+
  '<section class="footer-help" id="ayuda" aria-labelledby="footer-help-title"><h2 id="footer-help-title">¿Cómo usar PulsoVE?</h2>'+
  '<p>Busca un servicio, revisa su ficha y utiliza la opción de reportar cuando detectes un problema.</p>'+
  '<ol class="footer-steps"><li><strong>Busca</strong><span>Selecciona una plataforma o escribe su nombre.</span></li>'+
  '<li><strong>Revisa</strong><span>Consulta los detalles y el historial disponible.</span></li>'+
  '<li><strong>Reporta</strong><span>Utiliza el botón rojo en la ficha del servicio.</span></li></ol></section>'+
  '<div class="footer-bottom"><span>PulsoVE · Gráficos ilustrativos, no indicadores de disponibilidad actual.</span>'+
  '<nav aria-label="Enlaces del pie de página"><a href="'+BASE+'/servicios/">Servicios</a>'+
  '<a href="'+BASE+'/creditos-marcas/">Logos y créditos</a></nav></div></div></footer>'+REPORT_MODAL+
  '<script>const PREVIEW_ISSUES='+JSON.stringify(DEMO_REPORT_ISSUES).replace(/</g,'\\u003c')+';'+clientEnhance.toString()+';clientEnhance();'+demoChartInteraction.toString()+';demoChartInteraction();</script></body></html>';
}
function group(title,desc,items,id){
 const number=id==='ve'?'01':String(homeSections.findIndex((section)=>section.id===id)+2).padStart(2,'0');
 return '<section class="group" id="'+escape(id)+'"><div class="section-title">'+
   '<div class="section-heading"><span class="section-index" aria-hidden="true">'+number+'</span><h2>'+escape(title)+'</h2></div>'+
   '<a href="'+BASE+'/servicios/">Ver todos</a></div><p class="hint">'+escape(desc)+'</p>'+
   '<ul class="cards">'+items.map(card).join('')+'</ul></section>';
}
const homeSelected=HOME_SERVICE_SLUGS.map((slug)=>bySlug.get(slug)).filter(Boolean);
const homeSections=WORLDWIDE_SPOTLIGHT.map((section)=>({
 id:section.id,title:section.title,description:section.description,
 items:section.slugs.map((slug)=>bySlug.get(slug)).filter(Boolean)
}));
if(homeSections.length!==8||homeSections.some((s)=>s.items.length!==6))throw Error('All eight global spotlight groups need 6 items');

const hero='<div class="wrap hero"><div class="hero-top"><div class="hero-copy">'+
'<h1>¿Tu internet, banco o aplicación está fallando?</h1>'+
'<p class="intro-lead">Busca tu servicio y consulta su información en PulsoVE.</p>'+
'</div></div><div class="hero-tools"><div class="filters"><input id="quicksearch" type="search" class="input" placeholder="Buscar un servicio, juego o aplicación…" aria-label="Buscar entre tarjetas visibles">'+
'<button id="reset-home-search" class="reset-home-search" type="button" hidden>Limpiar</button>'+
'<a class="chip" href="'+BASE+'/servicios/">Ver plataformas</a></div>'+
'<div class="filters" role="group" aria-label="Filtrar destacados por tipo">'+
'<button type="button" class="chip" data-home-filter="" aria-pressed="true">Todos</button>'+
'<button type="button" class="chip" data-home-filter="nube-e-infraestructura" aria-pressed="false">Nube</button>'+
'<button type="button" class="chip" data-home-filter="correo-y-productividad" aria-pressed="false">Correo</button>'+
'<button type="button" class="chip" data-home-filter="videojuegos" aria-pressed="false">Videojuegos</button>'+
'<button type="button" class="chip" data-home-filter="inteligencia-artificial" aria-pressed="false">IA</button>'+
'</div><p class="home-search-status" id="home-search-count" aria-live="polite">Destacados</p></div></div>';

const officialSourcesPanel='<section class="group" id="microsoft-status"><div class="section-title"><h2>Estado oficial de Microsoft</h2></div>'+
'<p class="hint">Estado oficial no consultado. Comprueba la fuente para ver información actual.</p>'+
'<ul class="cards">'+MICROSOFT_FEEDS.map((feed)=>'<li class="card"><div class="card-link"><strong class="name">'+escape(feed.name)+'</strong>'+
'<p class="category">'+escape(feed.scope)+'</p><div class="logo-area"><span class="monogram">MS</span></div>'+
'<span class="signal">Estado actual: no consultado</span><a class="chip" target="_blank" rel="noopener noreferrer" href="'+escape(feed.statusUrl)+'">Fuente oficial</a></div></li>').join('')+'</ul></section>';
const indexBody=hero+'<div class="wrap">'+group('Destacados de Venezuela','Servicios tradicionales del catálogo, con identificadores de marca cuando hay archivos verificados.',homeSelected,'ve')+
homeSections.map((s)=>group(s.title,s.description,s.items,s.id)).join('')+
'<p id="home-empty" class="noresults" hidden>No encontramos servicios destacados con esa búsqueda. Prueba otro término o abre el directorio completo.</p>'+
'</div>';
const indexHtml=layout('Servicios y plataformas internacionales',indexBody,'Consulta el catálogo de servicios de Venezuela y plataformas internacionales.');

const options=categoriesSeed.map((cat)=>'<option value="'+escape(cat.slug)+'">'+escape(cat.name)+'</option>').join('');
const dirBody='<div class="wrap directory"><div class="hero"><div class="eyebrow">Directorio completo</div>'+
'<h1>Plataformas y servicios</h1>'+
'<p>Busca por plataforma, filtra por sector y organiza tus favoritos.</p>'+
'<div class="filterbar"><input id="directory-search" class="input" type="search" placeholder="Buscar plataforma por nombre…" aria-label="Buscar plataformas">'+
'<select id="category-filter" aria-label="Filtrar por categoría"><option value="">Todas las categorías</option>'+options+'</select>'+
'<select id="directory-sort" aria-label="Ordenar servicios"><option value="name">Nombre A–Z</option><option value="category">Por categoría</option><option value="favorites">Favoritos primero</option></select>'+
'<label class="chip"><input type="checkbox" id="favorites-only"> Solo mis favoritos</label></div>'+
'<p class="result" id="result-count" aria-live="polite">'+catalog.length+' servicios</p></div>'+
'<ul class="cards" id="directory-cards">'+catalog.map(card).join('')+'</ul>'+
'<p class="noresults" id="empty-result" hidden>No se encontraron servicios con estos filtros.</p></div>';
const directoryHtml=layout('Directorio global de servicios',dirBody,'Directorio de '+catalog.length+' plataformas, servicios cloud, correo y juegos.');


/** Every catalogued service has a directly accessible, static, noindex profile. */
function serviceDetailHtml(s){
  const profile=getServiceProfile({
    slug:s.slug,name:s.name,categorySlug:s.categorySlug,
    categoryName:s.categoryName,description:s.description
  });
  const mark=s.logo
    ? '<img class="logo" src="'+BASE+escape(s.logo)+'" alt="Logo de '+escape(s.name)+'" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="monogram" hidden>'+escape(monogram(s.name))+'</span>'
    : '<span class="monogram">'+escape(monogram(s.name))+'</span>';
  const tags=profile.tags.map((tag)=>'<span>'+escape(tag)+'</span>').join('');
  const uses=profile.mainUses.map((item)=>'<li>'+escape(item)+'</li>').join('');
  const source=profile.sourceUrl
    ? '<p class="profile-note">Reseña editorial contrastada con información del proveedor: <a class="profile-source" target="_blank" rel="noopener noreferrer" href="'+escape(profile.sourceUrl)+'">Consultar la fuente</a>.</p>'
    : '<p class="profile-note">Reseña editorial pendiente de verificación independiente. No constituye información oficial de la empresa.</p>';
  const body='<div class="wrap service-detail">'+
    '<nav class="breadcrumbs" aria-label="Ruta de navegación"><a href="'+BASE+'/">Inicio</a> / <a href="'+BASE+'/servicios/">Servicios</a> / '+escape(s.name)+'</nav>'+
    '<section class="profile-hero" aria-labelledby="profile-name">'+
      '<div class="profile-logo">'+mark+'</div><div><p class="eyebrow">'+escape(profile.type)+'</p>'+
      '<h1 id="profile-name">'+escape(s.name)+'</h1><p>'+escape(profile.description)+'</p>'+
      '<div class="profile-tags" aria-label="Etiquetas de la plataforma">'+tags+'</div></div></section>'+
    '<div class="profile-grid">'+
      '<section class="profile-panel"><h2>Ficha de la plataforma</h2>'+
        '<h3>Proveedor o fabricante</h3><p class="profile-value">'+escape(profile.provider||'Por verificar')+'</p>'+
        '<h3>Tipo de servicio</h3><p class="profile-value">'+escape(profile.type)+'</p>'+
        '<p class="profile-note">Información editorial orientativa. La identificación no supone afiliación con PulsoVE.</p></section>'+
      '<section class="profile-panel"><h2>Estado y alcance</h2>'+
        '<p class="profile-value">Estado actual no consultado</p>'+
        '<p>Comprueba la fuente oficial del proveedor para consultar su estado actual.</p>'+
        '<p class="profile-note">La ausencia de reportes no confirma disponibilidad.</p></section>'+
      '<section class="profile-panel profile-wide"><h2>Acerca de la empresa y el servicio</h2>'+
        '<p class="profile-about">'+escape(profile.companyOverview)+'</p>'+
        '<h3>Principales usos y productos</h3><ul class="profile-list">'+uses+'</ul>'+source+
        '<h3>Qué significa un reporte aquí</h3><p>'+escape(profile.monitoringContext)+'</p></section>'+
      '<section class="profile-panel profile-wide"><h2>Gráfica detallada de reportes</h2>'+
        '<p class="profile-note">Gráfico ilustrativo, sin reportes ni métricas reales de disponibilidad.</p>'+
        '<div class="chart-controls">'+
          '<label for="demo-range">Rango temporal<select id="demo-range"><option value="24h">24 horas</option><option value="7d">7 días</option><option value="30d">30 días</option><option value="90d">90 días</option></select></label>'+
          '<label for="demo-mode">Tipo de gráfico<select id="demo-mode"><option value="linea">Línea</option><option value="area">Área</option><option value="barras">Barras</option></select></label>'+
          '<label for="demo-point">Consultar fecha de muestra<select id="demo-point" aria-label="Seleccionar intervalo de ejemplo"></select></label>'+
        '</div>'+
        '<div class="chart-summary"><span>Puntos ilustrativos del rango: <strong id="demo-total">—</strong></span><span>Máximo del intervalo: <strong id="demo-maximum">—</strong></span><span class="chart-key sample">Ejemplos, no fallas reales</span></div>'+
        '<div class="profile-chart chart-shell"><svg id="detail-chart" data-service="'+escape(s.slug)+'" viewBox="0 0 920 315" preserveAspectRatio="none" tabindex="0" role="img" aria-label="Gráfico ficticio interactivo: mueve el puntero, haz clic o utiliza las flechas para seleccionar un intervalo"></svg>'+
          '<div class="chart-readout" id="demo-chart-readout" aria-live="polite">Seleccione un periodo o mueva el puntero por la gráfica.</div></div>'+
        '<aside class="chart-observation" aria-label="Observaciones del intervalo seleccionado"><strong id="demo-observation-date">Observaciones por fecha</strong>'+
          '<p id="demo-observation-text">Selecciona una fecha para consultar una anotación ilustrativa.</p></aside>'+
        '</section>'+
      '<section class="profile-panel profile-wide"><h2>Historial de incidentes</h2>'+
        '<div class="profile-incident">Sin historial verificado disponible. No es posible confirmar que el servicio haya funcionado sin interrupciones.</div></section>'+
    '</div><a class="profile-back" href="'+BASE+'/servicios/">Volver a servicios</a></div>';
  return layout('Ficha de '+s.name,body,'Información de '+s.name+': empresa, principales usos y gráfico ilustrativo.');
}

const credits=Object.entries(HOME_BRAND_LOGOS).map(([slug,path])=>{
 const source=brandLogoSource(slug,path);
 return '<li><strong>'+escape(bySlug.get(slug)?.name||slug)+'</strong> · archivo local '+escape(path)+
  ' · Procedencia: <a href="'+escape(source.url)+'" target="_blank" rel="noopener noreferrer">'+escape(source.provider)+'</a>'+
  (source.licenseUrl?' · <a href="'+escape(source.licenseUrl)+'" target="_blank" rel="noopener noreferrer">Licencia de la iconografía</a>':'')+'</li>';
}).join('');
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
   const order=document.querySelector('#directory-sort')?.value||'name';
   const saved=read();let visible=0;
   const container=document.querySelector('#directory-cards');
   if(!container)return;
   const cards=Array.from(container.querySelectorAll('.card'));
   const nameSort=(a,b)=>a.dataset.name.localeCompare(b.dataset.name,'es');
   cards.sort((a,b)=>{
     if(order==='favorites'){const delta=Number(saved.includes(b.dataset.slug))-Number(saved.includes(a.dataset.slug));if(delta)return delta;}
     if(order==='category'){const delta=a.dataset.category.localeCompare(b.dataset.category,'es');if(delta)return delta;}
     return nameSort(a,b);
   });
   container.append(...cards);
   for(const el of cards){
     const ok=(!text||el.dataset.name.includes(text)||el.dataset.slug.includes(text))&&(!cat||el.dataset.category===cat)&&(!fav||saved.includes(el.dataset.slug));
     el.hidden=!ok;if(ok)visible++;
   }
   const count=document.querySelector('#result-count');if(count)count.textContent=visible+' servicios';
   const empty=document.querySelector('#empty-result');if(empty)empty.hidden=visible!==0;
 }
 document.querySelectorAll('[data-fav]').forEach((el)=>el.addEventListener('click',()=>{
   const id=el.dataset.fav;const list=read();
   const updated=list.includes(id)?list.filter((item)=>item!==id):[...list,id].slice(-80);
   try{localStorage.setItem(KEY,JSON.stringify(updated))}catch{}
   refresh();
 }));
 for(const selector of ['#directory-search','#category-filter','#favorites-only','#directory-sort']){
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
 // Theme is a visual preference only. No personal data is sent to a server.
 const themeKey='pulsove:appearance:v1';
 const themeToggle=document.querySelector('#theme-toggle');
 let selectedTheme='light';
 try { selectedTheme=localStorage.getItem(themeKey)==='dark'?'dark':'light'; } catch{}
 function setTheme(theme){
   document.body.dataset.theme=theme;
   if(themeToggle){
     themeToggle.setAttribute('aria-pressed',String(theme==='dark'));
     const label=theme==='light'?'Cambiar a modo oscuro':'Cambiar a modo claro';
     themeToggle.title=label;
     themeToggle.setAttribute('aria-label',label);
     themeToggle.innerHTML=theme==='light'
       ? '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>'
       : '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
   }
 }
 setTheme(selectedTheme);
 themeToggle?.addEventListener('click',()=>{
   const theme=document.body.dataset.theme==='light'?'dark':'light';
   setTheme(theme);
   try{localStorage.setItem(themeKey,theme)}catch{}
 });
 const pathname=location.pathname;
 document.querySelectorAll('.navlinks a').forEach((anchor)=>{
   const target=new URL(anchor.href,location.href).pathname;
   if(pathname===target||(target.endsWith('/servicios/')&&pathname.includes('/servicios/'))){
     anchor.setAttribute('aria-current','page');
   }
 });
 const quick=document.querySelector('#quicksearch');
 const homeFilters=Array.from(document.querySelectorAll('[data-home-filter]'));
 function filterHome(){
   const query=(quick?.value||'').toLocaleLowerCase('es').trim();
   const selected=homeFilters.find(el=>el.getAttribute('aria-pressed')==='true')?.dataset.homeFilter||'';
   let count=0;
   document.querySelectorAll('main .group').forEach((group)=>{
     let visible=0;
     group.querySelectorAll('.card').forEach((card)=>{
       const ok=(!query||card.dataset.name.includes(query)||card.dataset.slug.includes(query))&&(!selected||card.dataset.category===selected);
       card.hidden=!ok;
       if(ok){visible++;count++;}
     });
     group.hidden=visible===0;
   });
   const total=document.querySelector('#home-search-count');
   if(total)total.textContent=query||selected?count+' resultados':'Destacados';
   const empty=document.querySelector('#home-empty');
   if(empty)empty.hidden=count!==0;
   const reset=document.querySelector('#reset-home-search');
   if(reset)reset.hidden=!query&&!selected;
 }
 quick?.addEventListener('input',filterHome);
 homeFilters.forEach((button)=>button.addEventListener('click',()=>{
   homeFilters.forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
   filterHome();
 }));
 document.querySelector('#reset-home-search')?.addEventListener('click',()=>{
   if(quick)quick.value='';
   homeFilters.forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.homeFilter==='')));
   filterHome();quick?.focus();
 });
 document.addEventListener('keydown',(event)=>{
   if(event.key==='/'&&!event.altKey&&!event.ctrlKey&&!event.metaKey){
     const tag=document.activeElement?.tagName;
     if(tag!=='INPUT'&&tag!=='TEXTAREA'&&tag!=='SELECT'&&quick){
       event.preventDefault();quick.focus();
     }
   } else if(event.key==='Escape'&&document.activeElement===quick){
     if(quick)quick.value='';filterHome();quick?.blur();
   }
 });
 if(document.querySelector('#directory-sort'))filterDirectory();
 if(quick)filterHome();
 const query=new URLSearchParams(location.search);
 const selected=query.get('s');
 if(selected&&document.querySelector('#directory-search')){
   const input=document.querySelector('#directory-search');
   const target=document.querySelector('[data-slug="'+CSS.escape(selected)+'"]');
   if(target){input.value=target.dataset.name;filterDirectory();target.scrollIntoView({block:'center'});}
 }
 refresh();
}


/**
 * Stand-alone client-side preview. Synthetic and deterministic, with a fixed
 * example reference date. It never contacts a service, reads backend data or
 * saves user selections. All values are explicitly described as fictitious.
 */
function demoChartInteraction(){
 const svg=document.getElementById('detail-chart');
 if(!svg)return;
 const range=document.getElementById('demo-range');
 const mode=document.getElementById('demo-mode');
 const picker=document.getElementById('demo-point');
 const readout=document.getElementById('demo-chart-readout');
 const summaryTotal=document.getElementById('demo-total');
 const summaryMax=document.getElementById('demo-maximum');
 const noteDate=document.getElementById('demo-observation-date');
 const noteText=document.getElementById('demo-observation-text');
 const counts={'24h':24,'7d':7,'30d':30,'90d':90};
 const fixedEnd=Date.UTC(2026,10,12,18,0);
 let points=[];let hovered=-1;let selected=-1;
 const padding={left:56,right:21,top:22,bottom:254};
 const availableWidth=920-padding.left-padding.right;
 function synth(period){
   const n=counts[period]||24;
   const hours=period==='24h'?1:24;
   let seed=2166136261;
   for(const ch of svg.dataset.service+period){seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;}
   return Array.from({length:n},(_,index)=>{
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const wave=Math.sin((index+3)*0.49)*7;
      const fake=Math.max(2,Math.round(13+wave+(seed>>>17)%17+(index%9===4?9:0)));
      const date=new Date(fixedEnd-(n-1-index)*hours*60*60*1000);
      const label=period==='24h'
        ? new Intl.DateTimeFormat('es-VE',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',hour12:false}).format(date)
        : new Intl.DateTimeFormat('es-VE',{timeZone:'UTC',day:'2-digit',month:'short'}).format(date);
      return {label,date:date.toISOString().slice(0,16).replace('T',' '),value:fake};
   });
 }
 const xAt=(i)=>padding.left+(i+0.5)*availableWidth/points.length;
 function picked(index){
   if(!points.length)return;
   selected=Math.max(0,Math.min(points.length-1,index));
   picker.value=String(selected);
   const point=points[selected];
   noteDate.textContent='Intervalo ilustrativo: '+point.date+' UTC';
   const marks=new Set([Math.floor(points.length*0.28),Math.floor(points.length*0.72)]);
   noteText.textContent=marks.has(selected)
     ? 'Cambio ilustrativo en la curva. No representa una falla confirmada.'
     : 'Sin observaciones verificadas para esta fecha.';
   render();
 }
 function render(){
   if(!points.length)return;
   const top=padding.top,bottom=padding.bottom,rangeY=bottom-top;
   const max=Math.max(10,...points.map(p=>p.value))*1.14;
   const y=(v)=>bottom-v/max*rangeY;
   const x=(i)=>xAt(i);
   let pieces=['<rect width="920" height="315" fill="transparent"/>'];
   for(let tick=0;tick<=4;tick++){
     const val=max*tick/4,ty=y(val);
     pieces.push('<line x1="56" y1="'+ty.toFixed(1)+'" x2="900" y2="'+ty.toFixed(1)+'" stroke="#3a5266" stroke-dasharray="4 5"/>');
     pieces.push('<text x="46" y="'+(ty+4).toFixed(1)+'" text-anchor="end" fill="#a1b9c8" font-size="12">'+Math.round(val)+'</text>');
   }
   const xy=points.map((p,i)=>[x(i),y(p.value)]);
   const line=xy.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+','+p[1].toFixed(2)).join(' ');
   if(mode.value==='barras'){
     const barWidth=Math.max(2,Math.min(22,availableWidth/points.length*0.72));
     pieces.push(...xy.map(([xv,yv])=>'<rect x="'+(xv-barWidth/2).toFixed(2)+'" y="'+yv.toFixed(2)+'" width="'+barWidth.toFixed(2)+'" height="'+(bottom-yv).toFixed(2)+'" rx="2" fill="#50cbb9" opacity=".85"/>'));
   }else{
     if(mode.value==='area'){
       pieces.push('<path d="'+line+' L'+xy[xy.length-1][0].toFixed(2)+','+bottom+' L'+xy[0][0].toFixed(2)+','+bottom+' Z" fill="#2ab8a3" opacity=".2"/>');
     }
     pieces.push('<path d="'+line+'" stroke="#66ead8" stroke-width="3" stroke-linejoin="round" fill="none" vector-effect="non-scaling-stroke"/>');
   }
   for(const mark of [Math.floor(points.length*0.28),Math.floor(points.length*0.72)]){
      pieces.push('<circle cx="'+x(mark).toFixed(2)+'" cy="'+y(points[mark].value).toFixed(2)+'" r="6" fill="#ffb47b" stroke="#142b38" stroke-width="2"/>');
   }
   const active=hovered>=0?hovered:selected>=0?selected:points.length-1;
   const xpos=x(active), ypos=y(points[active].value);
   pieces.push('<line x1="'+xpos.toFixed(2)+'" y1="'+top+'" x2="'+xpos.toFixed(2)+'" y2="'+bottom+'" stroke="#a8f9ea" stroke-width="1.5" stroke-dasharray="5 5"/>');
   pieces.push('<circle cx="'+xpos.toFixed(2)+'" cy="'+ypos.toFixed(2)+'" r="6" fill="#d9fff6" stroke="#087969" stroke-width="3"/>');
   for(const tickIndex of [0,Math.floor((points.length-1)/2),points.length-1]){
     pieces.push('<text x="'+x(tickIndex).toFixed(2)+'" y="283" text-anchor="middle" fill="#b0c3d1" font-size="12">'+points[tickIndex].label+'</text>');
   }
   svg.innerHTML=pieces.join('');
   readout.textContent=points[active].date+' UTC · '+points[active].value+' puntos ilustrativos';
 }
 function reset(){
   points=synth(range.value);
   hovered=-1;selected=-1;
   picker.replaceChildren();
   for(let i=0;i<points.length;i++){
     const option=document.createElement('option');
     option.value=String(i);option.textContent=points[i].date+' UTC';
     picker.append(option);
   }
   const total=points.reduce((sum,p)=>sum+p.value,0);
   summaryTotal.textContent=String(total);
   summaryMax.textContent=String(Math.max(...points.map(p=>p.value)));
   picked(points.length-1);
 }
 function atPointer(event){
   const rect=svg.getBoundingClientRect();
   const svgX=(event.clientX-rect.left)/rect.width*920;
   const n=points.length;
   return Math.max(0,Math.min(n-1,Math.round((svgX-padding.left)/availableWidth*n-0.5)));
 }
 svg.addEventListener('pointermove',(event)=>{
   const idx=atPointer(event);if(idx!==hovered){hovered=idx;render();}
 });
 svg.addEventListener('pointerleave',()=>{hovered=-1;render();});
 // Select on pointerdown: SVG child nodes are redrawn on hover, which can suppress the later click event.
 svg.addEventListener('pointerdown',(event)=>{if(event.pointerType==='mouse'&&event.button!==0)return;picked(atPointer(event));});
 svg.addEventListener('keydown',(event)=>{
   if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
     event.preventDefault();
     picked((selected<0?0:selected)+(event.key==='ArrowRight'?1:-1));
   }else if(event.key==='Home'){event.preventDefault();picked(0);}
   else if(event.key==='End'){event.preventDefault();picked(points.length-1);}
 });
 range.addEventListener('change',reset);
 mode.addEventListener('change',render);
 picker.addEventListener('change',()=>picked(Number(picker.value)));
 reset();
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
 writeFile(join(OUTPUT,'build-info.txt'),'mode=synthetic-public-demo\ncatalogue='+catalog.length+'\nlogos='+Object.keys(HOME_BRAND_LOGOS).length+'\nsource-commit='+(process.env.GITHUB_SHA||'local')+'\n')
]);
await Promise.all(catalog.map(async (service)=>{
  const folder=join(OUTPUT,'servicios',service.slug);
  await mkdir(folder,{recursive:true});
  await writeFile(join(folder,'index.html'),serviceDetailHtml(service));
}));
for(const path of Object.values(HOME_BRAND_LOGOS)){
  const filename=path.slice(1);
  await mkdir(join(OUTPUT,'brands'),{recursive:true});
  await copyFile(join('public',filename),join(OUTPUT,filename));
}
console.log('Built GitHub Pages public demo: '+catalog.length+' services / '+categoriesSeed.length+' categories / '+homeSections.length+' global sections / '+Object.keys(HOME_BRAND_LOGOS).length+' local logos');
