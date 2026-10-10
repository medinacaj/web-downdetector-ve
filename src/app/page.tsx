import Link from 'next/link';
import { getHomeData } from '@/lib/queries/home';
import { StatusBadge } from '@/components/ui/StatusBadge';

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat('es-VE', {
    timeZone: 'America/Caracas',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(date);
}

const METHODOLOGY_STEPS = [
  { title: 'Recopilación', text: 'Reportes ciudadanos anónimos y mediciones técnicas automáticas.' },
  { title: 'Comparación', text: 'Cada ventana se compara contra el comportamiento habitual de ese servicio, no contra un umbral fijo.' },
  { title: 'Validación', text: 'Diversidad de reportantes, persistencia y señales técnicas antes de confiar en una desviación.' },
  { title: 'Publicación del estado', text: 'Un estado prudente, nunca una afirmación categórica sin evidencia suficiente.' },
];

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      {/* Hero — izquierda: el trabajo real (buscar); derecha: pulso nacional en vivo */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Consulta si un servicio está presentando problemas en Venezuela
            </h1>
            <p className="mt-4 max-w-md text-ink-muted">
              Reportes ciudadanos anónimos y mediciones técnicas, combinados con un motor
              estadístico explicable. Independiente de cualquier proveedor.
            </p>

            <form action="/servicios" className="mt-7 flex max-w-md gap-2">
              <label htmlFor="hero-search" className="sr-only">
                Buscar un servicio
              </label>
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder="CANTV, Banesco, WhatsApp…"
                className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-pulse-500"
              />
              <button
                type="submit"
                className="shrink-0 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Buscar
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/servicios" className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                Explorar todos los servicios
              </Link>
              <span className="text-ink-muted">·</span>
              <span className="text-ink-muted">
                Actualizado {formatUpdatedAt(data.generatedAt)}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${data.totals.incidentsOpen > 0 ? 'bg-status-incident' : 'bg-pulse-500'} animate-pulse-line`}
                />
              </span>
              <span className="font-display text-sm font-medium">Pulso nacional</span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-5">
              <div>
                <dt className="text-xs text-ink-muted">Reportes (24h)</dt>
                <dd className="font-mono text-2xl font-medium tabular-nums">{data.totals.reportsLast24h}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Incidentes activos</dt>
                <dd className="font-mono text-2xl font-medium tabular-nums">{data.totals.incidentsOpen}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Servicios monitoreados</dt>
                <dd className="font-mono text-2xl font-medium tabular-nums">{data.totals.servicesCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Histórico de reportes</dt>
                <dd className="font-mono text-2xl font-medium tabular-nums">{data.totals.reportsAllTime}</dd>
              </div>
            </dl>

            {data.totals.incidentsOpen === 0 && (
              <p className="mt-5 border-t border-border pt-4 text-sm text-ink-muted">
                Sin incidentes activos en este momento.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Incidentes activos */}
      {data.activeIncidents.length > 0 && (
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <h2 className="font-display text-lg font-semibold">Incidentes activos</h2>
            <ul className="mt-4 divide-y divide-border">
              {data.activeIncidents.map((inc) => (
                <li key={inc.id} className="flex items-center justify-between gap-4 py-3">
                  <Link href={`/servicios/${inc.serviceSlug}`} className="font-medium hover:underline">
                    {inc.serviceName}
                  </Link>
                  <StatusBadge status={inc.status === 'confirmed' ? 'outage_high_confidence' : inc.status === 'high_confidence' ? 'outage_high_confidence' : inc.status === 'detected' ? 'outage_detected' : inc.status === 'recovering' ? 'recovering' : 'possible_outage'} size="sm" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Servicios */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold">
            {data.hasAnyActivity ? 'Servicios con mayor actividad' : 'Servicios'}
          </h2>
          <Link href="/servicios" className="text-sm text-ink-muted hover:text-ink">
            Ver todos
          </Link>
        </div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.mostActive.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/servicios/${s.slug}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:border-brand-400"
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-ink-muted">{s.categoryName}</p>
                </div>
                <StatusBadge status={s.status} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Problemas más reportados — vacío hoy, honesto al respecto */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-lg font-semibold">Problemas más reportados</h2>
          {data.totals.reportsLast24h > 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              {data.totals.reportsLast24h} reportes en las últimas 24 horas.
            </p>
          ) : (
            <p className="mt-3 max-w-md text-sm text-ink-muted">
              Todavía no hay suficientes reportes en las últimas 24 horas para mostrar una
              tendencia.{' '}
              <Link href="/metodologia" className="underline underline-offset-2 hover:text-ink">
                Cómo funciona esto
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      {/* Metodología resumida — es una secuencia real, los números sí aplican aquí */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-lg font-semibold">Cómo determinamos el estado de un servicio</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {METHODOLOGY_STEPS.map((step, i) => (
            <li key={step.title}>
              <span className="font-mono text-sm text-pulse-600">{String(i + 1).padStart(2, '0')}</span>
              <p className="mt-1 font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-ink-muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/metodologia"
          className="mt-6 inline-block text-sm text-brand-600 underline-offset-2 hover:underline"
        >
          Leer la metodología completa
        </Link>
      </section>
    </>
  );
}
