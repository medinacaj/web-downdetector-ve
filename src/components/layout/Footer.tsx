import Link from 'next/link';
import { ROUTE, isRouteAvailable } from '@/lib/nav';

const FOOTER_LINKS = [ROUTE.methodology, ROUTE.statistics, ROUTE.incidents].filter(isRouteAvailable);

const HELP_STEPS = [
  { title: 'Busca', description: 'Elige tu internet, banco, juego o aplicación.' },
  { title: 'Revisa', description: 'Consulta su ficha y los reportes disponibles.' },
  { title: 'Reporta', description: 'Utiliza el botón rojo de la ficha para informar una falla.' },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/60" id="ayuda">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section aria-labelledby="footer-help-title">
          <h2 id="footer-help-title" className="font-display text-base font-semibold">
            Ayuda · Cómo usar PulsoVE
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-6">
            {HELP_STEPS.map((step, index) => (
              <li key={step.title} className="flex items-start gap-3">
                <span aria-hidden="true" className="font-mono text-sm font-bold text-pulse-600">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-start">
          <div className="max-w-lg">
            <Link href="/" className="font-display text-sm font-semibold hover:underline">PulsoVE</Link>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              Plataforma independiente de reportes ciudadanos de servicios. No está afiliada
              a las empresas del catálogo. Los datos insuficientes no prueban disponibilidad.
            </p>
          </div>
          <nav aria-label="Pie de página" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/servicios" className="text-ink-muted hover:text-ink hover:underline">
              Servicios
            </Link>
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-ink-muted hover:text-ink hover:underline">
                {link.label}
              </Link>
            ))}
            <Link href="/creditos-marcas" className="text-ink-muted hover:text-ink hover:underline">
              Logos y créditos
            </Link>
          </nav>
        </div>

        <p className="mt-4 text-xs text-ink-muted">
          Los gráficos marcados como ilustrativos no representan incidentes reales.
        </p>
      </div>
    </footer>
  );
}
