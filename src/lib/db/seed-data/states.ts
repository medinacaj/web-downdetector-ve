/**
 * Los 23 estados + Distrito Capital de Venezuela.
 *
 * `code` sigue ISO 3166-2:VE, verificado contra la ISO 3166 Maintenance
 * Agency (vía statoids.com, que replica la tabla oficial) el 2026-08-15.
 * Incluye la corrección de 2010-02-19 (VE-X: Vargas → La Guaira).
 *
 * Se excluye deliberadamente "Dependencias Federales" (VE-W): son islas del
 * Caribe con ~2.150 habitantes según el censo 2011, sin relevancia práctica
 * para un monitor de servicios ciudadanos. Añadible después sin migración
 * (mismo shape de tabla).
 *
 * `gridRow`/`gridCol` ubican el estado en el cartograma de cuadrícula (ver
 * schema.ts: NO son coordenadas geográficas reales). Es una primera
 * aproximación por adyacencia relativa aceptable para el MVP; conviene
 * ajustarla visualmente una vez construido components/Cartogram.tsx
 * (Etapa 4 — frontend) en lugar de tratarla como definitiva.
 */
export const statesSeed = [
  { name: 'Amazonas', code: 'VE-Z', gridRow: 6, gridCol: 3 },
  { name: 'Anzoátegui', code: 'VE-B', gridRow: 1, gridCol: 7 },
  { name: 'Apure', code: 'VE-C', gridRow: 5, gridCol: 1 },
  { name: 'Aragua', code: 'VE-D', gridRow: 2, gridCol: 5 },
  { name: 'Barinas', code: 'VE-E', gridRow: 4, gridCol: 1 },
  { name: 'Bolívar', code: 'VE-F', gridRow: 4, gridCol: 6 },
  { name: 'Carabobo', code: 'VE-G', gridRow: 2, gridCol: 4 },
  { name: 'Cojedes', code: 'VE-H', gridRow: 3, gridCol: 3 },
  { name: 'Delta Amacuro', code: 'VE-Y', gridRow: 2, gridCol: 9 },
  { name: 'Distrito Capital', code: 'VE-A', gridRow: 1, gridCol: 5 },
  { name: 'Falcón', code: 'VE-I', gridRow: 1, gridCol: 2 },
  { name: 'Guárico', code: 'VE-J', gridRow: 3, gridCol: 4 },
  { name: 'La Guaira', code: 'VE-X', gridRow: 0, gridCol: 5 },
  { name: 'Lara', code: 'VE-K', gridRow: 2, gridCol: 2 },
  { name: 'Mérida', code: 'VE-L', gridRow: 3, gridCol: 1 },
  { name: 'Miranda', code: 'VE-M', gridRow: 1, gridCol: 6 },
  { name: 'Monagas', code: 'VE-N', gridRow: 2, gridCol: 7 },
  { name: 'Nueva Esparta', code: 'VE-O', gridRow: 0, gridCol: 8 },
  { name: 'Portuguesa', code: 'VE-P', gridRow: 3, gridCol: 2 },
  { name: 'Sucre', code: 'VE-R', gridRow: 1, gridCol: 8 },
  { name: 'Táchira', code: 'VE-S', gridRow: 3, gridCol: 0 },
  { name: 'Trujillo', code: 'VE-T', gridRow: 2, gridCol: 1 },
  { name: 'Yaracuy', code: 'VE-U', gridRow: 2, gridCol: 3 },
  { name: 'Zulia', code: 'VE-V', gridRow: 1, gridCol: 0 },
] as const;
