import { formatDateTime, formatDuration } from '@/lib/format';
import type { EngineFreshness } from '@/lib/engine/freshness';

/**
 * Aviso cuando el motor no se ha ejecutado o lleva demasiado sin hacerlo
 * (ENGINE_STALE_AFTER_MINUTES). Con el motor detenido, un incidente abierto no
 * puede cerrarse y las cifras dejan de moverse: sin aviso parecerían actuales.
 * No pinta nada si los datos están al día.
 */
export function EngineFreshnessNotice({
  freshness,
  now = new Date(),
  className = 'mb-6',
}: {
  freshness: EngineFreshness;
  now?: Date;
  className?: string;
}) {
  if (freshness.state === 'fresh') return null;
  return (
    <div role="status" className={`rounded-md border border-border border-l-4 border-l-status-elevated bg-surface px-4 py-3 ${className}`}>
      <p className="text-sm text-ink">
        {freshness.state === 'stale' && freshness.lastRunAt ? (
          <>
            <strong className="font-semibold">Datos desactualizados.</strong> El motor no analiza reportes desde hace{' '}
            {formatDuration(freshness.lastRunAt, now)} (último análisis: {formatDateTime(freshness.lastRunAt)}). Los
            estados e incidentes de esta página pueden no reflejar la situación actual.
          </>
        ) : (
          <>
            <strong className="font-semibold">Sin análisis todavía.</strong> El motor aún no ha procesado ningún
            periodo de reportes: no hay estados ni incidentes calculados.
          </>
        )}
      </p>
    </div>
  );
}
