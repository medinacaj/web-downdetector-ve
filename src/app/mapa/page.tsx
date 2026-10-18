import type { Metadata } from 'next';
import { eq,sql,gte } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { states,reports } from '@/lib/db/schema';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Mapa esquemático',description:'Actividad ciudadana de reportes por estado, sin mostrar posiciones personales.',alternates:{canonical:'/mapa'}};
export default async function MapPage(){
 const since=new Date(Date.now()-24*60*60*1000);
 const rows=await db.select({name:states.name,code:states.code,row:states.gridRow,col:states.gridCol,
   count:sql<number>`count(${reports.id})::int`})
   .from(states).leftJoin(reports,eq(reports.stateId,states.id))
   .where(eq(states.active,true))
   .groupBy(states.id).orderBy(states.name);
 const max=Math.max(0,...rows.map(s=>s.count));
 return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
  <h1 className="font-display text-3xl font-semibold">Actividad geográfica</h1>
  <p className="mt-3 text-sm text-ink-muted">Vista de regiones mediante cuadrícula esquemática; no es un mapa geográfico exacto ni un indicador concluyente de interrupciones. No se muestran ubicaciones individuales.</p>
  <p className="mt-2 text-xs text-ink-muted">Conteo histórico agregado del sistema, sin atribuirlo a las últimas 24 horas.</p>
  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{rows.map(s=><div key={s.code} className="rounded-lg border border-border bg-surface p-3">
   <h2 className="font-medium">{s.name}</h2>
   <p className="mt-2 text-sm text-ink-muted">{s.count} reportes registrados</p>
   <div className="mt-2 h-2 rounded bg-border"><div className="h-full rounded bg-pulse-500" style={{width:`${max?100*s.count/max:0}%`}}/></div>
  </div>)}</div>
  {!rows.length&&<p className="mt-6 text-ink-muted">No hay regiones cargadas.</p>}
 </main>;
}
