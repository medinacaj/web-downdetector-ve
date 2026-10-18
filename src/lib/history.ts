/**
 * Serie del gráfico histórico de un servicio: una ventana de 15 minutos por punto (la
 * misma resolución con la que el motor agrega y compara), de las últimas 24 horas.
 * Funciones puras: la consulta (src/lib/queries/service-history.ts) les pasa los datos.
 */
export const HISTORY_WINDOW_MINUTES = 15;
export const HISTORY_HOURS = 24;
const WINDOW_MS = HISTORY_WINDOW_MINUTES * 60_000;

export interface HistoryPoint {
  /** Inicio de la ventana, en ms desde epoch (serializable para el componente cliente). */
  t: number;
  reports: number;
  /** Mediana habitual para esa franja, o null si no hay historia suficiente. */
  expected: number | null;
}

/** Inicio de la ventana que contiene `date`. */
export function floorToWindow(date: Date): Date {
  return new Date(Math.floor(date.getTime() / WINDOW_MS) * WINDOW_MS);
}

/**
 * Las HISTORY_HOURS×4 ventanas que terminan en la ventana actual (incluida), en orden.
 * `counts` va por inicio de ventana (ms); las ausentes valen 0. `expectedFor` devuelve
 * la mediana habitual de la franja de esa ventana, o null.
 */
export function buildHistorySeries(
  now: Date,
  counts: ReadonlyMap<number, number>,
  expectedFor: (windowStart: Date) => number | null,
): HistoryPoint[] {
  const last = floorToWindow(now).getTime();
  const n = (HISTORY_HOURS * 60) / HISTORY_WINDOW_MINUTES;
  const points: HistoryPoint[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const t = last - i * WINDOW_MS;
    points.push({ t, reports: counts.get(t) ?? 0, expected: expectedFor(new Date(t)) });
  }
  return points;
}

/** Periodo de un incidente recortado al rango del gráfico, o null si no se solapa. */
export function clipToRange(
  start: Date,
  end: Date | null,
  rangeStart: number,
  rangeEnd: number,
): { from: number; to: number } | null {
  const from = Math.max(start.getTime(), rangeStart);
  const to = Math.min(end ? end.getTime() : rangeEnd, rangeEnd);
  return to > from ? { from, to } : null;
}

/**
 * Marcas "redondas" del eje Y (guía de visualización): paso de 1, 2 o 5 × 10^k, unas
 * 4 divisiones, empezando en 0 y cubriendo `max`. Para conteos: nunca decimales.
 */
export function niceTicks(max: number, divisions = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / divisions;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow);
  const ticks: number[] = [];
  for (let t = 0; t < max + step; t += step) ticks.push(t);
  return ticks;
}
