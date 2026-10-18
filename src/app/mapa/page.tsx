import type { Metadata } from 'next';
import Link from 'next/link';
import { Cartogram } from '@/components/map/Cartogram';
import { getStateActivity } from '@/lib/queries/map';
import { getActiveServiceOptions } from '@/lib/queries/services';
import { pageMetadata } from '@/lib/seo/metadata';
import { ROUTE, isRouteAvailable, serviceHref } from '@/lib/nav';

// Datos en vivo: se renderiza en cada petición (si no, `next build` la congela).
export const dynamic = 'force-dynamic';

// Canónica sin parámetros: los filtros (?periodo=, ?servicio=) no compiten con /mapa.
export const metadata: Metadata = pageMetadata({
  title: 'Mapa de reportes por estado',
  description:
    'Reportes ciudadanos de fallas de servicios agregados por estado de Venezuela, en las últimas 24 horas, 7 o 30 días. Nunca ubicaciones individuales.',
  path: ROUTE.map.href,
});

const PERIODS = [
  { value: '24h', hours: 24, label: 'Últimas 24 horas', phrase: 'en las últimas 24 horas' },
  { value: '7d', hours: 24 * 7, label: 'Últimos 7 días', phrase: 'en los últimos 7 días' },
  { value: '30d', hours: 24 * 30, label: 'Últimos 30 días', phrase: 'en los últimos 30 días' },
] as const;

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; servicio?: string }>;
}) {
  const params = await searchParams;
  const period = PERIODS.find((p) => p.value === params.periodo) ?? PERIODS[0];
  const serviceOptions = await getActiveServiceOptions();
  const service = serviceOptions.find((s) => s.slug === params.servicio) ?? null;
  const unknownService = Boolean(params.servicio) && !service;

  const states = (await getStateActivity({ hours: period.hours, serviceSlug: service?.slug })) ?? [];
  const total = states.reduce((sum, s) => sum + s.totalReports, 0);
  const withReports = states.filter((s) => s.totalReports > 0).length;
  const ranked = [...states].sort((a, b) => b.totalReports - a.totalReports || a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Mapa de reportes por estado</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">
        Reportes ciudadanos agregados por estado. Solo se muestran totales: nunca reportes individuales ni ubicaciones
        precisas.
        {isRouteAvailable(ROUTE.methodology) && (
          <>
            {' '}
            <Link href={`${ROUTE.methodology.href}#privacidad`} className="underline underline-offset-2 hover:text-ink">
              Cómo se protege la ubicación
            </Link>
            .
          </>
        )}
      </p>

      {/* Una sola fila de filtros, encima de todo lo que afecta. Formulario GET: funciona sin JavaScript. */}
      <form action={ROUTE.map.href} className="mt-6 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
        <label className="sr-only" htmlFor="periodo">
          Período
        </label>
        <select
          id="periodo"
          name="periodo"
          defaultValue={period.value}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-pulse-500"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="servicio">
          Servicio
        </label>
        <select
          id="servicio"
          name="servicio"
          defaultValue={service?.slug ?? ''}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-pulse-500"
        >
          <option value="">Todos los servicios</option>
          {serviceOptions.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Ver
        </button>
      </form>

      {unknownService && (
        <p className="mt-3 text-sm text-ink-muted">Ese servicio no existe; se muestran todos los servicios.</p>
      )}

      <p className="mt-6 text-sm">
        {total === 0 ? (
          <>Sin reportes {period.phrase}{service ? ` para ${service.name}` : ''}.</>
        ) : (
          <>
            <span className="font-medium">{total.toLocaleString('es-VE')}</span>{' '}
            {total === 1 ? 'reporte' : 'reportes'} {period.phrase}
            {service && (
              <>
                {' '}
                para{' '}
                <Link href={serviceHref(service.slug)} className="underline underline-offset-2">
                  {service.name}
                </Link>
              </>
            )}
            , en {withReports} de {states.length} estados.
          </>
        )}
      </p>

      <div className="mt-4">
        <Cartogram states={states} />
      </div>

      {/* Vista de tabla: el equivalente accesible del mapa, con todos los valores. */}
      <details className="mt-8 rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Ver como tabla</summary>
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-left text-sm">
            <thead className="text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  Estado
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Reportes
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Reportantes distintos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ranked.map((s) => (
                <tr key={s.code}>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums">{s.totalReports}</td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums">{s.uniqueReporters}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
