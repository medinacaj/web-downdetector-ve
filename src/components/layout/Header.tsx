import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ROUTE, isRouteAvailable } from '@/lib/nav';

// Solo las páginas que existen (ver src/lib/nav.ts): un enlace a una página
// planificada sería un 404 en todas las páginas del sitio.
const NAV_LINKS = [ROUTE.services, ROUTE.map, ROUTE.incidents, ROUTE.statistics, ROUTE.methodology].filter(
  isRouteAvailable,
);

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="PulsoVE — Inicio">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M2 12h4l2-7 4 14 2-7h8"
              stroke="#00c2a8"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-lg font-semibold tracking-tight">PulsoVE</span>
        </Link>

        <nav aria-label="Principal" className="hidden flex-1 items-center gap-5 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form action="/servicios" className="hidden flex-1 max-w-xs items-center md:flex">
          <label htmlFor="header-search" className="sr-only">
            Buscar un servicio
          </label>
          <input
            id="header-search"
            name="q"
            type="search"
            placeholder="Buscar un servicio…"
            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:border-pulse-500"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/servicios"
            className="hidden rounded-md bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 sm:inline-flex"
          >
            Reportar un problema
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
