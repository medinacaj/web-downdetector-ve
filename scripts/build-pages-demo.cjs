const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const stage = path.join(root, '.runtime/pages-demo');
const basePath = '/web-downdetector-ve';
fs.mkdirSync(path.dirname(stage), { recursive: true });
fs.rmSync(stage, { force: true, recursive: true });
fs.mkdirSync(stage);
for (const name of ['src', 'package.json', 'tsconfig.json', 'tailwind.config.ts', 'postcss.config.js']) {
  fs.cpSync(path.join(root, name), path.join(stage, name), { recursive: true });
}
function write(name, value) {
  const target = path.join(stage, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}
function transform(name, modify) { write(name, modify(fs.readFileSync(path.join(stage, name), 'utf8'))); }
for (const name of ['src/app/api', 'src/app/robots.ts', 'src/app/sitemap.ts']) fs.rmSync(path.join(stage, name), { recursive: true, force: true });
write('next.config.mjs', `export default { output: 'export', basePath: '${basePath}', trailingSlash: true, poweredByHeader: false, images: { unoptimized: true } };\n`);
write('public/robots.txt', 'User-agent: *\nDisallow: /\n');
write('src/demo-pages/data.ts', fs.readFileSync(path.join(root, 'demo-pages/data.ts'), 'utf8').replaceAll("'../src/", "'../"));
write('src/demo-pages/Directory.tsx', fs.readFileSync(path.join(root, 'demo-pages/Directory.tsx'), 'utf8').replaceAll("'../src/", "'../"));
write('src/components/service/ReportForm.tsx', fs.readFileSync(path.join(root, 'demo-pages/ReportForm.tsx'), 'utf8'));
write('src/lib/queries/home.ts', "export { getHomeData } from '@/demo-pages/data';\n");
write('src/lib/queries/service-detail.ts', "export { getServiceDetailData } from '@/demo-pages/data';\n");
write('src/lib/queries/directory.ts', "export type { DirectoryService, DirectorySort } from '@/demo-pages/data';\n");
write('src/app/servicios/page.tsx', "import Directory from '@/demo-pages/Directory';\nexport default Directory;\n");
transform('src/app/servicios/[slug]/page.tsx', text => text + "\nexport async function generateStaticParams() { const { demoCatalog } = await import('@/demo-pages/data'); return demoCatalog.map(s => ({ slug: s.slug })); }\n");
transform('src/app/mapa/page.tsx', text => text
  .replace("import { eq,sql } from 'drizzle-orm';", "import { demoStates } from '@/demo-pages/data';")
  .replace(/import \{ db \}[^\n]+\n|import \{ states,reports \}[^\n]+\n|export const dynamic='force-dynamic';\n/g, '')
  .replace(/const rows=await db\.select[\s\S]*?\.groupBy\(states.id\)\.orderBy\(states.name\);/, 'const rows=demoStates;'));
transform('src/app/incidentes/page.tsx', text => text
  .replace(/import \{ eq,desc \}[^\n]+\n|import \{ db \}[^\n]+\n|import \{ incidents,services \}[^\n]+\n|export const dynamic='force-dynamic';\n/g, '')
  .replace(/const data=await db\.select[\s\S]*?\.limit\(100\);/, 'const data: { id: string; status: string; startedAt: Date; service: string; slug: string; official: boolean }[] = [];'));
transform('src/app/estadisticas/page.tsx', text => text.replace("export const dynamic='force-dynamic';", ''));
for (const name of ['src/app/page.tsx', 'src/components/layout/Header.tsx']) transform(name, text => text.replaceAll('action="/servicios"', `action="${basePath}/servicios/"`));
transform('src/app/layout.tsx', text => text.replace('<Header />', `<aside role="note" className="border-b border-border bg-surface px-4 py-3 text-center text-sm"><strong>Demo estática de PulsoVE.</strong> Datos ficticios; no refleja caídas reales. Los formularios no envían ni guardan reportes.</aside><Header />`));
// Construcción sin secretos heredados: solo el entorno de ejecución/red imprescindible.
const keep = /^(PATH|HOME|USER|TMPDIR|TEMP|TMP|LANG|LC_ALL|CI|NODE_EXTRA_CA_CERTS|SSL_CERT_FILE|SSL_CERT_DIR|HTTPS?_PROXY|https?_proxy|ALL_PROXY|all_proxy|NO_PROXY|no_proxy)$/;
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => keep.test(key)));
Object.assign(env, { NEXT_TELEMETRY_DISABLED: '1', NODE_USE_ENV_PROXY: '1', PUBLIC_INDEXABLE: 'false', SITE_URL: '', ENABLE_TURNSTILE: 'false' });
const result = spawnSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build', '--webpack'], { cwd: stage, env, stdio: 'inherit', timeout: 600000 });
if (result.status !== 0) { console.error('No se completó la exportación estática.', result.error?.message || ''); process.exit(1); }
write('out/.nojekyll', '');
write('out/demo-version.json', JSON.stringify({ kind: 'static-demo', fictionalData: true, persistsReports: false, basePath }, null, 2));
console.log('Exportación preparada en .runtime/pages-demo/out');
