'use client';

import { useState } from 'react';
import {
  topIssuesForPeriod, type IssueBreakdownPeriod, type IssueBreakdownRow,
} from '@/lib/queries/issue-breakdown-series';

const PERIODS: readonly { key: IssueBreakdownPeriod; label: string }[] = [
  { key: '24h', label: '24 horas' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
];
const BAR_TONES = ['bg-sky-500', 'bg-teal-500', 'bg-amber-500'] as const;

export function TopIssuesBreakdown({ rows }: { rows: IssueBreakdownRow[] }) {
  const [period, setPeriod] = useState<IssueBreakdownPeriod>('24h');
  const { top, total } = topIssuesForPeriod(rows, period);
  const activePeriod = PERIODS.find((item) => item.key === period)?.label ?? '24 horas';

  return (
    <section className="service-detail-panel mt-10 rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-7"
      aria-labelledby="top-issues-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 id="top-issues-title" className="font-display text-xl font-semibold">
            Problemas más reportados
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Tres tipos de falla con más reportes en el periodo. Solo se contabilizan los envíos
            que no fueron marcados como sospechosos; estos datos no confirman la causa técnica.
          </p>
        </div>
        <fieldset className="min-w-0">
          <legend className="mb-1 text-xs font-semibold text-ink-muted">Periodo</legend>
          <div className="inline-flex max-w-full flex-wrap gap-1 rounded-lg border border-border p-1"
            aria-label="Periodo de problemas reportados">
            {PERIODS.map(({ key, label }) => (
              <button type="button" key={key} aria-pressed={period === key} onClick={() => setPeriod(key)}
                className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${period === key
                  ? 'bg-brand-600 text-white'
                  : 'text-ink-muted hover:bg-bg'}`}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-4">
        <span className="font-mono text-2xl font-semibold tabular-nums">{total}</span>
        <span className="text-xs text-ink-muted">reportes válidos · {activePeriod}</span>
      </div>

      {top.length === 0 ? (
        <p role="status" className="mt-5 rounded-lg bg-bg p-5 text-sm text-ink-muted">
          No hay reportes válidos de problemas en este periodo. Selecciona un rango más amplio
          para revisar si existen registros anteriores.
        </p>
      ) : (
        <ol className="mt-5 grid gap-4" aria-label="Tres tipos de falla más reportados">
          {top.map((item, index) => (
            <li key={item.name}>
              <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 font-semibold">
                  <span className="mr-2 font-mono text-xs text-ink-muted">{String(index + 1).padStart(2, '0')}</span>
                  {item.name}
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-ink-muted">
                  {item.sharePercent}% · {item.reports} reportes
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-border" role="progressbar"
                aria-label={`Participación de ${item.name}`} aria-valuemin={0} aria-valuemax={100}
                aria-valuenow={item.sharePercent}>
                <div className={`h-full rounded-full ${BAR_TONES[index]}`}
                  style={{ width: `${item.sharePercent}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-5 text-xs leading-5 text-ink-muted">
        Los porcentajes se calculan sobre todos los tipos reportados en el periodo, no solo
        sobre los tres principales. Los reportes representan experiencias ciudadanas.
      </p>
    </section>
  );
}
