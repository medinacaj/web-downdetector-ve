/**
 * Escala del cartograma: 0 reportes es una clase propia (neutra, "sin reportes") y el
 * resto se reparte en 4 clases de una sola tonalidad, relativas al máximo del período.
 * Rampas validadas con el validador de la guía de visualización (ordinal, 4 pasos):
 * claro #7aabc4→#173c53 y oscuro #2c6483→#adccdd (brand 300/400/500/700 y 500/400/300/200).
 */
export const MAP_BIN_COUNT = 4;

/** Clase 0 (sin reportes) o 1..MAP_BIN_COUNT, de menos a más. */
export function mapBin(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  for (let k = 1; k <= MAP_BIN_COUNT; k++) {
    if (count <= (max * k) / MAP_BIN_COUNT) return k;
  }
  return MAP_BIN_COUNT;
}

export interface MapLegendEntry {
  bin: number;
  from: number;
  to: number;
}

/** Rangos enteros de cada clase con reportes; omite las clases vacías (con máximos pequeños). */
export function mapLegend(max: number): MapLegendEntry[] {
  if (max <= 0) return [];
  const entries: MapLegendEntry[] = [];
  for (let k = 1; k <= MAP_BIN_COUNT; k++) {
    const from = Math.floor((max * (k - 1)) / MAP_BIN_COUNT) + 1;
    const to = Math.floor((max * k) / MAP_BIN_COUNT);
    if (to >= from) entries.push({ bin: k, from, to });
  }
  return entries;
}

/**
 * Abreviatura para la celda del cartograma (en móvil una celda mide ~30 px): iniciales
 * si el nombre tiene varias palabras ("Distrito Capital" → DC, "La Guaira" → LG), si no
 * las tres primeras letras sin tildes ("Táchira" → TAC). El nombre completo va siempre
 * en el tooltip, en `aria-label` y en la tabla.
 */
export function stateAbbreviation(name: string): string {
  const plain = name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
  const words = plain.split(/\s+/).filter(Boolean);
  return words.length > 1 ? words.map((w) => w[0]).join('') : plain.slice(0, 3);
}
