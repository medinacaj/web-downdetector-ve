'use client';

import { useId, useState } from 'react';
import {
  Area, Bar, Brush, CartesianGrid, ComposedChart, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  incidentInBucket, type HistoryPeriod, type HistoryPoint, type ServiceHistory,
} from '@/lib/queries/service-history-series';

const PERIODS: readonly HistoryPeriod[] = ['24h', '7d', '30d', '90d'];
const PERIOD_LABELS: Record<HistoryPeriod, string> = {
  '24h': '24 horas', '7d': '7 días', '30d': '30 días', '90d': '90 días',
};
const MODES = ['line', 'area', 'bars'] as const;
type ChartMode = (typeof MODES)[number];
const MODE_LABELS: Record<ChartMode, string> = { line: 'Línea', area: 'Área', bars: 'Barras' };

export interface ChartObservation {
  id: string;
  timestamp: string;
  status: string;
  summary: string | null;
  severity: string;
  officiallyConfirmed: boolean;
}

function timeLabel(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('es-VE', {
    timeZone: 'America/Caracas', dateStyle: 'medium', timeStyle: 'short',
  }).format(date);
}

function intervalLabel(point: HistoryPoint) {
  return `${timeLabel(point.startIso)} — ${timeLabel(point.endIso)} (Caracas)`;
}

export function ServiceHistoryChart({
  serviceName, history, observations = [],
}: { serviceName: string; history: ServiceHistory; observations?: ChartObservation[] }) {
  const chartId = useId().replace(/:/g, '');
  const [period, setPeriod] = useState<HistoryPeriod>('24h');
  const [mode, setMode] = useState<ChartMode>('line');
  const [selected, setSelected] = useState(23);
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const points = history[period];
  const selectedIndex = Math.max(0, Math.min(points.length - 1, selected));
  const selectedPoint = points[selectedIndex];
  const total = points.reduce((sum, point) => sum + point.reports, 0);
  const maximum = Math.max(0, ...points.map((point) => point.reports));
  const selectedObservations = observations.filter((item) => incidentInBucket(item.timestamp, selectedPoint));
  const annotatedPoints = points.filter((point) => observations.some((item) => incidentInBucket(item.timestamp, point)));

  function choosePeriod(value: HistoryPeriod) {
    setPeriod(value);
    setSelected(history[value].length - 1);
    setZoomEnabled(false);
  }

  return (
    <section aria-labelledby="history-chart-title" className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="history-chart-title" className="font-display text-lg font-semibold">Histórico de reportes de {serviceName}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">
            Explora los reportes recibidos realmente por PulsoVE. La cantidad de reportes no mide
            tiempo en línea, disponibilidad ni confirma por sí sola una falla del proveedor.
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-ink-muted">Zona horaria: Caracas</span>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-4">
        <fieldset className="min-w-0">
          <legend className="mb-1 text-xs font-semibold text-ink-muted">Periodo</legend>
          <div className="flex flex-wrap gap-1 rounded-lg border border-border p-1" aria-label="Periodo del histórico">
            {PERIODS.map((key) => (
              <button key={key} type="button" aria-pressed={key === period} onClick={() => choosePeriod(key)}
                className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${key === period ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-border/50'}`}>{key}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="mb-1 text-xs font-semibold text-ink-muted">Visualización</legend>
          <div className="flex flex-wrap gap-1 rounded-lg border border-border p-1">
            {MODES.map((key) => (
              <button key={key} type="button" aria-pressed={key === mode} onClick={() => setMode(key)}
                className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${key === mode ? 'bg-pulse-600 text-white' : 'text-ink-muted hover:bg-border/50'}`}>{MODE_LABELS[key]}</button>
            ))}
          </div>
        </fieldset>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-bg px-4 py-4 text-sm sm:grid-cols-3">
        <div><dt className="text-xs text-ink-muted">Reportes · {PERIOD_LABELS[period]}</dt>
          <dd className="mt-1 font-mono text-xl font-semibold tabular-nums">{total}</dd></div>
        <div><dt className="text-xs text-ink-muted">Máximo por intervalo</dt>
          <dd className="mt-1 font-mono text-xl font-semibold tabular-nums">{maximum}</dd></div>
        <div className="col-span-2 sm:col-span-1"><dt className="text-xs text-ink-muted">Intervalos con incidentes registrados</dt>
          <dd className="mt-1 font-mono text-xl font-semibold tabular-nums">{annotatedPoints.length}</dd></div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-muted">Selecciona un punto para consultar el intervalo y sus incidentes.</p>
        <button type="button" aria-pressed={zoomEnabled} onClick={() => setZoomEnabled((current) => !current)}
          className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-ink hover:bg-bg focus-visible:outline-pulse-500">
          {zoomEnabled ? 'Ocultar selector de zoom' : 'Explorar rango / zoom'}
        </button>
      </div>
      <div className="mt-3">
        {total === 0 ? (
          <div className="flex min-h-[230px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-5 text-center" role="status">
            <p className="font-medium">Sin reportes registrados en este periodo</p>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-ink-muted">
              No dibujamos curvas ficticias. Cero reportes tampoco garantiza que el servicio funcione.
              Puedes revisar observaciones por fecha en el selector inferior.
            </p>
          </div>
        ) : (
          <div className="h-[270px] min-w-0 w-full sm:h-[330px]" role="img"
            aria-label={`Gráfico de ${total} reportes de ${serviceName} en ${PERIOD_LABELS[period]}; pasa el cursor para inspeccionar y haz clic para fijar un intervalo`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 15, right: 10, bottom: 5, left: -18 }}
                onClick={(state) => {
                  const index = state?.activeTooltipIndex;
                  if (typeof index === 'number' && index >= 0 && index < points.length) setSelected(index);
                }}>
                <defs><linearGradient id={`fill-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00a994" stopOpacity={0.32}/>
                  <stop offset="100%" stopColor="#00a994" stopOpacity={0.02}/>
                </linearGradient></defs>
                {zoomEnabled && <Brush dataKey="label" height={26} stroke="#008a79" travellerWidth={10}
                  startIndex={Math.max(0, points.length - (period === '24h' ? 12 : 14))}
                  endIndex={points.length - 1} />}
                <CartesianGrid strokeDasharray="3 5" stroke="#94a3b8" strokeOpacity={0.25} vertical={false}/>
                <XAxis dataKey="label" minTickGap={23} tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis allowDecimals={false} domain={[0, 'dataMax + 1']} tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
                <Tooltip cursor={{ stroke: '#00a994', strokeDasharray: '4 4' }}
                  wrapperStyle={{ outline: 'none' }}
                  contentStyle={{ borderRadius: 12, borderColor: '#64748b', color: '#172033', backgroundColor: '#ffffff', fontSize: 12 }}
                  formatter={(value) => [Number(value ?? 0).toLocaleString('es-VE'), 'Reportes']}
                  labelFormatter={(label) => {
                    const found = points.find((point) => point.label === String(label));
                    return found ? intervalLabel(found) : String(label);
                  }}
                />
                {annotatedPoints.map((point) => <ReferenceLine key={point.startIso} x={point.label} stroke="#efad69" strokeDasharray="3 4" strokeOpacity={0.7}/>)}
                <ReferenceLine x={selectedPoint.label} stroke="#158d81" strokeDasharray="2 3" strokeWidth={2}/>
                {mode === 'bars' && <Bar dataKey="reports" fill="#16a995" maxBarSize={26} radius={[3, 3, 0, 0]} isAnimationActive={false}/>}
                {mode === 'area' && <Area type="monotone" dataKey="reports" stroke="#008a79" fill={`url(#fill-${chartId})`} strokeWidth={2.5} isAnimationActive={false}/>}
                {mode === 'line' && <Line type="monotone" dataKey="reports" stroke="#008a79" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={false}/>}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <label htmlFor={`interval-picker-${chartId}`} className="text-xs font-semibold text-ink-muted">
            Seleccionar una hora o un día para inspeccionar
          </label>
          <select id={`interval-picker-${chartId}`} value={selectedIndex} onChange={(event) => setSelected(Number(event.target.value))}
            className="mt-2 block w-full min-w-0 rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-ink focus-visible:outline-pulse-500">
            {points.map((point, index) => (
              <option key={point.startIso} value={index}>{intervalLabel(point)}</option>
            ))}
          </select>
          <p className="mt-3 text-sm text-ink-muted">
            <span className="font-semibold text-ink">{selectedPoint.reports}</span> reportes registrados en el intervalo seleccionado.
          </p>
        </div>
        <div aria-live="polite" className="rounded-lg border border-border bg-bg p-4">
          <h3 className="text-sm font-semibold">Observaciones del intervalo</h3>
          <p className="mt-1 text-xs text-ink-muted">{intervalLabel(selectedPoint)}</p>
          {selectedObservations.length ? (
            <ul className="mt-3 space-y-3">
              {selectedObservations.map((item) => (
                <li key={item.id} className="border-l-2 border-amber-500 pl-3 text-xs leading-relaxed">
                  <span className="font-semibold">{item.officiallyConfirmed ? 'Confirmación oficial registrada' : 'Incidente registrado por el motor'}</span>
                  <span className="ml-2 text-ink-muted">{timeLabel(item.timestamp)}</span>
                  <p className="mt-1 text-ink-muted">{item.summary || 'Incidente sin descripción adicional.'}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              Sin observaciones de incidentes registrados para esta fecha. Esto no demuestra que no ocurrieran fallas.
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-ink-muted">
        Intervalos de 1 hora (24 h) o ventanas consecutivas de 24 horas (7, 30 y 90 días), en hora de Caracas.
        La última ventana puede estar incompleta. Las líneas verticales ámbar identifican fechas con incidentes registrados.
        Esta vista muestra conteos de reportes, no disponibilidad técnica.
      </p>
    </section>
  );
}
