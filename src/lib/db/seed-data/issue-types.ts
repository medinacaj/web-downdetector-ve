/**
 * Tipos de problema (brief, secciones 7.1 y 7.3 combinadas y sin
 * duplicados). `categorySlug: null` = aplica a cualquier categoría
 * (issue_types.category_id es NULLABLE en el esquema); el runner de seed
 * resuelve categorySlug -> category_id antes de insertar.
 */
export const issueTypesSeed = [
  // Telecomunicaciones
  { slug: 'sin-conexion', name: 'Sin conexión', categorySlug: 'telecomunicaciones' },
  { slug: 'lentitud', name: 'Lentitud', categorySlug: 'telecomunicaciones' },
  { slug: 'senal-intermitente', name: 'Señal intermitente', categorySlug: 'telecomunicaciones' },

  // Banca y pagos
  { slug: 'transaccion-fallida', name: 'Transacción fallida', categorySlug: 'banca-y-pagos' },
  { slug: 'inicio-sesion-banca', name: 'Inicio de sesión', categorySlug: 'banca-y-pagos' },
  { slug: 'pago-movil', name: 'Pago móvil no procesa', categorySlug: 'banca-y-pagos' },

  // Servicios públicos
  { slug: 'sin-suministro', name: 'Sin suministro', categorySlug: 'servicios-publicos' },
  {
    slug: 'suministro-intermitente',
    name: 'Suministro intermitente',
    categorySlug: 'servicios-publicos',
  },
  { slug: 'portal-no-disponible', name: 'Portal no disponible', categorySlug: 'servicios-publicos' },

  // Plataformas digitales
  {
    slug: 'app-no-disponible',
    name: 'Aplicación no disponible',
    categorySlug: 'plataformas-digitales',
  },
  { slug: 'inicio-sesion-app', name: 'Inicio de sesión', categorySlug: 'plataformas-digitales' },
  { slug: 'envio-mensajes', name: 'Envío de mensajes', categorySlug: 'plataformas-digitales' },

  // Transversal (sin categoría fija)
  { slug: 'otro', name: 'Otro', categorySlug: null },
] as const;
