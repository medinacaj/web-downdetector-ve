const severityOrder={critical:0,high:1,moderate:2,low:3,info:4};
const clean=value=>String(value??'no disponible').replace(/[|\r\n]/g,' ').slice(0,220);
const remedy=fix=>{
 if(fix===true)return 'Disponible (npm)';
 if(fix===false||fix==null)return 'Requiere revisión';
 if(typeof fix==='object')return clean(fix.name?fix.name+'@'+fix.version:fix.version);
 return clean(fix);
};
export function formatProductionAudit(data){
 if(!data||typeof data!=='object'||!data.metadata||!data.vulnerabilities||data.error)
   throw Error('Resultado npm audit incompleto; no se puede afirmar una auditoría exitosa');
 const levels=data.metadata.vulnerabilities??{};
 const vulnerabilities=Object.entries(data.vulnerabilities).map(([name,item])=>({
  name,severity:item?.severity??'unknown',direct:item?.isDirect===true,
  range:item?.range??'no disponible',
  fix:remedy(item?.fixAvailable),
  via:Array.isArray(item?.via)?item.via.map(v=>typeof v==='string'?v:v?.name).filter(Boolean).slice(0,3).join(', '):''
 })).sort((a,b)=>(severityOrder[a.severity]??99)-(severityOrder[b.severity]??99)||a.name.localeCompare(b.name));
 const heading=[
  '## Auditoría de dependencias de producción (npm)',
  'Comando de origen: `npm audit --omit=dev --json`. Solo advierte sobre dependencias de producción; no demuestra explotación.',
  '',
  ...['critical','high','moderate','low'].map(k=>'- **'+k+'**: '+(levels[k]??'sin dato')),
  '',
  '### Paquetes para triage (máximo 30)',
  '| Paquete | Severidad | Directa | Rango afectado | Ruta de dependencia | Corrección sugerida |',
  '|---|---|---|---|---|---|',
  ...vulnerabilities.slice(0,30).map(v=>['|',clean(v.name),clean(v.severity),v.direct?'Sí':'No',clean(v.range),clean(v.via||'no indicada'),clean(v.fix),'|'].join(' | ').replace(/^\| \|/,'|'))
 ];
 if(vulnerabilities.length===0)heading.push('| Ningún aviso reportado | — | — | — | — | — |');
 if(vulnerabilities.length>30)heading.push('',`Otros ${vulnerabilities.length-30} paquetes en el JSON adjunto.`);
 heading.push('', '**Acción:** revisar avisos oficiales, rutas reales, compatibilidad de cambios y ejecución de QA antes de resolver el Issue. Nunca usar `npm audit fix --force` sin revisión.');
 return heading.join('\n')+'\n';
}
