import type { Metadata } from 'next';
import { and, asc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { states, reports, services } from '@/lib/db/schema';
import { RegionalActivityMap } from '@/components/map/RegionalActivityMap';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Actividad regional de reportes en Venezuela',
  description: 'Explora la distribución agregada de reportes por estado y periodo, sin seguimiento de personas ni falsas alertas.',
  alternates: { canonical: '/mapa' },
};

export default async function MapPage({ searchParams }: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const requestedSlug = typeof params.service === 'string' && params.service.length <= 64 ? params.service : '';

  const allServices = await db
    .select({ id: services.id, slug: services.slug, name: services.name })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.name));
  const chosen = allServices.find((service) => service.slug === requestedSlug) ?? null;

  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60_000);
  const since7d = new Date(now - 7 * 24 * 60 * 60_000);
  const since30d = new Date(now - 30 * 24 * 60 * 60_000);
  // Keep all 24 regions visible, including zero counts. Privacy: no
  // coordinates, individual reports, device identifiers or free-text.
  const joinConditions = [
    eq(reports.stateId, states.id),
    eq(reports.suspicious, false),
    gte(reports.createdAt, since30d),
  ];
  if (chosen) joinConditions.push(eq(reports.serviceId, chosen.id));

  const regions = await db
    .select({
      name: states.name,
      code: states.code,
      gridRow: states.gridRow,
      gridCol: states.gridCol,
      last24h: sql<number>`count(${reports.id}) filter (where ${reports.createdAt} >= ${since24h.toISOString()})::int`,
      last7d: sql<number>`count(${reports.id}) filter (where ${reports.createdAt} >= ${since7d.toISOString()})::int`,
      last30d: sql<number>`count(${reports.id})::int`,
    })
    .from(states)
    .leftJoin(reports, and(...joinConditions))
    .where(eq(states.active, true))
    .groupBy(states.id)
    .orderBy(asc(states.name));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
          Reportes ciudadanos · Venezuela
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Actividad por estado
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-muted">
          Explora cómo se distribuyen los reportes válidos por región. La intensidad refleja
          el volumen relativo, no una falla confirmada ni el número de personas afectadas.
          No se recopilan ni muestran posiciones individuales en este mapa.
        </p>
      </header>

      <form method="get" action="/mapa" className="mt-6 flex flex-wrap items-end gap-3 rounded-xl bg-surface p-4 shadow-sm">
        <label htmlFor="map-service" className="min-w-0 flex-1 text-sm font-semibold">
          Filtrar por servicio
          <select id="map-service" name="service" defaultValue={chosen?.slug ?? ''}
            className="mt-2 block w-full min-w-0 rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink">
            <option value="">Todos los servicios</option>
            {allServices.map((item) => (
              <option key={item.slug} value={item.slug}>{item.name}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Aplicar filtro
        </button>
      </form>
      {requestedSlug && !chosen && (
        <p role="alert" className="mt-3 text-sm text-status-incident">
          El servicio solicitado no está disponible. Se muestra el conjunto general de reportes.
        </p>
      )}

      <RegionalActivityMap regions={regions} serviceName={chosen?.name ?? null} />
      <p className="mt-6 text-xs leading-6 text-ink-muted">
        Fuente: reportes registrados en PulsoVE que no fueron marcados como sospechosos.
        Los conteos no son una estimación de usuarios afectados. El cartograma utiliza
        posiciones aproximadas, no fronteras ni coordenadas exactas. La actualización
        depende de la disponibilidad del backend y de nuevos reportes.
      </p>
    </main>
  );
}
