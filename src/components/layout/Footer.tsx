import Link from 'next/link';
import { ROUTE, isRouteAvailable } from '@/lib/nav';

const FOOTER_LINKS = [ROUTE.methodology, ROUTE.statistics, ROUTE.incidents].filter(isRouteAvailable);

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <section id="ayuda" className="scroll-mt-20" aria-labelledby="footer-help-title">
          <h2 id="footer-help-title" className="font-display text-lg font-semibold">
            ¿Cómo usar PulsoVE?
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Busca un servicio, revisa los reportes disponibles y comparte un problema cuando lo detectes.
          </p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-5">
            <li>
              <strong className="text-sm text-[#176e83] dark:text-[#94d4ed]">1 · Busca</strong>
              <p className="mt-1 text-xs leading-5 text-ink-muted">Encuentra una plataforma por nombre o categoría.</p>
            </li>
            <li>
              <strong className="text-sm text-[#80520e] dark:text-[#f8cc87]">2 · Revisa</strong>
              <p className="mt-1 text-xs leading-5 text-ink-muted">Consulta su ficha, los reportes y el historial disponible.</p>
            </li>
            <li>
              <strong className="text-sm text-[#a63761] dark:text-[#ffb0c8]">3 · Reporta</strong>
              <p className="mt-1 text-xs leading-5 text-ink-muted">Utiliza el botón rojo de la ficha para informar una falla.</p>
            </li>
          </ol>
        </section>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4 border-t border-border pt-5">
          <div className="max-w-md">
            <Link href="/" className="font-display text-sm font-semibold text-ink">PulsoVE</Link>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              Plataforma independiente. No estamos afiliados a las empresas del catálogo.
              La ausencia de reportes no garantiza que un servicio funcione.
            </p>
          </div>
          <nav aria-label="Pie de página" className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
            <Link href="/servicios" className="text-ink-muted hover:text-ink">Servicios</Link>
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-ink-muted hover:text-ink">
                {link.label}
              </Link>
            ))}
            <Link href="/creditos-marcas" className="text-ink-muted hover:text-ink">
              Logos y créditos
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
