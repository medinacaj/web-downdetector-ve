'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useView } from './ViewToggle';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FavoriteButton } from '@/components/home/FavoriteButton';
import { FAVORITES_CHANGE_EVENT, FAVORITES_KEY, parseFavoriteSlugs } from '@/lib/favorites';
import type { DirectoryService } from '@/lib/queries/directory';

export function ServiceGrid({ services }: { services: DirectoryService[] }) {
  const view = useView();
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    const update = () => {
      try { setFavoriteSlugs(parseFavoriteSlugs(localStorage.getItem(FAVORITES_KEY))); }
      catch { setFavoriteSlugs([]); }
    };
    update();
    window.addEventListener('storage', update);
    window.addEventListener(FAVORITES_CHANGE_EVENT, update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener(FAVORITES_CHANGE_EVENT, update);
    };
  }, []);

  const favoriteSet = useMemo(() => new Set(favoriteSlugs), [favoriteSlugs]);
  const savedInResults = services.filter((service) => favoriteSet.has(service.slug)).length;
  const visible = favoritesOnly
    ? services.filter((service) => favoriteSet.has(service.slug))
    : services;

  if (services.length === 0) {
    return (
      <p className="rounded-xl border border-border p-8 text-center text-sm text-ink-muted" role="status">
        Ningún servicio coincide con estos filtros.
      </p>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          data-favorites-only
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly((current) => !current)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pulse-500 ${favoritesOnly
            ? 'border-pulse-600 bg-pulse-600 text-white'
            : 'border-border bg-surface text-ink hover:bg-bg'}`}
        >
          <span aria-hidden="true">☆</span>
          Solo favoritos
          <span className={favoritesOnly ? 'text-white/90' : 'text-ink-muted'}>({savedInResults})</span>
        </button>
        <p className="text-xs text-ink-muted" aria-live="polite" data-directory-results>
          Mostrando {visible.length} de {services.length} servicios
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-5 py-9 text-center" role="status">
          <p className="text-sm font-semibold">No hay favoritos en estos resultados</p>
          <p className="mt-2 text-sm text-ink-muted">
            Guarda servicios con la estrella o cambia los filtros de búsqueda.
            Los favoritos permanecen solo en este navegador.
          </p>
          <button type="button" className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            onClick={() => setFavoritesOnly(false)}>Mostrar todos</button>
        </div>
      ) : view === 'list' ? (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface" data-directory-list>
          {visible.map((s) => (
            <li key={s.slug} data-rapid-surge={s.surgeScore > 0 ? 'true' : 'false'} className="relative flex min-w-0 items-center transition-colors hover:bg-bg">
              <Link
                href={`/servicios/${encodeURIComponent(s.slug)}`}
                aria-label={`Ver estado y reportes de ${s.name}`}
                className="directory-service-link flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="text-xs text-ink-muted">{s.categoryName}</p>
                  {s.surgeScore > 0 && <p className="mt-1 text-xs font-medium text-brand-600">↗ Reportes en aumento</p>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-4">
                  <span className="font-mono text-xs text-ink-muted tabular-nums">
                    {s.reportsLast24h} rep. (24h)
                  </span>
                  <StatusBadge status={s.status} size="sm" />
                </div>
              </Link>
              <div className="directory-favorite-action relative z-20 shrink-0 px-2">
                <FavoriteButton slug={s.slug} name={s.name} inline />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-directory-grid>
          {visible.map((s) => (
            <li key={s.slug} data-rapid-surge={s.surgeScore > 0 ? 'true' : 'false'} className="relative flex min-w-0 flex-col rounded-xl border border-border bg-surface shadow-sm transition-[box-shadow,background-color] hover:bg-bg hover:shadow-md">
              <Link
                href={`/servicios/${encodeURIComponent(s.slug)}`}
                aria-label={`Ver estado y reportes de ${s.name}`}
                className="directory-service-link flex min-w-0 flex-1 flex-col gap-3 px-4 pb-2 pt-4"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-ink-muted">{s.categoryName}</p>
                  {s.surgeScore > 0 && <p className="mt-1 text-xs font-medium text-brand-600">↗ Reportes en aumento</p>}
                  </div>
                  <StatusBadge status={s.status} size="sm" />
                </div>
                {s.description && <p className="line-clamp-2 text-sm text-ink-muted">{s.description}</p>}
                <p className="mt-auto font-mono text-xs text-ink-muted tabular-nums">
                  {s.reportsLast24h} reportes (24h)
                </p>
              </Link>
              <div className="directory-favorite-action relative z-20 flex justify-end px-3 pb-2">
                <FavoriteButton slug={s.slug} name={s.name} inline />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
