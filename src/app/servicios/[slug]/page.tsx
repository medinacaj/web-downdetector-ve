import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { suggestStateCode } from '@/lib/geo';
import { getTurnstileSiteKey, TURNSTILE_SCRIPT_URL } from '@/lib/security/turnstile';
import { getServiceDetailData } from '@/lib/queries/service-detail';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { INCIDENT_STATUS_LABELS_ES } from '@/lib/engine/status-bands';
import { formatDateTime, formatWindow } from '@/lib/format';
import { getServiceHistory } from '@/lib/queries/service-history';
import { LazyHistoryChart } from '@/components/service/LazyHistoryChart';
import { ReportForm } from '@/components/service/ReportForm';
import { pageMetadata } from '@/lib/seo/metadata';
import { ROUTE, categoryHref, serviceHref } from '@/lib/nav';
import {
  GamblingNotice,
  GAMBLING_CATEGORY_SLUG,
  GAMBLING_META_DISCLAIMER_SERVICE,
} from '@/components/service/GamblingNotice';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

// Datos en vivo: se renderiza en cada petición (si no, `next build` la congela).
export const dynamic = 'force-dynamic';



export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getServiceDetailData(slug);
  if (!data) return { title: 'Servicio no encontrado' };
  return pageMetadata({
    title: `Estado de ${data.service.name} en Venezuela`,
    // Descripción propia del servicio (semilla) + qué ofrece la página. El nombre, único,
    // hace única la frase aunque dos servicios compartan descripción ("Internet fijo.").
    description: [
      data.service.description,
      data.service.category.slug === GAMBLING_CATEGORY_SLUG ? GAMBLING_META_DISCLAIMER_SERVICE : null,
      `Consulta reportes ciudadanos, incidentes y el estado actual de ${data.service.name} en Venezuela.`,
    ]
      .filter(Boolean)
      .join(' '),
    // El slug de la base, no el de la URL pedida: es la forma canónica.
    path: serviceHref(data.service.slug),
  });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getServiceDetailData(slug);
  if (!data) notFound();

  const { service, statusDetail, issueTypeOptions, issueBreakdown, recentIncidents, affectedStates, allStates } = data;
  const history = await getServiceHistory(service.id);
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Cabecera */}
      <div className="border-b border-border pb-6">
        <Breadcrumbs
          crumbs={[
            { name: ROUTE.services.label, path: ROUTE.services.href },
            { name: service.category.name, path: categoryHref(service.category.slug) },
            { name: service.name, path: serviceHref(service.slug) },
          ]}
        />
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

        {service.category.slug === GAMBLING_CATEGORY_SLUG && <GamblingNotice subject="service" />}
      </div>

      {/* Reportar */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Reportar un problema</h2>
        <p className="mt-1 text-sm text-ink-muted">Toma menos de 20 segundos y es anónimo.</p>
        <div className="mt-4">
          <ReportForm
            serviceSlug={service.slug}
            issueTypes={issueTypeOptions}
            states={allStates}
            suggestedStateCode={suggestStateCode(await headers(), new Set(allStates.map((s) => s.code)))}
            turnstile={turnstileSiteKey ? { siteKey: turnstileSiteKey, scriptUrl: TURNSTILE_SCRIPT_URL } : null}
          />
        </div>
      </section>

      {/* Últimas 24 horas (Etapa 4d): gráfico + tabla equivalente */}
      <section className="mt-10" aria-labelledby="ultimas-24h">
        <h2 id="ultimas-24h" className="font-display text-lg font-semibold">
          Últimas 24 horas
        </h2>
        {history.totalReports === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            Sin reportes en las últimas 24 horas{history.incidents.length > 0 ? ', aunque hubo un incidente en este periodo' : ''}.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink-muted">
              {history.totalReports} {history.totalReports === 1 ? 'reporte' : 'reportes'} en ventanas de 15 minutos
              (hora de Caracas). Los valores también están en la tabla.
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted" aria-label="Leyenda">
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-block h-0.5 w-4 bg-brand-500 dark:bg-brand-300" />
                Reportes
              </li>
              {history.hasExpected && (
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block w-4 border-t-2 border-dashed border-ink-muted" />
                  Lo habitual a esa hora
                </li>
              )}
              {history.incidents.length > 0 && (
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px] bg-status-incident/20" />
                  Incidente detectado
                </li>
              )}
            </ul>
            <div className="mt-3">
              <LazyHistoryChart
                points={history.points}
                incidents={history.incidents}
                rangeStart={history.rangeStart}
                rangeEnd={history.rangeEnd}
              />
            </div>
            {!history.hasExpected && (
              <p className="mt-2 text-xs text-ink-muted">
                Todavía no hay historia suficiente para mostrar lo habitual de este servicio a cada hora.
              </p>
            )}
            <details className="mt-4 rounded-lg border border-border">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Ver como tabla</summary>
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full text-left text-sm">
                  <thead className="text-ink-muted">
                    <tr>
                      <th scope="col" className="px-4 py-2 font-medium">
                        Ventana
                      </th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">
                        Reportes
                      </th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">
                        Lo habitual
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.points
                      .filter((p) => p.reports > 0)
                      .map((p) => (
                        <tr key={p.t}>
                          <td className="px-4 py-2">{formatWindow(p.t)}</td>
                          <td className="px-4 py-2 text-right font-mono tabular-nums">{p.reports}</td>
                          <td className="px-4 py-2 text-right font-mono tabular-nums">
                            {p.expected === null ? '—' : Number.isInteger(p.expected) ? p.expected : p.expected.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <p className="px-4 py-2 text-xs text-ink-muted">Las ventanas que no aparecen tuvieron 0 reportes.</p>
              </div>
            </details>
          </>
        )}
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
                  <p className="font-medium">{INCIDENT_STATUS_LABELS_ES[inc.status] ?? inc.status}</p>
                  <p className="text-ink-muted">
                    {formatDateTime(inc.startedAt)}
                    {inc.endedAt ? ` – ${formatDateTime(inc.endedAt)}` : ' – en curso'}
                  </p>
                </div>
                {/* Resuelto: la confianza guardada es la del último ciclo, no la del incidente. */}
                <span className="font-mono text-xs text-ink-muted tabular-nums">
                  {inc.status === 'resolved'
                    ? inc.peakAt && `máximo: ${formatDateTime(inc.peakAt)}`
                    : `confianza ${Math.round(inc.confidence)}/100`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
