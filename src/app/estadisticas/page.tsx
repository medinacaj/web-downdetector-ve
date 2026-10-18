import type { Metadata } from 'next';
import Link from 'next/link';
import { getStatistics } from '@/lib/queries/statistics';
import { formatDateTime } from '@/lib/format';
import { pageMetadata } from '@/lib/seo/metadata';
import { ROUTE, categoryHref, isRouteAvailable, serviceHref } from '@/lib/nav';

// Datos en vivo: se renderiza en cada petición (si no, `next build` la congela).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMetadata({
  title: 'Estadísticas',
  description:
    'Estadísticas en vivo de PulsoVE: reportes ciudadanos de las últimas 24 horas y totales, incidentes detectados, reportes por categoría y servicios más reportados en Venezuela.',
  path: ROUTE.statistics.href,
});

const PENDING_LABELS: Record<string, string> = {
  availabilityEstimate: 'Disponibilidad estimada',
  meanRecoveryTime: 'Tiempo medio de recuperación',
  stabilityRanking: 'Ranking de estabilidad',
  providerComparison: 'Comparación entre proveedores',
};

const n = (v: number) => v.toLocaleString('es-VE');

function StatTile({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <dt className="text-xs text-ink-muted">{label}</dt>
      {/* Cifras proporcionales y la misma sans de la interfaz (guía de visualización). */}
      <dd className="mt-1 font-body text-2xl font-semibold">{n(value)}</dd>
      {note && <dd className="mt-0.5 text-xs text-ink-muted">{note}</dd>}
    </div>
  );
}

export default async function StatisticsPage() {
  const { data, meta } = await getStatistics();
  const { totals, reportsByCategory, mostActiveServices24h } = data;
  const categoryTotal = reportsByCategory.reduce((sum, c) => sum + c.count, 0);
  const categoryMax = Math.max(0, ...reportsByCategory.map((c) => c.count));
  const active24h = mostActiveServices24h.filter((s) => s.reportsLast24h > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Estadísticas</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">
        Cifras calculadas en vivo a partir de los reportes y de los incidentes que detecta el motor. Los servicios del
        catálogo están marcados como <strong className="text-ink">datos demostrativos</strong>: estas cifras aún no
        describen fallas reales.
      </p>
      <p className="mt-1 text-xs text-ink-muted">Actualizado: {formatDateTime(new Date(meta.generatedAt))}</p>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Servicios monitoreados" value={totals.services} note={`en ${totals.categories} categorías`} />
        <StatTile label="Reportes (24 h)" value={totals.reportsLast24h} />
        <StatTile label="Reportes (total)" value={totals.reportsAllTime} />
        <StatTile label="Incidentes activos" value={totals.incidentsOpen} />
        <StatTile label="Incidentes (total)" value={totals.incidentsAllTime} />
      </dl>

      <section className="mt-10" aria-labelledby="por-categoria">
        <h2 id="por-categoria" className="font-display text-lg font-semibold">
          Reportes por categoría <span className="text-sm font-normal text-ink-muted">(total histórico)</span>
        </h2>
        {categoryTotal === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Todavía no hay reportes registrados.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {reportsByCategory.map((c) => {
              const share = Math.round((c.count / categoryTotal) * 100);
              return (
                <li
                  key={c.categorySlug}
                  className="group relative grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-sm sm:grid-cols-[12rem_1fr]"
                >
                  <Link href={categoryHref(c.categorySlug)} className="truncate underline-offset-4 hover:underline">
                    {c.category}
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="h-3 flex-1 rounded-[4px] bg-brand-50 dark:bg-border">
                      {c.count > 0 && (
                        <div
                          className="h-3 rounded-[4px] bg-brand-500 dark:bg-brand-300"
                          style={{ width: `${Math.max((c.count / categoryMax) * 100, 1.5)}%` }}
                        />
                      )}
                    </div>
                    <span className="w-12 shrink-0 text-right font-mono text-xs text-ink-muted tabular-nums">
                      {n(c.count)}
                    </span>
                  </div>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute -top-8 left-0 z-10 hidden w-max max-w-full rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-ink shadow-sm group-hover:block"
                  >
                    {c.category}: {n(c.count)} reportes ({share} % del total)
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="mas-reportados">
        <h2 id="mas-reportados" className="font-display text-lg font-semibold">
          Servicios más reportados en las últimas 24 horas
        </h2>
        {active24h.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Ningún servicio recibió reportes en las últimas 24 horas.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="border-b border-border text-ink-muted">
              <tr>
                <th scope="col" className="py-2 pr-3 font-medium">
                  #
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Servicio
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Reportes (24 h)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {active24h.map((s, i) => (
                <tr key={s.serviceSlug}>
                  <td className="py-2 pr-3 font-mono text-ink-muted tabular-nums">{i + 1}</td>
                  <td className="py-2 pr-3">
                    <Link href={serviceHref(s.serviceSlug)} className="underline-offset-4 hover:underline">
                      {s.service}
                    </Link>
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums">{n(s.reportsLast24h)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-2 text-xs text-ink-muted">
          Más reportes no significa por sí solo una falla: el motor compara con lo habitual de cada servicio.
          {isRouteAvailable(ROUTE.incidents) && (
            <>
              {' '}
              Las fallas detectadas están en{' '}
              <Link href={ROUTE.incidents.href} className="underline underline-offset-2 hover:text-ink">
                Incidentes
              </Link>
              .
            </>
          )}
        </p>
      </section>

      <section className="mt-10" aria-labelledby="pendientes">
        <h2 id="pendientes" className="font-display text-lg font-semibold">
          Lo que todavía no publicamos
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Preferimos no mostrar una cifra antes que mostrar una inventada.
        </p>
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {Object.entries(meta.pendingMetrics).map(([key, reason]) => (
            <li key={key} className="px-4 py-3 text-sm">
              <p className="font-medium">{PENDING_LABELS[key] ?? key}</p>
              <p className="text-ink-muted">{reason}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-xs text-ink-muted">
        Fuente: {meta.source}. {meta.period}. Ninguna cifra es estimada.
        {isRouteAvailable(ROUTE.methodology) && (
          <>
            {' '}
            <Link href={ROUTE.methodology.href} className="underline underline-offset-2 hover:text-ink">
              Metodología
            </Link>
            .
          </>
        )}
      </p>
    </div>
  );
}
