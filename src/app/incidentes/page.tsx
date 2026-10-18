import Link from 'next/link';
import type { Metadata } from 'next';
import { eq,desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { incidents,services } from '@/lib/db/schema';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Incidentes',description:'Registro histórico de señales de incidentes con evidencia y cautelas.',alternates:{canonical:'/incidentes'}};
const labels:Record<string,string>={possible:'Posible interrupción',detected:'Interrupción detectada',high_confidence:'Interrupción de alta confianza',confirmed:'Confirmación registrada',recovering:'En recuperación',resolved:'Resuelto'};
export default async function IncidentsPage(){
 const data=await db.select({id:incidents.id,status:incidents.status,confidence:incidents.confidence,startedAt:incidents.startedAt,endedAt:incidents.endedAt,service:services.name,slug:services.slug,official:incidents.officiallyConfirmed})
 .from(incidents).innerJoin(services,eq(services.id,incidents.serviceId)).orderBy(desc(incidents.startedAt)).limit(100);
 return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
  <h1 className="font-display text-3xl font-semibold">Registro de incidentes</h1>
  <p className="mt-3 text-sm text-ink-muted">Señales registradas por el sistema, no necesariamente confirmaciones oficiales. Historial limitado a los 100 más recientes.</p>
  {!data.length?<p className="mt-8 rounded-lg border border-border bg-surface p-5">Aún no existen incidentes registrados. Esto no prueba que todos los servicios estén disponibles.</p>:
  <ul className="mt-6 divide-y divide-border">{data.map(item=><li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-4">
   <div><Link className="font-medium underline-offset-2 hover:underline" href={`/servicios/${item.slug}`}>{item.service}</Link>
   <p className="mt-1 text-sm text-ink-muted">{labels[item.status]||'Estado no determinado'} · {new Intl.DateTimeFormat('es-VE',{timeZone:'America/Caracas',dateStyle:'medium',timeStyle:'short'}).format(item.startedAt)}</p></div>
   <span className="text-sm text-ink-muted">{item.official?'Confirmación del proveedor registrada':'Sin confirmación oficial'}</span>
   </li>)}</ul>}
 </main>;
}
