'use client';

import { useMemo, useState } from 'react';
import {
  MAP_PERIODS, regionCount, regionIntensity, type MapPeriod, type StateActivity,
} from '@/lib/queries/map-activity';

const INTENSITY = [
  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100',
  'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100',
  'bg-sky-200 text-sky-950 dark:bg-sky-900 dark:text-sky-100',
  'bg-cyan-300 text-cyan-950 dark:bg-cyan-800 dark:text-white',
  'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950',
] as const;

export function RegionalActivityMap({ regions, serviceName }: {
  regions: StateActivity[];
  serviceName: string | null;
}) {
  const [period, setPeriod] = useState<MapPeriod>('24h');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const counts = useMemo(() => {
    const values = regions.map((region) => regionCount(region, period));
    return {
      total: values.reduce((sum, value) => sum + value, 0),
      maximum: Math.max(0, ...values),
      active: values.filter((value) => value > 0).length,
    };
  }, [regions, period]);
  const selected = regions.find((region) => region.code === selectedCode) ?? null;
  const periodLabel = MAP_PERIODS.find(({ key }) => key === period)?.label ?? '24 horas';
  const leaders = [...regions].filter((region) => regionCount(region, period) > 0)
    .sort((a, b) => regionCount(b, period) - regionCount(a, period)
      || a.name.localeCompare(b.name, 'es'))
    .slice(0, 5);

  return (
    <section className="mt-8 space-y-5" aria-labelledby="map-activity-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="map-activity-title" className="font-display text-xl font-semibold">
            Distribución de reportes por estado
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">
            {serviceName ? `Servicio: ${serviceName}.` : 'Todos los servicios.'}
            {' '}Cada estado se representa como una casilla aproximada, no como un polígono geográfico.
          </p>
        </div>
        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-ink-muted">Periodo de reportes</legend>
          <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border p-1">
            {MAP_PERIODS.map(({ key, label }) => (
              <button key={key} type="button" aria-pressed={key === period}
                onClick={() => setPeriod(key)}
                className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${period === key
                  ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-bg'}`}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface p-4 shadow-sm">
          <dt className="text-xs text-ink-muted">Reportes válidos · {periodLabel}</dt>
          <dd className="mt-2 font-mono text-2xl font-semibold tabular-nums">{counts.total}</dd>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-sm">
          <dt className="text-xs text-ink-muted">Estados con reportes</dt>
          <dd className="mt-2 font-mono text-2xl font-semibold tabular-nums">{counts.active} / {regions.length}</dd>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-sm">
          <dt className="text-xs text-ink-muted">Región con mayor conteo</dt>
          <dd className="mt-2 text-sm font-semibold">{leaders[0]?.name ?? 'Sin registros'}</dd>
        </div>
      </dl>

      <div className="rounded-2xl bg-surface p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Cartograma interactivo de Venezuela</p>
          <p className="text-xs text-ink-muted">Selecciona un estado para consultar su conteo</p>
        </div>
        <div className="regional-cartogram grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-10"
          aria-label={`Cartograma de actividad regional en ${periodLabel}`}>
          {regions.map((region) => {
            const count = regionCount(region, period);
            const intensity = regionIntensity(count, counts.maximum);
            const chosen = selectedCode === region.code;
            return (
              <button type="button" key={region.code} onClick={() => setSelectedCode(region.code)}
                aria-pressed={chosen}
                aria-label={`${region.name}: ${count} reportes en ${periodLabel}`}
                className={`regional-cartogram-cell flex min-h-20 min-w-0 flex-col items-center justify-center rounded-xl px-2 py-3 text-center shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${chosen ? 'ring-2 ring-brand-600 ring-offset-2' : ''} ${INTENSITY[intensity]}`}
                style={{
                  ['--region-col' as string]: region.gridCol + 1,
                  ['--region-row' as string]: region.gridRow + 1,
                }}>
                <span className="break-words text-xs font-semibold leading-4">{region.name}</span>
                <span className="mt-2 font-mono text-sm font-bold tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-ink-muted" aria-label="Intensidad relativa">
          <span>Menor actividad</span>
          {INTENSITY.map((tone, index) => (
            <span key={tone} className={`inline-flex h-5 w-5 rounded ${tone}`}
              aria-label={index === 0 ? 'Sin reportes' : `Nivel relativo ${index} de 4`} />
          ))}
          <span>Mayor actividad</span>
        </div>
        <p className="mt-3 text-xs leading-5 text-ink-muted">
          La escala de color compara conteos entre estados del periodo seleccionado.
          No mide personas afectadas ni confirma una interrupción regional.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-surface p-5 shadow-sm" aria-live="polite">
          <h3 className="text-base font-semibold">{selected ? selected.name : 'Detalle de un estado'}</h3>
          {selected ? (
            <>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{regionCount(selected, period)}</p>
              <p className="mt-1 text-sm text-ink-muted">reportes válidos en {periodLabel.toLowerCase()}</p>
              <button type="button" onClick={() => setSelectedCode(null)}
                className="mt-4 text-xs font-semibold text-brand-600 underline underline-offset-2">Cerrar selección</button>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-ink-muted">Selecciona una casilla del cartograma. Solo mostramos totales agregados.</p>
          )}
        </div>
        <div className="rounded-xl bg-surface p-5 shadow-sm">
          <h3 className="text-base font-semibold">Regiones con más reportes</h3>
          {leaders.length ? (
            <ol className="mt-3 space-y-2">
              {leaders.map((region, index) => (
                <li key={region.code}>
                  <button type="button" onClick={() => setSelectedCode(region.code)}
                    className="flex w-full justify-between gap-4 rounded-lg py-2 text-left text-sm hover:bg-bg focus-visible:outline-2 focus-visible:outline-brand-600">
                    <span><span className="mr-2 font-mono text-xs text-ink-muted">{index + 1}.</span>{region.name}</span>
                    <span className="font-mono tabular-nums">{regionCount(region, period)}</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : <p className="mt-3 text-sm text-ink-muted">No hay reportes válidos en este periodo.</p>}
        </div>
      </div>
    </section>
  );
}
