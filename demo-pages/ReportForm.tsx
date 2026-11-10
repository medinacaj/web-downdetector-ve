'use client';

import { useId, useState } from 'react';

export function ReportForm({ issueTypes, states }: {
  serviceSlug: string;
  issueTypes: { slug?: string; name: string }[];
  states: { code?: string; name: string }[];
  turnstileSiteKey?: string | null;
}) {
  const formId = useId();
  const [tested, setTested] = useState(false);
  // No usar <form>: antes de hidratar o sin JS, el envío nativo GET
  // incorporaría los campos a la URL aunque preventDefault exista en React.
  return <div role="group" aria-label="Vista previa del formulario" className="space-y-4 rounded-lg border border-border p-5">
    <p className="text-sm text-ink-muted">Vista previa del formulario. Usa datos ficticios: esta demo no envía ni guarda reportes.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label htmlFor={`${formId}-issue`} className="text-sm font-medium">Tipo de problema</label>
        <select id={`${formId}-issue`} name="issueTypeSlug" required className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
          {issueTypes.map(it => <option key={it.slug} value={it.slug}>{it.name}</option>)}
        </select>
      </div>
      <div><label htmlFor={`${formId}-state`} className="text-sm font-medium">Estado</label>
        <select id={`${formId}-state`} name="stateCode" required className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm">
          {states.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
        </select>
      </div>
      <div><label htmlFor={`${formId}-city`} className="text-sm font-medium">Ciudad (opcional)</label>
        <input id={`${formId}-city`} name="cityText" maxLength={120} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
      </div>
      <div><label htmlFor={`${formId}-carrier`} className="text-sm font-medium">Operador o red (opcional)</label>
        <input id={`${formId}-carrier`} name="networkCarrier" maxLength={64} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
      </div>
    </div>
    <div><label htmlFor={`${formId}-comment`} className="text-sm font-medium">Comentario (opcional, máx. 280 caracteres)</label>
      <textarea id={`${formId}-comment`} name="comment" maxLength={280} rows={2} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
    </div>
    <button type="button" onClick={() => setTested(true)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Probar formulario</button>
    {tested && <p role="status" className="rounded-md border border-border bg-surface p-3 text-sm">Prueba visual completada. No se envió ni guardó ningún reporte.</p>}
  </div>;
}
