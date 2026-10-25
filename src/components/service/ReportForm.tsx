'use client';

import { useId, useState } from 'react';
import { ROUTE, isRouteAvailable } from '@/lib/nav';
import { TurnstileWidget } from './TurnstileWidget';

interface Option {
  slug?: string;
  code?: string;
  name: string;
}

function getDeviceSeed(): string {
  const key = 'pulsove-device-seed';
  let seed = localStorage.getItem(key);
  if (!seed) {
    seed = crypto.randomUUID();
    localStorage.setItem(key, seed);
  }
  return seed;
}

type SubmitState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done' } | { kind: 'error'; message: string };

export function ReportForm({
  serviceSlug,
  issueTypes,
  states,
  suggestedStateCode = null,
  turnstile = null,
}: {
  serviceSlug: string;
  issueTypes: Option[];
  states: Option[];
  /** Estado sugerido por la conexión (src/lib/geo.ts); la persona puede cambiarlo. */
  suggestedStateCode?: string | null;
  /** Clave pública y script de Turnstile si está activo (src/lib/security/turnstile.ts). */
  turnstile?: { siteKey: string; scriptUrl: string } | null;
}) {
  const formId = useId();
  const [state, setState] = useState<SubmitState>({ kind: 'idle' });
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState({ kind: 'sending' });

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSlug,
          issueTypeSlug: form.get('issueTypeSlug'),
          stateCode: form.get('stateCode'),
          cityText: form.get('cityText') || undefined,
          networkCarrier: form.get('networkCarrier') || undefined,
          comment: form.get('comment') || undefined,
          deviceSeed: getDeviceSeed(),
          turnstileToken: turnstileToken ?? undefined,
        }),
      });

      const json = await res.json();
      // El token de Turnstile es de un solo uso: se pide otro para el siguiente envío.
      if (turnstile) setTurnstileReset((n) => n + 1);

      if (!res.ok) {
        const message =
          res.status === 429
            ? 'Ya enviaste varios reportes recientemente. Intenta de nuevo más tarde.'
            : json.error?.message || 'No se pudo enviar el reporte.';
        setState({ kind: 'error', message });
        return;
      }

      setState({ kind: 'done' });
    } catch {
      setState({ kind: 'error', message: 'No se pudo conectar. Revisa tu conexión e intenta de nuevo.' });
    }
  }

  if (state.kind === 'done') {
    return (
      <div className="rounded-lg border border-status-normal/30 bg-status-normal/10 p-5">
        <p className="font-medium text-status-normal">Reporte enviado</p>
        <p className="mt-1 text-sm text-ink-muted">
          Gracias — tu reporte ya forma parte del cálculo de este servicio.
        </p>
        <button
          type="button"
          onClick={() => setState({ kind: 'idle' })}
          className="mt-3 text-sm text-brand-600 underline-offset-2 hover:underline"
        >
          Enviar otro reporte
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${formId}-issue`} className="text-sm font-medium">
            Tipo de problema
          </label>
          <select
            id={`${formId}-issue`}
            name="issueTypeSlug"
            required
            defaultValue=""
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-pulse-500"
          >
            {/* Sin preselección: antes el primero de la lista se enviaba sin que nadie lo eligiera. */}
            <option value="" disabled>
              Elige el problema…
            </option>
            {issueTypes.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${formId}-state`} className="text-sm font-medium">
            Estado
          </label>
          <select
            id={`${formId}-state`}
            name="stateCode"
            required
            defaultValue={suggestedStateCode ?? ''}
            aria-describedby={suggestedStateCode ? `${formId}-state-hint` : undefined}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-pulse-500"
          >
            <option value="" disabled>
              Elige tu estado…
            </option>
            {states.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name}
              </option>
            ))}
          </select>
          {suggestedStateCode && (
            <p id={`${formId}-state-hint`} className="mt-1 text-xs text-ink-muted">
              Sugerido según tu conexión. Cámbialo si no es correcto.
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-city`} className="text-sm font-medium">
            Ciudad <span className="font-normal text-ink-muted">(opcional)</span>
          </label>
          <input
            id={`${formId}-city`}
            name="cityText"
            type="text"
            maxLength={120}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-pulse-500"
          />
        </div>

        <div>
          <label htmlFor={`${formId}-carrier`} className="text-sm font-medium">
            Operador o red <span className="font-normal text-ink-muted">(opcional)</span>
          </label>
          <input
            id={`${formId}-carrier`}
            name="networkCarrier"
            type="text"
            maxLength={64}
            placeholder="Ej. CANTV ABA, WiFi Movistar…"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-pulse-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${formId}-comment`} className="text-sm font-medium">
          Comentario <span className="font-normal text-ink-muted">(opcional, máx. 280 caracteres)</span>
        </label>
        <textarea
          id={`${formId}-comment`}
          name="comment"
          maxLength={280}
          rows={2}
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-pulse-500"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Envío este reporte de forma anónima y entiendo que no se solicitan datos personales.
          {isRouteAvailable(ROUTE.methodology) && (
            <>
              {' '}
              <a href={`${ROUTE.methodology.href}#privacidad`} className="underline underline-offset-2 hover:text-ink">
                Cómo se protege la ubicación
              </a>
              .
            </>
          )}
        </span>
      </label>

      {turnstile && (
        <TurnstileWidget
          siteKey={turnstile.siteKey}
          scriptUrl={turnstile.scriptUrl}
          onToken={setTurnstileToken}
          resetSignal={turnstileReset}
        />
      )}

      {state.kind === 'error' && <p className="text-sm text-status-incident">{state.message}</p>}

      <button
        type="submit"
        disabled={state.kind === 'sending' || !consent || (turnstile !== null && !turnstileToken)}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state.kind === 'sending' ? 'Enviando…' : 'Enviar reporte'}
      </button>
    </form>
  );
}
