import { getMicrosoftOfficialStatuses, type OfficialStatus } from '@/lib/official-status/microsoft-rss';

const PRESENTATION: Record<OfficialStatus, { label: string; className: string }> = {
  available: { label: 'Centro disponible', className: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800' },
  degraded: { label: 'Degradación comunicada', className: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800' },
  interrupted: { label: 'Interrupción comunicada', className: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800' },
  incident_reported: { label: 'Incidente publicado', className: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800' },
  no_public_incidents: { label: 'Sin incidentes publicados', className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600' },
  unknown: { label: 'Estado no verificable', className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600' },
};

function timestamp(value: string | null): string {
  if (!value) return 'No informada';
  return new Intl.DateTimeFormat('es-VE', {
    timeZone: 'America/Caracas', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(value));
}

export async function OfficialMicrosoftStatus() {
  const feeds = await getMicrosoftOfficialStatuses();
  return (
    <section className="border-t border-border bg-surface/50" aria-labelledby="microsoft-official-status">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pulse-600">Fuentes oficiales</p>
        <h2 id="microsoft-official-status" className="mt-1 font-display text-xl font-semibold sm:text-2xl">
          Estado publicado por Microsoft
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">
          RSS oficiales, consultados por el servidor con caché de cinco minutos. Son comunicados del proveedor,
          independientes de los reportes ciudadanos y de las mediciones de PulsoVE.
        </p>
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          {feeds.map((feed) => {
            const presentation = PRESENTATION[feed.status];
            return (
              <li key={feed.id} className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-display font-semibold">{feed.name}</h3>
                <span className={'mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ' + presentation.className}>
                  {presentation.label}
                </span>
                <p className="mt-3 text-xs text-ink-muted">{feed.scope}</p>
                {feed.summary && <p className="mt-3 line-clamp-4 text-sm">{feed.summary}</p>}
                <p className="mt-3 text-xs text-ink-muted">Publicación: {timestamp(feed.publishedAt)}</p>
                <p className="mt-1 text-xs text-ink-muted">Actualización del feed: {timestamp(feed.updatedAt)}</p>
                <a href={feed.statusUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-brand-600 underline-offset-2 hover:underline">
                  Consultar fuente oficial
                </a>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-ink-muted">
          Sin entradas RSS no significa disponibilidad comprobada. Las incidencias generales no confirman
          que un servicio específico, un país o una suscripción estén afectados.
        </p>
      </div>
    </section>
  );
}
