'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

interface TurnstileAPI {
  render(container: HTMLElement, options: {
    sitekey: string;
    action: string;
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
    'timeout-callback': () => void;
  }): string;
  remove(widget: string): void;
}
declare global { interface Window { turnstile?: TurnstileAPI } }

export function TurnstileChallenge({ siteKey, onToken }: {
  siteKey: string;
  onToken: (token: string | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ready || !container.current || !window.turnstile) return;
    const api = window.turnstile;
    const invalidate = () => { onToken(null); setFailed(true); };
    let widget: string;
    try {
      widget = api.render(container.current, {
        sitekey: siteKey,
        action: 'report',
        callback: (token) => { setFailed(false); onToken(token); },
        'expired-callback': invalidate,
        'error-callback': invalidate,
        'timeout-callback': invalidate,
      });
    } catch { invalidate(); return; }
    return () => { api.remove(widget); };
  }, [ready, siteKey, onToken, attempt]);

  return <div>
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      onReady={() => setReady(true)}
      onError={() => { setFailed(true); onToken(null); }}
    />
    <div ref={container} />
    <p className="mt-2 text-xs text-ink-muted">La verificación de seguridad utiliza Cloudflare Turnstile.</p>
    {failed && <p role="alert" className="mt-2 text-sm text-status-incident">
      No se pudo completar la verificación.{' '}
      {ready ? <button type="button" className="underline" onClick={() => { onToken(null); setFailed(false); setAttempt(n => n + 1); }}>Reintentar</button>
        : 'Recarga la página para intentarlo de nuevo.'}
    </p>}
  </div>;
}
