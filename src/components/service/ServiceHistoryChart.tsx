'use client';

import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HistoryPeriod, ServiceHistory } from '@/lib/queries/service-history-series';

const PERIODS: readonly HistoryPeriod[] = ['24h', '7d', '30d'];
const PERIOD_LABELS: Record<HistoryPeriod, string> = { '24h': '24 horas', '7d': '7 días', '30d': '30 días' };

export function ServiceHistoryChart({ serviceName, history }: { serviceName: string; history: ServiceHistory }) {
  const [period, setPeriod] = useState<HistoryPeriod>('24h');
  const points = history[period];
  const total = points.reduce((sum, point) => sum + point.reports, 0);
  const maximum = points.reduce((max, point) => Math.max(max, point.reports), 0);

  return (
    <section aria-labelledby="history-chart-title" className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="history-chart-title" className="font-display text-lg font-semibold">Histórico de reportes de {serviceName}</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-muted">
            Reportes recibidos por PulsoVE. No representan tiempo de actividad ni confirman una caída del proveedor.
            Los intervalos son consecutivos y el último puede estar incompleto.
          </p>
        </div>
        <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border p-1" role="group" aria-label="Periodo del histórico">
          {PERIODS.map((key) => (
            <button key={key} type="button" aria-pressed={key === period}
              onClick={() => setPeriod(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${key === period ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-border/50'}`}>
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-b border-border pb-4 text-sm">
        <div><p className="text-xs text-ink-muted">Reportes · {PERIOD_LABELS[period]}</p><p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{total}</p></div>
        <div><p className="text-xs text-ink-muted">Máximo por intervalo</p><p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{maximum}</p></div>
      </div>

      {total === 0 ? (
        <div className="mt-5 flex min-h-[225px] flex-col items-center justify-center rounded-lg border border-dashed border-border px-5 text-center" role="status">
          <p className="text-sm font-medium">Sin reportes registrados en este periodo</p>
          <p className="mt-2 max-w-md text-xs text-ink-muted">
            No generamos curvas ficticias en la página operativa. Cero reportes no demuestra que el servicio esté disponible.
          </p>
        </div>
      ) : (
        <div className="mt-5 h-[255px] w-full min-w-0" role="img" aria-label={`Histórico de ${total} reportes recibidos de ${serviceName} durante ${PERIOD_LABELS[period]}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 12, right: 8, left: -22, bottom: 4 }}>
              <defs>
                <linearGradient id="history-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00a58b" stopOpacity={0.25}/>
                  <stop offset="100%" stopColor="#00a58b" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" stroke="#94a3b8" strokeOpacity={0.2} vertical={false}/>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={22} axisLine={false} tickLine={false}/>
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
              <Tooltip formatter={(value) => [String(value ?? 0), 'Reportes']} labelFormatter={(label) => `Intervalo: ${label}`}/>
              <Area type="monotone" dataKey="reports" stroke="#009f89" strokeWidth={2.5} fill="url(#history-area)" isAnimationActive={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-4 text-xs text-ink-muted">
        Datos agregados por hora (24 h) o intervalos móviles de 24 horas (7 y 30 días); referencia horaria: Caracas.
      </p>
    </section>
  );
}
