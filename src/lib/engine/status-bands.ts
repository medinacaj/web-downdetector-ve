/**
 * Traduce un anomaly_score (0-100) al estado operativo visible (brief,
 * secciones 6.3 y 9.6). Umbrales fijos por ahora — la sección 9.4 pide que
 * sean configurables; se moverán a tabla/env cuando el motor real (Etapa 3)
 * los necesite de verdad. No confundir con los WEIGHT_* de .env.example,
 * que ponderan las señales de ENTRADA al score, no estas bandas de SALIDA.
 */
export type OperationalStatus =
  | 'normal'
  | 'slightly_elevated'
  | 'reports_elevated'
  | 'possible_outage'
  | 'outage_detected'
  | 'outage_high_confidence'
  | 'insufficient_data';

const BANDS: Array<{ max: number; status: OperationalStatus }> = [
  { max: 24, status: 'normal' },
  { max: 39, status: 'slightly_elevated' },
  { max: 54, status: 'reports_elevated' },
  { max: 69, status: 'possible_outage' },
  { max: 84, status: 'outage_detected' },
  { max: 100, status: 'outage_high_confidence' },
];

export function scoreToStatus(score: number): OperationalStatus {
  const clamped = Math.max(0, Math.min(100, score));
  return BANDS.find((b) => clamped <= b.max)?.status ?? 'outage_high_confidence';
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
