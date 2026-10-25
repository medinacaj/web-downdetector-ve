import { ENGINE_STALE_AFTER_MINUTES } from './parameters';

/** never: el motor no ha procesado ninguna ventana; stale: lleva demasiado sin ejecutarse. */
export type EngineFreshnessState = 'never' | 'fresh' | 'stale';

export interface EngineFreshness {
  state: EngineFreshnessState;
  /** Momento del último ciclo del motor (cuándo se ejecutó, no la ventana que procesó). */
  lastRunAt: Date | null;
  /** Minutos desde el último ciclo (null si nunca se ejecutó). */
  minutesSinceRun: number | null;
}

/** Puro (sin base de datos) para poder probarlo. Un reloj desfasado hacia el futuro cuenta como reciente. */
export function engineFreshness(lastRunAt: Date | null, now: Date = new Date()): EngineFreshness {
  if (!lastRunAt) return { state: 'never', lastRunAt: null, minutesSinceRun: null };
  const minutes = Math.max(0, Math.floor((now.getTime() - lastRunAt.getTime()) / 60_000));
  return {
    state: minutes >= ENGINE_STALE_AFTER_MINUTES ? 'stale' : 'fresh',
    lastRunAt,
    minutesSinceRun: minutes,
  };
}
