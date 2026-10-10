/**
 * Tipos de problema (brief, secciones 7.1 y 7.3 combinadas y sin
 * duplicados). `categorySlug: null` = aplica a cualquier categoría
 * (issue_types.category_id es NULLABLE en el esquema); el runner de seed
 * resuelve categorySlug -> category_id antes de insertar.
 *
 * El formulario de reporte ofrece, para cada servicio, los tipos de SU
 * categoría más los transversales (ver getIssueTypesForCategory). Por eso cada
 * categoría necesita al menos dos propios además de "Otro". Los `slug` son
 * únicos en toda la tabla: no repetir ni siquiera entre categorías distintas.
 *
 * `db:seed` sincroniza nombre y categoría con upsert; el `slug` es la clave.
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

  // Streaming
  { slug: 'sin-reproduccion', name: 'No reproduce o se corta', categorySlug: 'streaming' },
  { slug: 'inicio-sesion-streaming', name: 'Inicio de sesión', categorySlug: 'streaming' },
  { slug: 'pago-suscripcion', name: 'Pago o suscripción', categorySlug: 'streaming' },

  // Videojuegos
  { slug: 'servidores-caidos', name: 'Servidores caídos', categorySlug: 'videojuegos' },
  { slug: 'latencia-alta', name: 'Latencia alta (lag)', categorySlug: 'videojuegos' },
  { slug: 'inicio-sesion-juegos', name: 'Inicio de sesión', categorySlug: 'videojuegos' },

  // Delivery y movilidad
  {
    slug: 'pedido-no-procesa',
    name: 'Pedido o viaje no se procesa',
    categorySlug: 'delivery-y-movilidad',
  },
  { slug: 'pago-en-aplicacion', name: 'Pago en la aplicación', categorySlug: 'delivery-y-movilidad' },
  {
    slug: 'app-delivery-no-disponible',
    name: 'Aplicación no disponible',
    categorySlug: 'delivery-y-movilidad',
  },

  // Apuestas y loterías
  { slug: 'plataforma-no-carga', name: 'Plataforma no carga', categorySlug: 'apuestas-y-loterias' },
  { slug: 'deposito-retiro', name: 'Depósito o retiro', categorySlug: 'apuestas-y-loterias' },
  {
    slug: 'resultados-no-disponibles',
    name: 'Resultados no disponibles',
    categorySlug: 'apuestas-y-loterias',
  },

  // Transversal (sin categoría fija)
  { slug: 'otro', name: 'Otro', categorySlug: null },
] as const;
