/**
 * Parámetros del motor, en un solo lugar y sin dependencias (ni base de datos ni
 * Next): los usan el motor (anomaly.ts, incident-lifecycle.ts, baseline.ts) y la
 * página de metodología, que los muestra tal cual. Así la explicación pública
 * nunca se desincroniza del cálculo real. Los valores vienen de .env.example.
 */
const num = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isFinite(n) ? n : fallback;
};

/** Pesos de las señales del anomaly_score (brief, sección 9.4). */
export const SIGNAL_WEIGHTS = {
  deviation: num(process.env.WEIGHT_DEVIATION, 0.4),
  uniqueSources: num(process.env.WEIGHT_UNIQUE_SOURCES, 0.2),
  persistence: num(process.env.WEIGHT_PERSISTENCE, 0.15),
  geoDispersion: num(process.env.WEIGHT_GEO_DISPERSION, 0.1),
  technical: num(process.env.WEIGHT_TECHNICAL, 0.1),
  official: num(process.env.WEIGHT_OFFICIAL, 0.05),
};

/** Días de historial para la línea base. */
export const BASELINE_LOOKBACK_DAYS = num(process.env.BASELINE_LOOKBACK_DAYS, 90);

/** Apertura y cierre de incidentes (brief, secciones 9.5–9.7). */
export const INCIDENT_RULES = {
  // Umbral de apertura = límite inferior de "posible interrupción" (sección 9.6).
  openConfidence: num(process.env.INCIDENT_OPEN_CONFIDENCE, 55),
  // Cierre una banda por debajo para evitar parpadeo en el límite.
  closeConfidence: num(process.env.INCIDENT_CLOSE_CONFIDENCE, 40),
  minConsecutiveWindows: num(process.env.INCIDENT_MIN_CONSECUTIVE_WINDOWS, 2),
  // Evita que un solo reportante (o un hash duplicado) abra un incidente por sí solo.
  minUniqueReporters: num(process.env.INCIDENT_MIN_UNIQUE_REPORTERS, 2),
  // Escalado del estado del incidente según la confianza.
  detectedFrom: 70,
  highConfidenceFrom: 85,
};

/**
 * Factor de confiabilidad según cuántas ventanas históricas tiene la línea base:
 * con muy poca historia, un desvío "extremo" puede ser solo que el sistema es nuevo.
 * Bandas fijas como punto de partida, no calibradas con tráfico real.
 */
export const RELIABILITY_BANDS: ReadonlyArray<{ belowSamples: number; factor: number }> = [
  { belowSamples: 3, factor: 0.25 },
  { belowSamples: 8, factor: 0.55 },
  { belowSamples: 15, factor: 0.8 },
];
export const RELIABILITY_FULL = 1.0;

/**
 * Historia mínima (ventanas en la línea base de esa franja día×hora) para mostrar un
 * estado derivado de la confianza. Por debajo se muestra "Sin datos suficientes",
 * nunca "Normal": con 1–2 ventanas, una confianza baja no prueba nada (es el mismo
 * límite que la primera banda de confiabilidad).
 */
export const MIN_BASELINE_SAMPLES_FOR_STATUS = RELIABILITY_BANDS[0].belowSamples;

/** Límite básico de reportes por dispositivo (anti-abuso de la Etapa 2). */
export const REPORT_RATE_LIMIT = {
  max: num(process.env.RATE_LIMIT_REPORTS_MAX, 5),
  windowSeconds: num(process.env.RATE_LIMIT_REPORTS_WINDOW_SECONDS, 3600),
};

/** Duración de ventana con la que se ejecuta el motor por defecto (`aggregate:run`). */
export const DEFAULT_WINDOW_MINUTES = 15;

/**
 * Minutos sin un ciclo del motor a partir de los cuales las páginas avisan de que
 * los datos están desactualizados. Con ventanas de 15 min, un ciclo normal llega
 * cada 15 min y GitHub Actions puede retrasarlo varios minutos: 60 min son cuatro
 * ventanas, margen suficiente para no avisar por un retraso puntual. Si el motor
 * se detiene, un incidente abierto no puede cerrarse solo y seguiría mostrándose:
 * el aviso evita presentarlo como actual (lección del monitor de Cashea, que
 * también marca sus datos como desactualizados en vez de seguir mostrándolos).
 */
export const ENGINE_STALE_AFTER_MINUTES = 60;

/**
 * Ventanas cerradas que la tarea programada recupera de una vez si se perdieron
 * ejecuciones (8 × 15 min = 2 h). GitHub Actions omite ejecuciones programadas: el
 * historial del monitor de Cashea registró 44 comprobaciones en 7 días donde se
 * esperaban unas 670. Más atrás no se recupera (una ventana muy antigua ya no
 * cambia el estado actual y alargaría la ejecución).
 */
export const ENGINE_MAX_CATCH_UP_WINDOWS = 8;
