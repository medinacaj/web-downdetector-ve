import { scoreToStatus, type OperationalStatus } from './status-bands';
export function statusFromWindow(window: { confidence: number; totalReports: number; windowEnd: Date }, now = new Date()): OperationalStatus {
  // Tolerancia de dos ciclos del worker (15 min); no es un compromiso de disponibilidad.
  const age = now.getTime() - window.windowEnd.getTime();
  if (window.totalReports <= 0 || window.confidence <= 0 || !Number.isFinite(age) || age < 0 || age > 30 * 60_000) return 'insufficient_data';
  return scoreToStatus(window.confidence);
}
