/**
 * Mediana y MAD (mediana de las desviaciones absolutas) en vez de
 * media/desviación estándar — el brief (sección 9.5) pide explícitamente
 * evitar la media porque los picos históricos la distorsionan. Son las
 * primitivas puras que usa baseline.ts y anomaly.ts; sin acceso a datos,
 * para poder probarlas con fixtures triviales.
 */

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function medianAbsoluteDeviation(values: number[], center?: number): number {
  if (values.length === 0) return 0;
  const m = center ?? median(values);
  const deviations = values.map((v) => Math.abs(v - m));
  return median(deviations);
}

/**
 * Z-score robusto (Iglewicz & Hoaglin): 0.6745 es la constante que hace el
 * MAD comparable a una desviación estándar bajo normalidad — convención
 * estadística estándar, no un número arbitrario.
 *
 * Cuando mad=0 (todo el historial fue idéntico), cualquier desvío real es
 * significativo por definición: se usa un mad mínimo de 1 reporte en vez
 * de dividir por cero o devolver Infinity.
 */
export function modifiedZScore(value: number, baselineMedian: number, mad: number): number {
  const effectiveMad = mad > 0 ? mad : 1;
  return (0.6745 * (value - baselineMedian)) / effectiveMad;
}
