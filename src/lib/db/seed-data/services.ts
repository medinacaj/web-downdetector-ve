/**
 * Servicios semilla — lista inicial configurable, NO definitiva.
 *
 * - Los 16 primeros (telecomunicaciones, bancos, Patria, Corpoelec, WhatsApp,
 *   Instagram) vienen del brief, sección 4.2. `cashea` se añadió después, a
 *   pedido explícito. El resto del catálogo (streaming, videojuegos, delivery
 *   y movilidad, apuestas y loterías, más bancos, billeteras, portales y redes)
 *   se añadió también a pedido, con un criterio de evidencia pública de uso o
 *   disponibilidad en Venezuela. Fuente, fecha y exclusiones de cada entrada:
 *   docs/CATALOGO-SERVICIOS.md. Para añadir o retirar servicios sigue ese
 *   documento; no basta con editar este archivo.
 *
 * - `officialUrl` se deja SIEMPRE null: el brief prohíbe explícitamente
 *   inventar URLs oficiales (secciones 4.2 y 28), y aunque varias son de
 *   dominio público bien conocido, este seed no es el lugar para afirmarlas
 *   como verificadas — schema.ts ya documenta la convención: null = "pendiente
 *   de verificación". Verificar y cargar antes de cualquier despliegue con
 *   datos reales (sección 4.2, último párrafo).
 *
 * - `isDemo: true` en todas las filas: son registros de demostración para que
 *   la plataforma tenga contenido navegable, no una afirmación operativa sobre
 *   estas empresas. El frontend renderiza la insignia "Datos demostrativos" en
 *   cualquier tarjeta/página donde is_demo = true.
 *
 * - Las descripciones son deliberadamente neutras y genéricas ("lo que hace",
 *   no "qué tan bueno es"): sin cifras, sin promociones y sin afirmaciones de
 *   cobertura, precio o legalidad que no estén respaldadas por una fuente.
 *
 * - `db:seed` solo INSERTA los servicios que faltan (onConflictDoNothing por
 *   slug): una descripción editada después en la base de datos no se pisa. El
 *   `slug` forma parte de la URL pública (/servicios/<slug>): no cambiarlo sin
 *   redirección permanente.
 */
export const servicesSeed = [
  // ── Telecomunicaciones ──────────────────────────────────────────────────
  {
    slug: 'cantv',
    name: 'CANTV',
    categorySlug: 'telecomunicaciones',
    description: 'Internet fijo, fibra óptica, telefonía fija y televisión por suscripción.',
  },
  {
    slug: 'digitel',
    name: 'Digitel',
    categorySlug: 'telecomunicaciones',
    description: 'Telefonía móvil y datos móviles.',
  },
  {
    slug: 'movistar',
    name: 'Movistar',
    categorySlug: 'telecomunicaciones',
    description: 'Telefonía móvil, datos móviles e internet por fibra.',
  },
  {
    slug: 'movilnet',
    name: 'Movilnet',
    categorySlug: 'telecomunicaciones',
    description: 'Telefonía móvil y datos móviles.',
  },
  {
    slug: 'inter',
    name: 'Inter',
    categorySlug: 'telecomunicaciones',
    description: 'Internet fijo e inalámbrico.',
  },
  {
    slug: 'netuno',
    name: 'NetUno',
    categorySlug: 'telecomunicaciones',
    description: 'Internet fijo.',
  },
  {
    slug: 'fibex',
    name: 'Fibex',
    categorySlug: 'telecomunicaciones',
    description: 'Internet por fibra óptica.',
  },
  {
    slug: 'vnet',
    name: 'VNET',
    categorySlug: 'telecomunicaciones',
    description: 'Internet inalámbrico.',
  },
  {
    slug: 'thundernet',
    name: 'Thundernet',
    categorySlug: 'telecomunicaciones',
    description: 'Internet inalámbrico.',
  },
  {
    slug: 'simple-tv',
    name: 'Simple TV',
    categorySlug: 'telecomunicaciones',
    description: 'Televisión por suscripción.',
  },
  {
    slug: 'supercable',
    name: 'Supercable',
    categorySlug: 'telecomunicaciones',
    description: 'Proveedor de servicios de internet.',
  },
  {
    slug: 'airtek',
    name: 'Airtek',
    categorySlug: 'telecomunicaciones',
    description: 'Proveedor de servicios de internet.',
  },
  {
    slug: 'g-network',
    name: 'G-Network',
    categorySlug: 'telecomunicaciones',
    description: 'Proveedor de servicios de internet.',
  },

  // ── Banca y pagos ───────────────────────────────────────────────────────
  {
    slug: 'banco-de-venezuela',
    name: 'Banco de Venezuela',
    categorySlug: 'banca-y-pagos',
    description: 'Banca en línea, aplicación móvil y pago móvil.',
  },
  {
    slug: 'banesco',
    name: 'Banesco',
    categorySlug: 'banca-y-pagos',
    description: 'Banca en línea, aplicación móvil y pago móvil.',
  },
  {
    slug: 'mercantil',
    name: 'Mercantil',
    categorySlug: 'banca-y-pagos',
    description: 'Banca en línea, aplicación móvil y pago móvil.',
  },
  {
    slug: 'bbva-provincial',
    name: 'BBVA Provincial',
    categorySlug: 'banca-y-pagos',
    description: 'Banca en línea, aplicación móvil y pago móvil.',
  },
  {
    slug: 'bnc',
    name: 'BNC',
    categorySlug: 'banca-y-pagos',
    description: 'Banco Nacional de Crédito: banca en línea, aplicación móvil y pago móvil.',
  },
  {
    slug: 'banco-digital-de-los-trabajadores',
    name: 'Banco Digital de los Trabajadores',
    categorySlug: 'banca-y-pagos',
    description: 'Banca en línea, aplicación móvil y pago móvil.',
  },
  {
    slug: 'bancamiga',
    name: 'Bancamiga',
    categorySlug: 'banca-y-pagos',
    description: 'Banca en línea, aplicación móvil y pago móvil.',
  },
  {
    slug: 'banco-del-tesoro',
    name: 'Banco del Tesoro',
    categorySlug: 'banca-y-pagos',
    description: 'Banca en línea, aplicación móvil y pago móvil.',
  },
  {
    slug: 'bancaribe',
    name: 'Bancaribe',
    categorySlug: 'banca-y-pagos',
    description: 'Banca en línea, aplicación móvil y pago móvil.',
  },
  {
    slug: 'banplus',
    name: 'Banplus',
    categorySlug: 'banca-y-pagos',
    description: 'Banca en línea, aplicación móvil y pago móvil.',
  },
  {
    slug: 'cashea',
    name: 'Cashea',
    categorySlug: 'banca-y-pagos',
    description: 'Compras a crédito en cuotas (modalidad "compra ahora, paga después"), usada en comercios físicos y en línea.',
  },
  {
    slug: 'ubii',
    name: 'Ubii',
    categorySlug: 'banca-y-pagos',
    description: 'Billetera y pagos en bolívares: pago móvil, transferencias y tarjeta prepagada.',
  },
  {
    slug: 'zinli',
    name: 'Zinli',
    categorySlug: 'banca-y-pagos',
    description: 'Billetera digital con saldo en dólares y tarjeta virtual o física.',
  },
  {
    slug: 'reserve',
    name: 'Reserve',
    categorySlug: 'banca-y-pagos',
    description: 'Billetera digital para mover dinero entre usuarios.',
  },
  {
    slug: 'binance',
    name: 'Binance',
    categorySlug: 'banca-y-pagos',
    description: 'Plataforma para comprar y vender criptomonedas.',
  },
  {
    slug: 'creska',
    name: 'Creska',
    categorySlug: 'banca-y-pagos',
    description: 'Billetera digital con tarjeta prepagada.',
  },
  {
    slug: 'mony',
    name: 'Mony',
    categorySlug: 'banca-y-pagos',
    description: 'Billetera digital con tarjeta de débito.',
  },
  {
    slug: 'wally',
    name: 'Wally',
    categorySlug: 'banca-y-pagos',
    description: 'Billetera digital con tarjeta de débito.',
  },

  // ── Servicios públicos ──────────────────────────────────────────────────
  {
    slug: 'sistema-patria',
    name: 'Sistema Patria',
    categorySlug: 'servicios-publicos',
    description: 'Plataforma gubernamental de trámites y beneficios sociales.',
  },
  {
    slug: 'corpoelec',
    name: 'Corpoelec',
    categorySlug: 'servicios-publicos',
    description: 'Suministro eléctrico nacional.',
  },
  {
    slug: 'hidroven',
    name: 'Hidroven',
    categorySlug: 'servicios-publicos',
    description: 'Suministro de agua potable.',
  },
  {
    slug: 'seniat',
    name: 'SENIAT',
    categorySlug: 'servicios-publicos',
    description: 'Portal y aplicación de trámites tributarios y aduaneros.',
  },
  {
    slug: 'saime',
    name: 'SAIME',
    categorySlug: 'servicios-publicos',
    description: 'Portal de trámites de identificación y migración.',
  },
  {
    slug: 'bcv',
    name: 'Banco Central de Venezuela',
    categorySlug: 'servicios-publicos',
    description: 'Portal oficial del banco central, con el tipo de cambio de referencia.',
  },

  // ── Plataformas digitales ───────────────────────────────────────────────
  {
    slug: 'whatsapp',
    name: 'WhatsApp',
    categorySlug: 'plataformas-digitales',
    description: 'Mensajería instantánea.',
  },
  {
    slug: 'instagram',
    name: 'Instagram',
    categorySlug: 'plataformas-digitales',
    description: 'Red social de fotos y video.',
  },
  {
    slug: 'facebook',
    name: 'Facebook',
    categorySlug: 'plataformas-digitales',
    description: 'Red social.',
  },
  {
    slug: 'messenger',
    name: 'Messenger',
    categorySlug: 'plataformas-digitales',
    description: 'Mensajería de Facebook.',
  },
  {
    slug: 'x-twitter',
    name: 'X (antes Twitter)',
    categorySlug: 'plataformas-digitales',
    description: 'Red social de mensajes cortos.',
  },
  {
    slug: 'tiktok',
    name: 'TikTok',
    categorySlug: 'plataformas-digitales',
    description: 'Plataforma de video corto.',
  },
  {
    slug: 'telegram',
    name: 'Telegram',
    categorySlug: 'plataformas-digitales',
    description: 'Mensajería instantánea.',
  },
  {
    slug: 'linkedin',
    name: 'LinkedIn',
    categorySlug: 'plataformas-digitales',
    description: 'Red social profesional.',
  },
  {
    slug: 'mercado-libre',
    name: 'Mercado Libre',
    categorySlug: 'plataformas-digitales',
    description: 'Mercado en línea (comercio electrónico) para comprar y vender.',
  },

  // ── Streaming ───────────────────────────────────────────────────────────
  {
    slug: 'netflix',
    name: 'Netflix',
    categorySlug: 'streaming',
    description: 'Video bajo demanda por suscripción.',
  },
  {
    slug: 'disney-plus',
    name: 'Disney+',
    categorySlug: 'streaming',
    description: 'Video bajo demanda por suscripción.',
  },
  {
    slug: 'hbo-max',
    name: 'HBO Max',
    categorySlug: 'streaming',
    description: 'Video bajo demanda por suscripción (marca anterior: Max).',
  },
  {
    slug: 'prime-video',
    name: 'Prime Video',
    categorySlug: 'streaming',
    description: 'Video bajo demanda por suscripción.',
  },
  {
    slug: 'paramount-plus',
    name: 'Paramount+',
    categorySlug: 'streaming',
    description: 'Video bajo demanda por suscripción.',
  },
  {
    slug: 'spotify',
    name: 'Spotify',
    categorySlug: 'streaming',
    description: 'Música y pódcast en streaming.',
  },
  {
    slug: 'youtube',
    name: 'YouTube',
    categorySlug: 'streaming',
    description: 'Plataforma de video en línea.',
  },

  // ── Videojuegos ─────────────────────────────────────────────────────────
  {
    slug: 'call-of-duty-mobile',
    name: 'Call of Duty: Mobile',
    categorySlug: 'videojuegos',
    description: 'Juego para móviles con partidas en línea.',
  },
  {
    slug: 'free-fire',
    name: 'Free Fire',
    categorySlug: 'videojuegos',
    description: 'Juego para móviles con partidas en línea.',
  },
  {
    slug: 'roblox',
    name: 'Roblox',
    categorySlug: 'videojuegos',
    description: 'Plataforma de juegos en línea creados por usuarios.',
  },
  {
    slug: 'steam',
    name: 'Steam',
    categorySlug: 'videojuegos',
    description: 'Tienda y plataforma de juegos para PC.',
  },
  {
    slug: 'playstation-network',
    name: 'PlayStation Network',
    categorySlug: 'videojuegos',
    description: 'Servicios en línea de PlayStation: juego en línea, tienda y cuentas.',
  },
  {
    slug: 'xbox',
    name: 'Xbox',
    categorySlug: 'videojuegos',
    description: 'Servicios en línea de Xbox: juego en línea, tienda y cuentas.',
  },

  // ── Delivery y movilidad ────────────────────────────────────────────────
  {
    slug: 'yummy',
    name: 'Yummy',
    categorySlug: 'delivery-y-movilidad',
    description: 'Aplicación de pedidos a domicilio.',
  },
  {
    slug: 'pedidosya',
    name: 'PedidosYa',
    categorySlug: 'delivery-y-movilidad',
    description: 'Aplicación de pedidos a domicilio.',
  },
  {
    slug: 'zupper',
    name: 'Zupper',
    categorySlug: 'delivery-y-movilidad',
    description: 'Aplicación de pedidos a domicilio.',
  },
  {
    slug: 'farmatodo',
    name: 'Farmatodo',
    categorySlug: 'delivery-y-movilidad',
    description: 'Entrega a domicilio de la cadena de farmacias Farmatodo.',
  },
  {
    slug: 'yummy-rides',
    name: 'Yummy Rides',
    categorySlug: 'delivery-y-movilidad',
    description: 'Transporte privado por aplicación.',
  },
  {
    slug: 'ridery',
    name: 'Ridery',
    categorySlug: 'delivery-y-movilidad',
    description: 'Transporte privado por aplicación.',
  },
  {
    slug: 'yango',
    name: 'Yango',
    categorySlug: 'delivery-y-movilidad',
    description: 'Transporte privado por aplicación.',
  },

  // ── Apuestas y loterías (revisión legal profesional pendiente) ──────────
  {
    slug: '1xbet',
    name: '1xBet',
    categorySlug: 'apuestas-y-loterias',
    description: 'Casa de apuestas deportivas en línea.',
  },
  {
    slug: 'lotto-activo',
    name: 'Lotto Activo',
    categorySlug: 'apuestas-y-loterias',
    description: 'Lotería de animalitos con sorteos diarios.',
  },
  {
    slug: 'la-granjita',
    name: 'La Granjita',
    categorySlug: 'apuestas-y-loterias',
    description: 'Lotería con sorteos diarios.',
  },
  {
    slug: 'triple-tachira',
    name: 'Triple Táchira',
    categorySlug: 'apuestas-y-loterias',
    description: 'Lotería de sorteos triples (combinaciones de tres dígitos).',
  },
  {
    slug: 'kino-tachira',
    name: 'Kino Táchira',
    categorySlug: 'apuestas-y-loterias',
    description: 'Lotería asociada al estado Táchira.',
  },
] as const;
