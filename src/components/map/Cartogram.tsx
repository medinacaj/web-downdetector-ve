import type { StateActivity } from '@/lib/queries/map';
import { mapBin, mapLegend, stateAbbreviation } from '@/lib/map-scale';

/**
 * Cartograma de cuadrícula: una celda por estado, colocada por adyacencia aproximada
 * (states.grid_row/grid_col; no es un mapa geográfico a escala). Color de una sola
 * tonalidad según la cantidad de reportes; 0 reportes es una celda neutra.
 * Rellenos y texto validados (contraste del texto ≥ 4,5:1 en cada clase y tema).
 */
const BIN_CLASSES: Record<number, string> = {
  0: 'border border-border bg-surface text-ink-muted',
  1: 'bg-brand-300 text-brand-950 dark:bg-brand-500 dark:text-white',
  2: 'bg-brand-400 text-brand-950',
  3: 'bg-brand-500 text-white dark:bg-brand-300 dark:text-brand-950',
  4: 'bg-brand-700 text-white dark:bg-brand-200 dark:text-brand-950',
};

// `hidden` (no `invisible`): un tooltip oculto no debe ensanchar la página. Se alinea hacia
// dentro según la columna para que, visible, tampoco se salga por los bordes en móvil.
function tooltipAlign(col: number, cols: number): string {
  if (col < cols / 3) return 'left-0';
  if (col >= (cols * 2) / 3) return 'right-0';
  return 'left-1/2 -translate-x-1/2';
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('es-VE')} ${n === 1 ? one : many}`;

export function Cartogram({ states }: { states: StateActivity[] }) {
  const max = Math.max(0, ...states.map((s) => s.totalReports));
  const rows = Math.max(...states.map((s) => s.gridRow)) + 1;
  const cols = Math.max(...states.map((s) => s.gridCol)) + 1;
  const legend = mapLegend(max);

  return (
    // Ancho acotado: en escritorio, celdas de ~56 px bastan; más grandes solo ocupan pantalla.
    <figure className="max-w-xl">
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, auto)` }}
      >
        {states.map((s) => {
          const bin = mapBin(s.totalReports, max);
          const label = `${s.name}: ${plural(s.totalReports, 'reporte', 'reportes')}`;
          return (
            <div
              key={s.code}
              tabIndex={0}
              aria-label={label}
              className={`group relative flex aspect-square flex-col items-center justify-center rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-pulse-500 ${BIN_CLASSES[bin]}`}
              style={{ gridRow: s.gridRow + 1, gridColumn: s.gridCol + 1 }}
            >
              <span aria-hidden="true" className="text-[10px] font-medium leading-none sm:text-xs">
                {stateAbbreviation(s.name)}
              </span>
              <span aria-hidden="true" className="mt-0.5 font-mono text-[10px] leading-none tabular-nums sm:text-xs">
                {s.totalReports}
              </span>
              {/* Tooltip: realza, no sustituye (los mismos datos están en la tabla). */}
              <span
                role="tooltip"
                className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden w-max max-w-[11rem] rounded-md border border-border bg-surface px-2.5 py-1.5 text-left text-xs text-ink shadow-sm group-hover:block group-focus:block ${tooltipAlign(s.gridCol, cols)}`}
              >
                <span className="block font-medium">{s.name}</span>
                <span className="block text-ink-muted">{plural(s.totalReports, 'reporte', 'reportes')}</span>
                <span className="block text-ink-muted">
                  {plural(s.uniqueReporters, 'reportante distinto', 'reportantes distintos')}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <figcaption className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-[3px] ${BIN_CLASSES[0]}`} />
          Sin reportes
        </span>
        {legend.map((e) => (
          <span key={e.bin} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-[3px] ${BIN_CLASSES[e.bin]}`} />
            {e.from === e.to ? e.from : `${e.from}–${e.to}`}
          </span>
        ))}
        <span className="basis-full sm:basis-auto">Esquema por adyacencia aproximada, no a escala.</span>
      </figcaption>
    </figure>
  );
}
