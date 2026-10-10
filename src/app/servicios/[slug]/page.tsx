import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServiceDetailData } from '@/lib/queries/service-detail';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReportForm } from '@/components/service/ReportForm';

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
    description: `Consulta reportes ciudadanos, incidentes y estado actual de ${data.service.name} (${data.service.category.name}) en Venezuela.`,
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getServiceDetailData(slug);
  if (!data) notFound();

  const { service, statusDetail, issueTypeOptions, issueBreakdown, recentIncidents, affectedStates, allStates } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Cabecera */}
      <div className="border-b border-border pb-6">
        <p className="text-sm text-ink-muted">{service.category.name}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{service.name}</h1>
          <StatusBadge status={statusDetail.status} />
        </div>

        {service.description && <p className="mt-2 max-w-xl text-sm text-ink-muted">{service.description}</p>}

        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {statusDetail.confidence !== null && (
            <div>
              <dt className="inline text-ink-muted">Confianza: </dt>
              <dd className="inline font-mono tabular-nums">{Math.round(statusDetail.confidence)}/100</dd>
            </div>
          )}
          {statusDetail.lastUpdated && (
            <div>
              <dt className="inline text-ink-muted">Actualizado: </dt>
              <dd className="inline">{formatDateTime(statusDetail.lastUpdated)}</dd>
            </div>
          )}
          {statusDetail.officiallyConfirmed && (
            <div className="font-medium text-status-incident">Confirmado por el proveedor</div>
          )}
        </dl>

        {service.officialUrl && (
          <a
            href={service.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-brand-600 underline-offset-2 hover:underline"
          >
            Sitio oficial ↗
          </a>
        )}

        {service.isDemo && (
          <p className="mt-3 inline-block rounded border border-border px-2 py-0.5 text-xs text-ink-muted">
            Datos demostrativos
          </p>
        )}
      </div>

      {/* Reportar */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Reportar un problema</h2>
        <p className="mt-1 text-sm text-ink-muted">Toma menos de 20 segundos y es anónimo.</p>
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
