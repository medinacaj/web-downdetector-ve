import Link from 'next/link';
import { ROUTE, isRouteAvailable } from '@/lib/nav';

// Solo las páginas que existen (ver src/lib/nav.ts).
const FOOTER_LINKS = [ROUTE.methodology, ROUTE.statistics, ROUTE.incidents].filter(isRouteAvailable);

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M2 12h4l2-7 4 14 2-7h8" stroke="#00c2a8" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-display text-sm font-semibold">PulsoVE</span>
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              Plataforma independiente de monitoreo ciudadano y técnico de servicios en
              Venezuela. No está afiliada a ninguna de las empresas mencionadas en este
              sitio.
            </p>
          </div>

          {FOOTER_LINKS.length > 0 && (
            <nav aria-label="Pie de página" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:flex sm:gap-8">
              {FOOTER_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="text-ink-muted hover:text-ink">
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <p className="mt-8 text-xs text-ink-muted">
          Los datos marcados como demostrativos no reflejan incidentes reales.
        </p>
      </div>
    </footer>
  );
}
