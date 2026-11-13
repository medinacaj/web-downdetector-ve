import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServiceDetailData } from '@/lib/queries/service-detail';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReportForm } from '@/components/service/ReportForm';
import { BrandMark } from '@/components/home/BrandMark';
import { ServiceHistoryChart } from '@/components/service/ServiceHistoryChart';
import { getServiceProfile } from '@/lib/catalog/service-profiles';

function formatDateTime(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat('es-VE', {
    timeZone: 'America/Caracas',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  possible: 'Posible interrupción',
  detected: 'Interrupción detectada',
  high_confidence: 'Interrupción de alta confianza',
  confirmed: 'Confirmado por el proveedor',
  recovering: 'En recuperación',
  resolved: 'Resuelto',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getServiceDetailData(slug);
  if (!data) return { title: 'Servicio no encontrado' };
  return {
    title: `Estado de ${data.service.name} en Venezuela`,
    alternates: { canonical: `/servicios/${encodeURIComponent(data.service.slug)}` },
    description: `${data.service.name}: ${data.service.description || data.service.category.name}. Consulta reportes e incidentes registrados, sin confundirlos con disponibilidad confirmada.`,
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getServiceDetailData(slug);
  if (!data) notFound();

  const { service, statusDetail, issueTypeOptions, issueBreakdown, recentIncidents, affectedStates, allStates, history } = data;
  const profile = getServiceProfile({slug: service.slug, categoryName: service.category.name, description: service.description});

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Ficha editorial y estado, independientes de las mediciones. */}
      <nav aria-label="Ruta de navegación" className="mb-5 text-sm text-ink-muted">
        <Link href="/servicios" className="underline underline-offset-2 hover:text-ink">Todos los servicios</Link>
        <span aria-hidden="true" className="px-2">/</span>{service.name}
      </nav>
      <header className="rounded-xl border border-border bg-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-start gap-5 sm:flex-nowrap">
          <div className="h-24 w-28 shrink-0 rounded-xl border border-border bg-white p-2">
            <BrandMark slug={service.slug} name={service.name} categorySlug={service.category.slug} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{profile.type}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{service.name}</h1>
              <StatusBadge status={statusDetail.status} />
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted">{profile.description}</p>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Etiquetas">
              {profile.tags.map((tag) => <span key={tag} className="rounded-full border border-border bg-bg px-3 py-1 text-xs text-ink-muted">{tag}</span>)}
            </div>
          </div>
          <a href="#reportar" className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-red-500">
            ! Reportar falla
          </a>
        </div>

        <dl className="mt-6 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-xs text-ink-muted">Empresa / proveedor</dt>
            <dd className="mt-1 font-semibold">{profile.provider ?? 'Por verificar'}</dd></div>
          <div><dt className="text-xs text-ink-muted">Tipo de plataforma</dt>
            <dd className="mt-1 font-semibold">{profile.type}</dd></div>
          <div><dt className="text-xs text-ink-muted">Confianza del estado</dt>
            <dd className="mt-1 font-semibold">{statusDetail.confidence === null ? 'Sin datos suficientes' : Math.round(statusDetail.confidence) + '/100'}</dd></div>
          <div><dt className="text-xs text-ink-muted">Última señal procesada</dt>
            <dd className="mt-1 font-semibold">{formatDateTime(statusDetail.lastUpdated) ?? 'Sin registros'}</dd></div>
        </dl>
        {statusDetail.officiallyConfirmed && <p className="mt-4 text-sm font-semibold text-status-incident">Incidente confirmado por el proveedor.</p>}
        {service.officialUrl && <a href={service.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-brand-600 underline-offset-2 hover:underline">Visitar sitio oficial verificado</a>}
        {service.isDemo && <p className="mt-4 rounded-md border border-border px-3 py-2 text-xs text-ink-muted">Servicio del catálogo demostrativo: no confirma que PulsoVE disponga de mediciones técnicas de este proveedor.</p>}
        {service.category.slug === 'apuestas-y-loterias' && (
          <p className="mt-3 rounded border border-border bg-bg px-3 py-2 text-xs text-ink-muted">
            PulsoVE solo informa de disponibilidad técnica. Su inclusión no promueve ni confirma autorización del servicio.
          </p>
        )}
      </header>

      <div className="mt-6">
        <ServiceHistoryChart serviceName={service.name} history={history} />
      </div>

      {/* Reportar */}
      <section id="reportar" className="mt-8 scroll-mt-24" aria-labelledby="reportar-title">
        <h2 id="reportar-title" className="font-display text-lg font-semibold">Reportar una falla de {service.name}</h2>
        <p className="mt-1 text-sm text-ink-muted">Selecciona el problema y tu estado, acepta la declaración y envía. Puedes añadir detalles opcionales.</p>
        <div className="mt-4">
          <ReportForm serviceSlug={service.slug} issueTypes={issueTypeOptions} states={allStates} />
        </div>
      </section>

      {/* Tipos de problema */}
      {issueBreakdown.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Tipos de problema reportados</h2>
          <ul className="mt-3 space-y-2">
            {issueBreakdown.map((it) => {
              const max = issueBreakdown[0].count || 1;
              return (
                <li key={it.name} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 truncate text-sm">{it.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(it.count / max) * 100}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-xs text-ink-muted tabular-nums">
                    {it.count}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Actividad geográfica */}
      {affectedStates.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Actividad geográfica</h2>
          <p className="mt-1 text-sm text-ink-muted">Reportes agregados por estado — nunca ubicaciones individuales.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {affectedStates.map((s) => (
              <li key={s.code} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>{s.name}</span>
                <span className="font-mono text-ink-muted tabular-nums">{s.reports}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Incidentes recientes */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">Incidentes recientes</h2>
        {recentIncidents.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Sin incidentes registrados para este servicio todavía.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {recentIncidents.map((inc) => (
              <li key={inc.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium">{INCIDENT_STATUS_LABELS[inc.status] ?? inc.status}</p>
                  <p className="text-ink-muted">
                    {formatDateTime(inc.startedAt)}
                    {inc.endedAt ? ` – ${formatDateTime(inc.endedAt)}` : ' – en curso'}
                  </p>
                </div>
                <span className="font-mono text-xs text-ink-muted tabular-nums">
                  confianza {Math.round(inc.confidence)}/100
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
