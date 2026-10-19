'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Widget de Cloudflare Turnstile (render explícito). Solo se monta si el servidor pasó
 * una clave pública (ENABLE_TURNSTILE="true"); si no, el formulario no carga nada de
 * Cloudflare. `resetSignal` pide un token nuevo (los tokens son de un solo uso).
 * NO VERIFICADO contra Cloudflare desde el entorno de desarrollo (red bloqueada).
 */
interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = 'cf-turnstile-script';

function loadScript(src: string): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('turnstile')), { once: true });
  });
}

export function TurnstileWidget({
  siteKey,
  scriptUrl,
  onToken,
  resetSignal,
}: {
  siteKey: string;
  scriptUrl: string;
  onToken: (token: string | null) => void;
  resetSignal: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadScript(scriptUrl)
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: siteKey,
          language: 'es',
          theme: 'auto',
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
    // onToken es estable (setState del padre); siteKey/scriptUrl no cambian en la vida de la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, scriptUrl]);

  useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      onToken(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  if (failed) {
    return (
      <p className="text-sm text-status-incident">
        No se pudo cargar la verificación anti-robots (puede bloquearla una extensión o la red). Sin ella no se puede
        enviar el reporte.
      </p>
    );
  }
  return <div ref={container} />;
}
