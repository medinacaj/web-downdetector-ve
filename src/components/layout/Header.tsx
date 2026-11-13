import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ROUTE, isRouteAvailable } from '@/lib/nav';

// Solo las páginas que existen (ver src/lib/nav.ts): un enlace a una página
// planificada sería un 404 en todas las páginas del sitio.
const NAV_LINKS = [ROUTE.services, ROUTE.map, ROUTE.incidents, ROUTE.statistics].filter(
  isRouteAvailable,
);

export function Header() {
  return (
    <header className="pulsove-header sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
      <div className="mx-auto flex h-[54px] max-w-6xl items-center gap-2 px-3 sm:h-[54px] sm:gap-3 sm:px-6">
        <Link href="/" className="pulsove-brand flex shrink-0 items-center gap-1.5" aria-label="PulsoVE — Inicio">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M2 12h4l2-7 4 14 2-7h8"
              stroke="#00c2a8"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-base font-semibold tracking-tight sm:text-lg">PulsoVE</span>
        </Link>

        {/* También en móvil (antes `hidden md:flex` dejaba el menú sin enlaces); si algún día hay
            más enlaces de los que caben, se desplaza en horizontal en vez de romper el encabezado. */}
        <nav aria-label="Principal" className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap sm:gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="pulsove-nav-link shrink-0 py-2 text-xs font-medium text-ink-muted transition-colors sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form action="/servicios" className="hidden max-w-[210px] flex-1 items-center xl:flex">
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

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Link
            href="/servicios"
            className="pulsove-header-report hidden items-center rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors lg:inline-flex"
          >
            Reportar un problema
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
