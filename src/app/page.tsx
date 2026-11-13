import Link from 'next/link';
import { getHomeData } from '@/lib/queries/home';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ServicePulseCard } from '@/components/home/ServicePulseCard';
import { HomeAutoRefresh } from '@/components/home/HomeAutoRefresh';
import { OfficialMicrosoftStatus } from '@/components/home/OfficialMicrosoftStatus';
import { ROUTE, isRouteAvailable } from '@/lib/nav';

// Citizen activity is time-sensitive and must not be served from a stale static page.
export const dynamic = 'force-dynamic';


const METHODOLOGY_STEPS = [
  { title: 'Recopilación', text: 'Reportes ciudadanos anónimos y señales técnicas disponibles, cuando existan.' },
  { title: 'Comparación', text: 'Cada ventana se compara contra el comportamiento habitual de ese servicio, no contra un umbral fijo.' },
  { title: 'Validación', text: 'Diversidad de reportantes, persistencia y señales técnicas antes de confiar en una desviación.' },
  { title: 'Publicación del estado', text: 'Un estado prudente, nunca una afirmación categórica sin evidencia suficiente.' },
];

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      <HomeAutoRefresh />
      {/* Compact search-first intro: usage guidance lives in the footer. */}
      <section className="home-hero border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              ¿Tu internet, banco o aplicación está fallando?
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#dceeea]">
              Busca servicios, consulta reportes de otras personas y comparte un problema.
            </p>
            <form action="/servicios" className="mt-3 flex max-w-xl gap-2">
              <label htmlFor="hero-search" className="sr-only">Buscar un servicio</label>
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder="Ej. CANTV, Banesco, WhatsApp…"
                className="w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-pulse-500"
              />
              <button type="submit"
                className="shrink-0 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Buscar
              </button>
            </form>
          </div>
          <dl className="grid grid-cols-2 gap-4 rounded-lg bg-surface px-4 py-3 text-center shadow-sm"
            aria-label="Actividad reciente de reportes">
            <div>
              <dt className="text-xs text-ink-muted">Reportes (24h)</dt>
              <dd className="font-mono text-xl font-semibold tabular-nums">{data.totals.reportsLast24h}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Incidentes activos</dt>
              <dd className="font-mono text-xl font-semibold tabular-nums">{data.totals.incidentsOpen}</dd>
            </div>
          </dl>
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

      {/* Servicios de interés: cuadrícula responsive y tendencias reales de reportes. */}
      <section className="home-featured-band mx-auto max-w-6xl px-3 py-12 sm:px-6" aria-labelledby="home-services-title">
        <div className="flex items-start justify-between gap-3 px-1 sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pulse-600">Explora el pulso</p>
            <h2 id="home-services-title" className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {data.hasRapidSurge
                ? 'Servicios con reportes en aumento'
                : data.hasAnyActivity ? 'Servicios con más reportes recientes' : 'Servicios de interés en Venezuela'}
            </h2>
            <p className="mt-1 max-w-lg text-xs text-ink-muted sm:text-sm">
              Si los reportes crecen de forma repentina, esos servicios suben al inicio.
              El orden se actualiza cada minuto a partir de reportes ciudadanos no sospechosos.
              Un aumento de reportes no confirma por sí solo una interrupción.
            </p>
          </div>
          <Link href="/servicios" className="shrink-0 pt-1 text-xs font-medium text-brand-600 underline-offset-4 hover:underline sm:text-sm">
            Ver todos
          </Link>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {data.featuredServices.map((service) => (
            <ServicePulseCard key={service.slug} service={service} />
          ))}
        </ul>
        <p className="mt-4 px-1 text-xs text-ink-muted">
          Las estrellas guardan preferencias solo en este dispositivo. Los logotipos identifican a sus
          respectivos titulares y no implican afiliación, patrocinio ni validación de disponibilidad.
          Los servicios sin archivo verificado muestran un identificador tipográfico.{' '}
          <Link href="/creditos-marcas" className="underline underline-offset-2 hover:text-ink">
            Fuentes y créditos de logotipos
          </Link>.
        </p>
      </section>

      {/* International services: curated groups, real data only; not an uptime guarantee. */}
      <section className="home-platform-band border-t border-border bg-surface/50" aria-labelledby="global-platforms-title">
        <div className="mx-auto max-w-6xl px-3 py-12 sm:px-6">
          <div className="px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pulse-600">
              Plataformas internacionales
            </p>
            <h2 id="global-platforms-title" className="mt-1 font-display text-xl font-semibold sm:text-2xl">
              Correo, nube, juegos y servicios del mundo
            </h2>
            <p className="mt-2 max-w-3xl text-xs text-ink-muted sm:text-sm">
              Explora Cloudflare, Gmail, Outlook, Fortnite y otras plataformas globales.
              La inclusión en el catálogo no significa que tengamos mediciones de todos los países.
              Sin reportes suficientes mostraremos «Sin datos suficientes».
            </p>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Ir a una categoría de plataformas globales">
              {data.globalServiceSections.map((section) => (
                <a key={section.id} href={`#global-${section.id}`}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:border-pulse-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pulse-500">
                  {section.title}
                </a>
              ))}
            </div>
          </div>
          {data.globalServiceSections.map((section) => (
            <div key={section.id} id={`global-${section.id}`} className="mt-10 scroll-mt-24">
              <div className="flex flex-wrap items-end justify-between gap-2 px-1">
                <div>
                  <h3 className="font-display text-lg font-semibold sm:text-xl">{section.title}</h3>
                  <p className="mt-1 text-xs text-ink-muted sm:text-sm">{section.description}</p>
                </div>
                <Link href="/servicios" className="text-xs font-medium text-brand-600 underline-offset-4 hover:underline">
                  Directorio completo
                </Link>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
                {section.services.map((service) => (
                  <ServicePulseCard key={service.slug} service={service} />
                ))}
              </ul>
            </div>
          ))}
          <p className="mt-10 px-1 text-xs text-ink-muted">
            Las gráficas solo representan reportes efectivamente registrados.
            PulsoVE es independiente de los titulares de estas marcas.
            Consulta <Link href="/creditos-marcas" className="underline underline-offset-2">créditos de logotipos</Link>.
          </p>
        </div>
      </section>

      <OfficialMicrosoftStatus />

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
              tendencia.
              {isRouteAvailable(ROUTE.methodology) && (
                <>
                  {' '}
                  <Link href={ROUTE.methodology.href} className="underline underline-offset-2 hover:text-ink">
                    Cómo funciona esto
                  </Link>
                  .
                </>
              )}
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
        {isRouteAvailable(ROUTE.methodology) && (
          <Link
            href={ROUTE.methodology.href}
            className="mt-6 inline-block text-sm text-brand-600 underline-offset-2 hover:underline"
          >
            Leer la metodología completa
          </Link>
        )}
      </section>
    </>
  );
}
