import { max } from 'drizzle-orm';
import { cache } from 'react';
import { db } from '@/lib/db/client';
import { aggregatedWindows } from '@/lib/db/schema';
import { engineFreshness, type EngineFreshness } from '@/lib/engine/freshness';

/**
 * Frescura del motor: cada ciclo inserta (o reinserta) una fila por servicio
 * activo en `aggregated_windows`, también con cero reportes, así que su
 * `created_at` más reciente es el momento del último ciclo. Cacheada por
 * petición (la usan aviso y página en el mismo render).
 */
export const getEngineFreshness = cache(async (): Promise<EngineFreshness> => {
  const [row] = await db.select({ last: max(aggregatedWindows.createdAt) }).from(aggregatedWindows);
  return engineFreshness(row?.last ?? null);
});
