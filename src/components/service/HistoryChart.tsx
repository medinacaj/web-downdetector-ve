'use client';

import { useSyncExternalStore } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { niceTicks, type HistoryPoint } from '@/lib/history';

/**
 * Gráfico de las últimas 24 h de un servicio (guía de visualización): reportes por
 * ventana de 15 min como línea de 2 px con relleno al 10 %, "lo habitual" como
 * referencia gris discontinua (no se distingue solo por color), incidentes como franjas
 * y un cursor vertical con tooltip de todas las series. Los valores también están en la
 * tabla que pinta la página: el tooltip realza, no sustituye.
 */
const THEMES = {
  // Contraste de las líneas contra la superficie: serie 6,45:1 / 6,94:1; gris ≥ 5:1.
  light: { series: '#2c6483', expected: '#5b6672', grid: '#e2e8ee', text: '#5b6672', incident: '#d1493f' },
  dark: { series: '#7aabc4', expected: '#94a3b4', grid: '#263244', text: '#94a3b4', incident: '#d1493f' },
};

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}
const isDark = () => document.documentElement.classList.contains('dark');

const timeFmt = new Intl.DateTimeFormat('es-VE', {
  timeZone: 'America/Caracas',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const fmtTime = (t: number) => timeFmt.format(new Date(t));
const WINDOW_MS = 15 * 60_000;

interface Props {
  points: HistoryPoint[];
  incidents: { from: number; to: number }[];
  rangeStart: number;
  rangeEnd: number;
}

function ChartTooltip({ active, payload, incidents }: TooltipProps<number, string> & { incidents: Props['incidents'] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as HistoryPoint;
  const inIncident = incidents.some((i) => p.t >= i.from && p.t < i.to);
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink shadow-sm">
      <p className="text-ink-muted">
        {fmtTime(p.t)}–{fmtTime(p.t + WINDOW_MS)}
      </p>
      {/* El valor manda; la etiqueta, después (guía: values lead, labels follow). */}
      <p className="mt-1 flex items-center gap-2">
        <span aria-hidden="true" className="inline-block h-0.5 w-3 bg-current text-brand-500 dark:text-brand-300" />
        <strong className="text-sm">{p.reports}</strong>
        <span className="text-ink-muted">{p.reports === 1 ? 'reporte' : 'reportes'}</span>
      </p>
      {p.expected !== null && (
        <p className="mt-0.5 flex items-center gap-2">
          <span aria-hidden="true" className="inline-block w-3 border-t border-dashed border-ink-muted" />
          <strong>{Number.isInteger(p.expected) ? p.expected : p.expected.toFixed(1)}</strong>
          <span className="text-ink-muted">lo habitual</span>
        </p>
      )}
      {inIncident && <p className="mt-1 text-ink-muted">Incidente detectado en este periodo</p>}
    </div>
  );
}

export function HistoryChart({ points, incidents, rangeStart, rangeEnd }: Props) {
  const dark = useSyncExternalStore(subscribeTheme, isDark, () => false);
  const c = dark ? THEMES.dark : THEMES.light;

  const yTicks = niceTicks(Math.max(...points.map((p) => Math.max(p.reports, p.expected ?? 0))));
  const ticks: number[] = [];
  for (let t = rangeStart; t <= rangeEnd; t += 4 * 60 * 60_000) ticks.push(t);

  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke={c.grid} strokeWidth={1} />
          {incidents.map((i) => (
            <ReferenceArea key={i.from} x1={i.from} x2={i.to} fill={c.incident} fillOpacity={dark ? 0.18 : 0.12} stroke="none" />
          ))}
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={[rangeStart, rangeEnd]}
            ticks={ticks}
            tickFormatter={fmtTime}
            tick={{ fill: c.text, fontSize: 11 }}
            stroke={c.grid}
            tickLine={false}
          />
          <YAxis
            ticks={yTicks}
            domain={[0, yTicks[yTicks.length - 1]]}
            allowDecimals={false}
            width={32}
            tick={{ fill: c.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip incidents={incidents} />}
            cursor={{ stroke: c.text, strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Area
            dataKey="reports"
            type="linear"
            stroke={c.series}
            strokeWidth={2}
            fill={c.series}
            fillOpacity={0.1}
            strokeLinejoin="round"
            strokeLinecap="round"
            activeDot={{ r: 4, fill: c.series, strokeWidth: 2 }}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="expected"
            type="linear"
            stroke={c.expected}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
