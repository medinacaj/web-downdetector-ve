import type { Metadata } from 'next';
import { getHomeData } from '@/lib/queries/home';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Estadísticas',description:'Cifras agregadas de reportes e incidentes con sus limitaciones.',alternates:{canonical:'/estadisticas'}};
export default async function StatisticsPage(){
 const {totals,generatedAt,services,hasAnyActivity}=await getHomeData();
 const values=[['Reportes últimas 24 h',totals.reportsLast24h],['Reportes históricos',totals.reportsAllTime],['Servicios activos',totals.servicesCount],['Incidentes sin resolver',totals.incidentsOpen]];
 return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
   <h1 className="font-display text-3xl font-semibold">Estadísticas agregadas</h1>
   <p className="mt-3 text-sm text-ink-muted">Corte {new Intl.DateTimeFormat('es-VE',{timeZone:'America/Caracas',dateStyle:'medium',timeStyle:'short'}).format(generatedAt)} (hora Venezuela). Son registros recibidos, no estimaciones de población afectada.</p>
   <dl className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{values.map(([name,value])=><div key={String(name)} className="rounded-lg border border-border bg-surface p-4"><dt className="text-sm text-ink-muted">{name}</dt><dd className="mt-2 font-mono text-2xl">{value}</dd></div>)}</dl>
   {!hasAnyActivity&&<p className="mt-6 rounded-lg border border-border p-4 text-sm text-ink-muted">Aún no existe actividad suficiente para interpretar tendencias. Cero reportes no confirma disponibilidad normal.</p>}
   <h2 className="mt-10 font-display text-xl font-semibold">Actividad de servicios en 24 horas</h2>
   <ul className="mt-4 divide-y divide-border">{services.filter(s=>s.reportsLast24h>0).sort((a,b)=>b.reportsLast24h-a.reportsLast24h).slice(0,25).map(s=>
    <li key={s.slug} className="flex justify-between gap-4 py-3"><span>{s.name}</span><span className="font-mono tabular-nums">{s.reportsLast24h} reportes</span></li>)}</ul>
   <p className="mt-5 text-xs text-ink-muted">La ausencia de incidentes confirmados puede reflejar falta de fuentes. No sustituye la comunicación del proveedor.</p>
 </main>;
}
