/**
 * Traduce un anomaly_score (0-100) al estado operativo visible (brief,
 * secciones 6.3 y 9.6). Umbrales fijos por ahora — la sección 9.4 pide que
 * sean configurables; se moverán a tabla/env cuando el motor real (Etapa 3)
 * los necesite de verdad. No confundir con los WEIGHT_* de .env.example,
 * que ponderan las señales de ENTRADA al score, no estas bandas de SALIDA.
 */
import { MIN_BASELINE_SAMPLES_FOR_STATUS } from './parameters';

export type OperationalStatus =
  | 'normal'
  | 'slightly_elevated'
  | 'reports_elevated'
  | 'possible_outage'
  | 'outage_detected'
  | 'outage_high_confidence'
  | 'insufficient_data';

/** Bandas de salida (también las muestra /metodologia). */
export const STATUS_BANDS: ReadonlyArray<{ max: number; status: OperationalStatus }> = [
  { max: 24, status: 'normal' },
  { max: 39, status: 'slightly_elevated' },
  { max: 54, status: 'reports_elevated' },
  { max: 69, status: 'possible_outage' },
  { max: 84, status: 'outage_detected' },
  { max: 100, status: 'outage_high_confidence' },
];

/**
 * Estado visible a partir de la última ventana puntuada, cuando no hay incidente
 * abierto. Sin línea base suficiente no hay evidencia de nada: "Sin datos
 * suficientes", nunca "normal" por defecto (regla innegociable de CLAUDE.md).
 */
export function windowStatus(confidence: number, baselineSampleSize: number): OperationalStatus {
  if (baselineSampleSize < MIN_BASELINE_SAMPLES_FOR_STATUS) return 'insufficient_data';
  return scoreToStatus(confidence);
}

export function scoreToStatus(score: number): OperationalStatus {
  const clamped = Math.max(0, Math.min(100, score));
  return STATUS_BANDS.find((b) => clamped <= b.max)?.status ?? 'outage_high_confidence';
}

export const STATUS_LABELS_ES: Record<OperationalStatus | 'monitoring_unavailable', string> = {
  normal: 'Funcionamiento dentro de parámetros normales',
  slightly_elevated: 'Actividad ligeramente elevada',
  reports_elevated: 'Reportes elevados',
  possible_outage: 'Posible interrupción',
  outage_detected: 'Interrupción detectada',
  outage_high_confidence: 'Interrupción de alta confianza',
  insufficient_data: 'Sin datos suficientes todavía',
  monitoring_unavailable: 'Monitoreo temporalmente no disponible',
};

/** Estados de un incidente (incidents.status), en lenguaje prudente. */
export const INCIDENT_STATUS_LABELS_ES: Record<string, string> = {
  possible: 'Posible interrupción',
  detected: 'Interrupción detectada',
  high_confidence: 'Interrupción de alta confianza',
  confirmed: 'Confirmado por el proveedor',
  recovering: 'En recuperación',
  resolved: 'Resuelto',
};
