import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { sparklinePolyline } from '@/lib/queries/home-trends';
import type { ServiceSummary } from '@/lib/queries/home';
import { FavoriteButton } from './FavoriteButton';

const MARK_COLORS: Record<string, { background: string; foreground: string }> = {
  'telecomunicaciones': { background: 'bg-sky-50 dark:bg-sky-950', foreground: 'text-sky-700 dark:text-sky-300' },
  'banca-y-pagos': { background: 'bg-emerald-50 dark:bg-emerald-950', foreground: 'text-emerald-700 dark:text-emerald-300' },
  'servicios-publicos': { background: 'bg-amber-50 dark:bg-amber-950', foreground: 'text-amber-700 dark:text-amber-300' },
  'plataformas-digitales': { background: 'bg-violet-50 dark:bg-violet-950', foreground: 'text-violet-700 dark:text-violet-300' },
  'streaming': { background: 'bg-rose-50 dark:bg-rose-950', foreground: 'text-rose-700 dark:text-rose-300' },
  'videojuegos': { background: 'bg-indigo-50 dark:bg-indigo-950', foreground: 'text-indigo-700 dark:text-indigo-300' },
};
const FALLBACK_COLORS = { background: 'bg-brand-50 dark:bg-brand-900', foreground: 'text-brand-700 dark:text-brand-200' };

function serviceMonogram(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length > 1) return words.slice(0, 2).map((word) => word[0] ?? '').join('').toLocaleUpperCase('es-VE');
  return name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toLocaleUpperCase('es-VE') || 'VE';
}

export function ServicePulseCard({
  service,
}: {
  service: ServiceSummary & { hourlyReports: number[] };
}) {
  const tone = MARK_COLORS[service.categorySlug] ?? FALLBACK_COLORS;
  const line = sparklinePolyline(service.hourlyReports);
  const reports = service.hourlyReports.reduce((sum, count) => sum + count, 0);

  return (
    <li className="relative min-w-0">
      <article className="relative h-full overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-pulse-500/60 hover:shadow-md focus-within:border-pulse-500">
        <FavoriteButton slug={service.slug} name={service.name} />
        <Link href={`/servicios/${encodeURIComponent(service.slug)}`}
          aria-label={`Ver estado y reportes de ${service.name}`}
          className="flex h-full min-h-[266px] flex-col p-3.5 pr-12 focus-visible:outline-offset-[-4px] sm:min-h-[286px] sm:p-5 sm:pr-14">
          <div className="min-h-12">
            <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug tracking-tight text-ink sm:text-lg">
              {service.name}
            </h3>
            <p className="mt-1 line-clamp-1 text-[11px] text-ink-muted sm:text-xs">{service.categoryName}</p>
          </div>

          {/* Identificador tipográfico original: no suplantar los logos oficiales. */}
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-3">
            <span aria-hidden="true" className={`flex h-[68px] w-[68px] items-center justify-center rounded-[20px] text-3xl font-bold tracking-tight sm:h-20 sm:w-20 sm:text-4xl ${tone.background} ${tone.foreground}`}>
              {serviceMonogram(service.name)}
            </span>
            <span aria-hidden="true" className={`line-clamp-2 max-w-full text-center text-xs font-bold tracking-tight sm:text-sm ${tone.foreground}`}>
              {service.name}
            </span>
          </div>

          <div className="mt-auto">
            <div className="flex items-center justify-between gap-2 text-[10px] text-ink-muted sm:text-xs">
              <span>Reportes por hora · 24 h</span>
              <span className="font-mono font-semibold tabular-nums text-ink">{reports}</span>
            </div>
            {line ? (
              <svg viewBox="0 0 300 64" preserveAspectRatio="none"
                className="mt-2 h-14 w-full text-pulse-600 dark:text-pulse-400"
                role="img" aria-label={`Distribución horaria de ${reports} reportes de ${service.name} en las últimas 24 horas`}>
                <line x1="5" x2="295" y1="59" y2="59" stroke="currentColor" opacity=".15" />
                <polyline fill="none" stroke="currentColor" strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round" points={line} vectorEffect="non-scaling-stroke" />
              </svg>
            ) : (
              <div className="mt-2 flex h-14 flex-col justify-center gap-2" aria-label="Sin reportes para representar en las últimas 24 horas">
                <svg viewBox="0 0 300 16" preserveAspectRatio="none" className="h-4 w-full text-border" aria-hidden="true">
                  <line x1="4" x2="296" y1="8" y2="8" stroke="currentColor" strokeWidth="2" strokeDasharray="5 6" />
                </svg>
                <span className="text-center text-[10px] text-ink-muted sm:text-xs">Sin reportes recientes</span>
              </div>
            )}
            <div className="mt-3 border-t border-border/70 pt-3">
              <StatusBadge status={service.status} size="sm" />
              {service.isDemo && <p className="mt-1 text-[10px] text-ink-muted">Servicio en catálogo de demostración</p>}
            </div>
          </div>
        </Link>
      </article>
    </li>
  );
}
