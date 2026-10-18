import type { Metadata } from 'next';
import Link from 'next/link';
import { getIncidentsOverview, RESOLVED_LOOKBACK_DAYS, type IncidentListItem } from '@/lib/queries/incidents';
import { INCIDENT_STATUS_LABELS_ES } from '@/lib/engine/status-bands';
import { formatDateTime, formatDuration } from '@/lib/format';
import { pageMetadata } from '@/lib/seo/metadata';
import { ROUTE, categoryHref, isRouteAvailable, serviceHref } from '@/lib/nav';

// Datos en vivo: se renderiza en cada petición (si no, `next build` la congela).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMetadata({
  title: 'Incidentes detectados',
  description:
    'Posibles interrupciones de servicios en Venezuela detectadas por el motor de PulsoVE a partir de reportes ciudadanos: activas y resueltas recientemente.',
  path: ROUTE.incidents.href,
});

function IncidentRow({ incident, now }: { incident: IncidentListItem; now: Date }) {
  const end = incident.endedAt ?? now;
  return (
    <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium">
          <Link href={serviceHref(incident.service.slug)} className="underline-offset-4 hover:underline">
            {incident.service.name}
          </Link>
          <span className="text-ink-muted"> · </span>
          <Link
            href={categoryHref(incident.category.slug)}
            className="text-sm font-normal text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            {incident.category.name}
          </Link>
        </p>
        <p className="mt-0.5 text-sm">
          {INCIDENT_STATUS_LABELS_ES[incident.status] ?? incident.status}
          {incident.officiallyConfirmed && <span className="text-ink-muted"> · confirmado por el proveedor</span>}
          {incident.service.isDemo && <span className="text-ink-muted"> · datos demostrativos</span>}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">
          {formatDateTime(incident.startedAt)}
          {incident.endedAt ? ` – ${formatDateTime(incident.endedAt)}` : ' – en curso'} (
          {formatDuration(incident.startedAt, end)})
        </p>
        {incident.states.length > 0 && (
          <p className="mt-0.5 text-sm text-ink-muted">Estados con reportes: {incident.states.join(', ')}</p>
        )}
      </div>
      {/* En un resuelto, `confidence` es la del último ciclo (baja, ya en recuperación):
          mostrarla como si fuera la del incidente engañaría. Se muestra cuándo fue el máximo. */}
      <span className="shrink-0 font-mono text-xs text-ink-muted tabular-nums">
        {incident.status === 'resolved'
          ? incident.peakAt && `máximo: ${formatDateTime(incident.peakAt)}`
          : `confianza ${Math.round(incident.confidence)}/100`}
      </span>
    </li>
  );
}

export default async function IncidentsPage() {
  const now = new Date();
  const { active, resolved } = await getIncidentsOverview(now);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Incidentes detectados</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">
        Los abre y cierra el motor estadístico cuando los reportes ciudadanos se desvían de lo habitual para cada
        servicio, con persistencia y varios reportantes distintos. Son <strong>detecciones probables</strong>, no
        confirmaciones del proveedor salvo que se indique.
        {isRouteAvailable(ROUTE.methodology) && (
          <>
            {' '}
            <Link href={ROUTE.methodology.href} className="underline underline-offset-2 hover:text-ink">
              Cómo se detectan
            </Link>
            .
          </>
        )}
      </p>

      <section className="mt-10" aria-labelledby="activos">
        <h2 id="activos" className="font-display text-lg font-semibold">
          Activos <span className="font-mono text-sm font-normal text-ink-muted tabular-nums">({active.length})</span>
        </h2>
        {active.length === 0 ? (
          <p className="mt-3 rounded-lg border border-border p-5 text-sm text-ink-muted">
            El motor no ha detectado ninguna interrupción en curso. Eso no garantiza que todos los servicios funcionen:
            puede que no haya reportes suficientes para evaluarlos.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {active.map((i) => (
              <IncidentRow key={i.id} incident={i} now={now} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="resueltos">
        <h2 id="resueltos" className="font-display text-lg font-semibold">
          Resueltos en los últimos {RESOLVED_LOOKBACK_DAYS} días{' '}
          <span className="font-mono text-sm font-normal text-ink-muted tabular-nums">({resolved.length})</span>
        </h2>
        {resolved.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Ninguno en este período.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {resolved.map((i) => (
              <IncidentRow key={i.id} incident={i} now={now} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
