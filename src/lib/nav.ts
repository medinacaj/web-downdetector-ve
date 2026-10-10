/**
 * Registro de rutas públicas del sitio.
 *
 * Un enlace a una página que todavía no existe termina en 404: mala experiencia
 * y enlace interno roto para los buscadores (ver .claude/rules/seo-tecnico.md).
 * Por eso todo enlace a una página que puede no existir pasa por aquí:
 *
 *   {isRouteAvailable(ROUTE.methodology) && <Link href={ROUTE.methodology.href}>…</Link>}
 *
 * Al crear una página nueva (p. ej. `src/app/mapa/page.tsx`) se activa aquí con
 * `available: true`. `tests/nav.test.ts` comprueba que `available` coincida con la
 * existencia real del archivo y que ningún componente enlace a mano (con la ruta
 * escrita como texto) a una página aún no disponible.
 */
export interface RouteInfo {
  readonly href: string;
  readonly label: string;
  readonly available: boolean;
}

export const ROUTE = {
  home: { href: '/', label: 'Inicio', available: true },
  services: { href: '/servicios', label: 'Servicios', available: true },
  // Etapa 4d (pendiente): mapa, incidentes, estadísticas y metodología.
  map: { href: '/mapa', label: 'Mapa', available: false },
  incidents: { href: '/incidentes', label: 'Incidentes', available: false },
  statistics: { href: '/estadisticas', label: 'Estadísticas', available: false },
  methodology: { href: '/metodologia', label: 'Metodología', available: false },
} as const satisfies Record<string, RouteInfo>;

export function isRouteAvailable(route: RouteInfo): boolean {
  return route.available;
}
