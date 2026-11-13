import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { sparklinePolyline } from '@/lib/queries/home-trends';
import type { ServiceSummary } from '@/lib/queries/home';
import { FavoriteButton } from './FavoriteButton';
import { BrandMark } from './BrandMark';

/**
 * The full-width title is FIRST. Footer actions are independent of the
 * accessible detail link and can never steal its horizontal or vertical space.
 * Category colors identify topics, not operational severity or uptime.
 */
export function ServicePulseCard({
  service,
}: {
  service: ServiceSummary & { hourlyReports: number[] };
}) {
  const line = sparklinePolyline(service.hourlyReports);
  const reports = service.hourlyReports.reduce((sum, count) => sum + count, 0);
  return (
    <li className="relative min-w-0">
      <article
        data-category={service.categorySlug}
        className="service-tile flex h-full min-h-[260px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all focus-within:shadow-lg sm:min-h-[270px]"
      >
        <Link
          href={`/servicios/${encodeURIComponent(service.slug)}`}
          aria-label={`Ver estado y reportes de ${service.name}`}
          className="flex min-w-0 flex-1 flex-col px-3 pb-2 pt-3 focus-visible:outline-offset-[-4px] sm:px-4"
        >
          <div data-card-title className="min-h-[53px] min-w-0">
            <h3 className="line-clamp-2 font-display text-sm font-bold leading-snug tracking-tight text-ink sm:text-base">
              {service.name}
            </h3>
            <p className="mt-1 truncate text-[10px] font-semibold text-ink-muted sm:text-xs" title={service.categoryName}>
              {service.categoryName}
            </p>
          </div>

          <div data-card-logo className="flex h-[76px] shrink-0 items-center justify-center py-1 sm:h-[84px]">
            <BrandMark slug={service.slug} name={service.name} categorySlug={service.categorySlug} />
          </div>

          <div className="mt-auto min-w-0">
            <div className="flex min-w-0 items-center justify-between gap-1 text-[10px] text-ink-muted sm:text-xs">
              <span className="truncate">Reportes · 24 h</span>
              <span className="shrink-0 font-mono font-semibold tabular-nums text-ink">{reports}</span>
            </div>
            <div data-card-trend className="mt-1.5 h-[60px] w-full min-w-0">
              {line ? (
                <svg viewBox="0 0 300 64" preserveAspectRatio="none"
                  className="service-tile-chart block h-full w-full"
                  role="img" aria-label={`Distribución horaria de ${reports} reportes reales de ${service.name} durante las últimas 24 horas`}>
                  <line x1="5" x2="295" y1="59" y2="59" stroke="currentColor" opacity=".15" />
                  <polyline fill="none" stroke="currentColor" strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round" points={line} vectorEffect="non-scaling-stroke" />
                </svg>
              ) : (
                <div className="flex h-full w-full flex-col justify-center gap-2" aria-label="Sin reportes para representar en las últimas 24 horas">
                  <svg viewBox="0 0 300 16" preserveAspectRatio="none" className="h-4 w-full text-border" aria-hidden="true">
                    <line x1="4" x2="296" y1="8" y2="8" stroke="currentColor" strokeWidth="2" strokeDasharray="5 6" />
                  </svg>
                  <span className="text-center text-[10px] text-ink-muted sm:text-xs">Sin reportes recientes</span>
                </div>
              )}
            </div>
            <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-1 border-t border-border/70 pt-2">
              <StatusBadge status={service.status} size="sm" />
              <span className="service-tile-cta text-[10px] font-semibold sm:text-xs">Ver ficha ↗</span>
            </div>
          </div>
        </Link>

        <div data-card-actions className="service-tile-actions flex h-10 shrink-0 items-center justify-end gap-2 px-3 sm:px-4">
          <Link
            href={`/servicios/${encodeURIComponent(service.slug)}#reportar`}
            aria-label={`Reportar falla de ${service.name}`}
            title={`Reportar falla de ${service.name}`}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-500 bg-red-600 text-white transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            <span aria-hidden="true" className="text-xl font-black leading-none">!</span>
          </Link>
          <FavoriteButton slug={service.slug} name={service.name} inline />
        </div>
      </article>
    </li>
  );
}
