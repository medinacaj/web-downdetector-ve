'use client';

import { useId, useState } from 'react';

export interface PublicServiceComment {
  id: string;
  body: string;
  createdAt: string;
}

function getAnonymousSeed(): string {
  const key = 'pulsove-device-seed';
  try {
    let seed = localStorage.getItem(key);
    if (!seed) {
      seed = crypto.randomUUID();
      localStorage.setItem(key, seed);
    }
    return seed;
  } catch {
    // Private storage may be disabled. A session-only seed still works.
    return crypto.randomUUID();
  }
}

function formatCommentDate(timestamp: string) {
  return new Intl.DateTimeFormat('es-VE', {
    timeZone: 'America/Caracas', dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(timestamp));
}

export function ServiceComments({
  serviceSlug, comments,
}: { serviceSlug: string; comments: PublicServiceComment[] }) {
  const formId = useId();
  const [body, setBody] = useState('');
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<'idle' | 'sending' | 'pending' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (body.trim().length < 15 || body.length > 500 || !consent || result === 'sending') return;
    setResult('sending');
    try {
      const response = await fetch(`/api/services/${encodeURIComponent(serviceSlug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body, deviceSeed: getAnonymousSeed(), privacyAcknowledged: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult('error');
        setMessage(response.status === 429
          ? 'Llegaste al límite de comentarios. Vuelve a intentarlo más tarde.'
          : data?.error?.message ?? 'No se pudo enviar el comentario.');
        return;
      }
      setResult('pending');
      setBody('');
      setConsent(false);
    } catch {
      setResult('error');
      setMessage('No fue posible conectar. Intenta de nuevo más tarde.');
    }
  }

  return (
    <section id="comentarios" className="service-detail-panel mt-8 scroll-mt-24 rounded-xl border border-border bg-surface p-5 sm:p-7"
      aria-labelledby="service-comments-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="service-comments-title" className="font-display text-xl font-semibold">Comentarios de la comunidad</h2>
        <span className="text-xs text-ink-muted">{comments.length} publicados recientemente</span>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
        Comparte tu experiencia con el servicio. Los comentarios son opiniones de usuarios,
        no verificaciones técnicas; no aumentan el contador de reportes de fallas.
        Se publican solo después de una revisión.
      </p>

      {comments.length === 0 ? (
        <p className="mt-5 text-sm text-ink-muted">Aún no hay comentarios aprobados para este servicio.</p>
      ) : (
        <ul className="mt-5 divide-y divide-border" aria-label="Comentarios publicados">
          {comments.map((comment) => (
            <li key={comment.id} className="py-4">
              <div className="flex flex-wrap justify-between gap-2 text-xs text-ink-muted">
                <span className="font-semibold">Visitante anónimo</span>
                <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-6 space-y-3 border-t border-border pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor={formId} className="text-sm font-semibold">Escribir un comentario</label>
          <span className="font-mono text-xs text-ink-muted tabular-nums" aria-live="polite">
            {body.length}/500
          </span>
        </div>
        <textarea
          id={formId} rows={3} required minLength={15} maxLength={500}
          value={body} onChange={(event) => { setBody(event.target.value); if (result === 'error') setResult('idle'); }}
          placeholder="Describe lo que sucede, desde cuándo o qué solución te funcionó…"
          className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-pulse-500"
        />
        <p className="text-xs text-ink-muted">
          No incluyas nombres reales, teléfonos, correos, números de cuenta ni enlaces.
          No publiques información de terceros.
        </p>
        <label className="flex items-start gap-2 text-sm text-ink-muted">
          <input type="checkbox" checked={consent} required
            onChange={(event) => setConsent(event.target.checked)} className="mt-1" />
          Entiendo que mi mensaje será revisado antes de publicarse y que no sustituye un reporte de falla.
        </label>
        {result === 'pending' && (
          <p role="status" className="text-sm font-semibold text-status-normal">
            Comentario recibido y pendiente de revisión. No está publicado todavía.
          </p>
        )}
        {result === 'error' && <p role="alert" className="text-sm text-status-incident">{message}</p>}
        <button type="submit" disabled={!consent || body.trim().length < 15 || result === 'sending'}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
          {result === 'sending' ? 'Enviando…' : 'Enviar comentario'}
        </button>
      </form>
    </section>
  );
}
