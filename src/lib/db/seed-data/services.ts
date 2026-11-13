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

  // ── correo-y-productividad (servicios internacionales solicitados) ──────────
  { slug: "gmail", name: "Gmail", categorySlug: "correo-y-productividad", description: "Correo electrónico de Google." },
  { slug: "outlook", name: "Outlook", categorySlug: "correo-y-productividad", description: "Correo web y aplicación de Microsoft." },
  { slug: "yahoo-mail", name: "Yahoo Mail", categorySlug: "correo-y-productividad", description: "Correo electrónico de Yahoo." },
  { slug: "proton-mail", name: "Proton Mail", categorySlug: "correo-y-productividad", description: "Correo electrónico y servicios de privacidad." },
  { slug: "icloud-mail", name: "iCloud Mail", categorySlug: "correo-y-productividad", description: "Correo electrónico de Apple." },
  { slug: "microsoft-365", name: "Microsoft 365", categorySlug: "correo-y-productividad", description: "Aplicaciones de productividad y servicios empresariales en la nube." },
  { slug: "microsoft-teams", name: "Microsoft Teams", categorySlug: "correo-y-productividad", description: "Chat, videollamadas y reuniones de trabajo." },
  { slug: "google-workspace", name: "Google Workspace", categorySlug: "correo-y-productividad", description: "Suite de correo y colaboración empresarial de Google." },
  { slug: "google-drive", name: "Google Drive", categorySlug: "correo-y-productividad", description: "Almacenamiento y sincronización de archivos." },
  { slug: "google-meet", name: "Google Meet", categorySlug: "correo-y-productividad", description: "Videoconferencias y reuniones en línea." },
  { slug: "google-docs", name: "Google Docs", categorySlug: "correo-y-productividad", description: "Edición colaborativa de documentos en línea." },
  { slug: "onedrive", name: "OneDrive", categorySlug: "correo-y-productividad", description: "Almacenamiento y sincronización de archivos de Microsoft." },
  { slug: "dropbox", name: "Dropbox", categorySlug: "correo-y-productividad", description: "Almacenamiento y uso compartido de archivos." },
  { slug: "zoom", name: "Zoom", categorySlug: "correo-y-productividad", description: "Videollamadas y reuniones en línea." },
  { slug: "slack", name: "Slack", categorySlug: "correo-y-productividad", description: "Mensajería y colaboración para equipos." },
  { slug: "notion", name: "Notion", categorySlug: "correo-y-productividad", description: "Espacio de trabajo para notas y proyectos." },
  { slug: "canva", name: "Canva", categorySlug: "correo-y-productividad", description: "Herramientas de diseño y colaboración visual." },

  // ── nube-e-infraestructura (servicios internacionales solicitados) ──────────
  { slug: "cloudflare", name: "Cloudflare", categorySlug: "nube-e-infraestructura", description: "Servicios de CDN, DNS, protección y alojamiento de aplicaciones." },
  { slug: "amazon-web-services", name: "Amazon Web Services (AWS)", categorySlug: "nube-e-infraestructura", description: "Infraestructura, cómputo y servicios cloud." },
  { slug: "google-cloud", name: "Google Cloud", categorySlug: "nube-e-infraestructura", description: "Infraestructura, datos y servicios en la nube." },
  { slug: "microsoft-azure", name: "Microsoft Azure", categorySlug: "nube-e-infraestructura", description: "Infraestructura y servicios cloud de Microsoft." },
  { slug: "github", name: "GitHub", categorySlug: "nube-e-infraestructura", description: "Repositorios, código y automatizaciones de desarrollo." },
  { slug: "gitlab", name: "GitLab", categorySlug: "nube-e-infraestructura", description: "Repositorios de código y herramientas DevOps." },
  { slug: "vercel", name: "Vercel", categorySlug: "nube-e-infraestructura", description: "Despliegue y alojamiento de aplicaciones web." },
  { slug: "netlify", name: "Netlify", categorySlug: "nube-e-infraestructura", description: "Despliegue y alojamiento de sitios web." },
  { slug: "digitalocean", name: "DigitalOcean", categorySlug: "nube-e-infraestructura", description: "Servidores e infraestructura en la nube." },
  { slug: "supabase", name: "Supabase", categorySlug: "nube-e-infraestructura", description: "Base de datos, autenticación y servicios backend." },
  { slug: "firebase", name: "Firebase", categorySlug: "nube-e-infraestructura", description: "Servicios backend y desarrollo de aplicaciones." },
  { slug: "docker-hub", name: "Docker Hub", categorySlug: "nube-e-infraestructura", description: "Registro y distribución de imágenes de contenedores." },
  { slug: "npm-registry", name: "npm", categorySlug: "nube-e-infraestructura", description: "Registro de paquetes JavaScript." },
  { slug: "heroku", name: "Heroku", categorySlug: "nube-e-infraestructura", description: "Plataforma de despliegue de aplicaciones." },
  { slug: "oracle-cloud", name: "Oracle Cloud", categorySlug: "nube-e-infraestructura", description: "Infraestructura y servicios en la nube." },

  // ── inteligencia-artificial (servicios internacionales solicitados) ──────────
  { slug: "chatgpt", name: "ChatGPT", categorySlug: "inteligencia-artificial", description: "Asistente conversacional de OpenAI." },
  { slug: "claude", name: "Claude", categorySlug: "inteligencia-artificial", description: "Asistente de inteligencia artificial de Anthropic." },
  { slug: "google-gemini", name: "Google Gemini", categorySlug: "inteligencia-artificial", description: "Asistente de inteligencia artificial de Google." },
  { slug: "microsoft-copilot", name: "Microsoft Copilot", categorySlug: "inteligencia-artificial", description: "Asistente de inteligencia artificial de Microsoft." },
  { slug: "perplexity", name: "Perplexity", categorySlug: "inteligencia-artificial", description: "Buscador y asistente de respuestas con inteligencia artificial." },
  { slug: "deepseek", name: "DeepSeek", categorySlug: "inteligencia-artificial", description: "Servicios de modelos y chat de inteligencia artificial." },
  { slug: "grok", name: "Grok", categorySlug: "inteligencia-artificial", description: "Asistente de inteligencia artificial de xAI." },

  // ── comercio-global (servicios internacionales solicitados) ──────────
  { slug: "amazon", name: "Amazon", categorySlug: "comercio-global", description: "Plataforma de compras en línea." },
  { slug: "paypal", name: "PayPal", categorySlug: "comercio-global", description: "Pagos y transferencias digitales." },
  { slug: "stripe", name: "Stripe", categorySlug: "comercio-global", description: "Infraestructura para procesar pagos digitales." },
  { slug: "shopify", name: "Shopify", categorySlug: "comercio-global", description: "Servicios para crear y administrar tiendas en línea." },
  { slug: "aliexpress", name: "AliExpress", categorySlug: "comercio-global", description: "Mercado internacional de comercio electrónico." },
  { slug: "ebay", name: "eBay", categorySlug: "comercio-global", description: "Plataforma de compraventa en línea." },
  { slug: "temu", name: "Temu", categorySlug: "comercio-global", description: "Mercado en línea de productos de consumo." },

  // ── videojuegos (servicios internacionales solicitados) ──────────
  { slug: "fortnite", name: "Fortnite", categorySlug: "videojuegos", description: "Videojuego en línea de Epic Games." },
  { slug: "epic-games-store", name: "Epic Games Store", categorySlug: "videojuegos", description: "Tienda de videojuegos y cuentas de Epic Games." },
  { slug: "valorant", name: "VALORANT", categorySlug: "videojuegos", description: "Videojuego competitivo multijugador." },
  { slug: "league-of-legends", name: "League of Legends", categorySlug: "videojuegos", description: "Videojuego competitivo multijugador." },
  { slug: "minecraft", name: "Minecraft", categorySlug: "videojuegos", description: "Juego con servidores y servicios multijugador." },
  { slug: "rocket-league", name: "Rocket League", categorySlug: "videojuegos", description: "Juego multijugador de fútbol con vehículos." },
  { slug: "fall-guys", name: "Fall Guys", categorySlug: "videojuegos", description: "Juego multijugador en línea." },
  { slug: "pubg-battlegrounds", name: "PUBG: Battlegrounds", categorySlug: "videojuegos", description: "Videojuego de supervivencia multijugador." },
  { slug: "genshin-impact", name: "Genshin Impact", categorySlug: "videojuegos", description: "Juego de rol en línea." },
  { slug: "apex-legends", name: "Apex Legends", categorySlug: "videojuegos", description: "Videojuego competitivo multijugador." },
  { slug: "counter-strike-2", name: "Counter-Strike 2", categorySlug: "videojuegos", description: "Videojuego de disparos competitivo en línea." },
  { slug: "call-of-duty-warzone", name: "Call of Duty: Warzone", categorySlug: "videojuegos", description: "Videojuego multijugador en línea." },
  { slug: "battle-net", name: "Battle.net", categorySlug: "videojuegos", description: "Servicios de cuentas, clientes y juegos de Blizzard." },
  { slug: "world-of-warcraft", name: "World of Warcraft", categorySlug: "videojuegos", description: "Juego de rol multijugador masivo en línea." },
  { slug: "nintendo-switch-online", name: "Nintendo Switch Online", categorySlug: "videojuegos", description: "Servicios de juego en línea y suscripción de Nintendo." },
  { slug: "ea-app", name: "EA app", categorySlug: "videojuegos", description: "Cliente y servicios en línea de juegos de Electronic Arts." },
  { slug: "geforce-now", name: "GeForce NOW", categorySlug: "videojuegos", description: "Plataforma de videojuegos por streaming." },

  // ── plataformas-digitales (servicios internacionales solicitados) ──────────
  { slug: "discord", name: "Discord", categorySlug: "plataformas-digitales", description: "Comunidades de voz, video y mensajes en línea." },
  { slug: "reddit", name: "Reddit", categorySlug: "plataformas-digitales", description: "Comunidades y debates en línea." },
  { slug: "snapchat", name: "Snapchat", categorySlug: "plataformas-digitales", description: "Mensajes y contenido social multimedia." },
  { slug: "pinterest", name: "Pinterest", categorySlug: "plataformas-digitales", description: "Plataforma de inspiración y contenido visual." },
  { slug: "threads", name: "Threads", categorySlug: "plataformas-digitales", description: "Red social de conversaciones y publicaciones." },
  { slug: "google-search", name: "Google Search", categorySlug: "plataformas-digitales", description: "Servicio de búsqueda en internet." },

  // ── streaming (servicios internacionales solicitados) ──────────
  { slug: "twitch", name: "Twitch", categorySlug: "streaming", description: "Transmisión de video y directos en línea." },
  { slug: "kick", name: "Kick", categorySlug: "streaming", description: "Transmisión de video en vivo." },


  // International expansion: Nov 2026. Catalogue entries are NOT uptime claims.
  { slug: "fastly", name: "Fastly", categorySlug: "nube-e-infraestructura", description: "Red de distribución de contenido y seguridad perimetral." },
  { slug: "akamai", name: "Akamai", categorySlug: "nube-e-infraestructura", description: "Distribución de contenido, seguridad y servicios en la nube." },
  { slug: "render", name: "Render", categorySlug: "nube-e-infraestructura", description: "Alojamiento y despliegue de aplicaciones web." },
  { slug: "railway", name: "Railway", categorySlug: "nube-e-infraestructura", description: "Plataforma de despliegue de aplicaciones y bases de datos." },
  { slug: "fly-io", name: "Fly.io", categorySlug: "nube-e-infraestructura", description: "Infraestructura de despliegue de aplicaciones." },
  { slug: "ovhcloud", name: "OVHcloud", categorySlug: "nube-e-infraestructura", description: "Servicios de servidores y alojamiento en la nube." },
  { slug: "hetzner-cloud", name: "Hetzner Cloud", categorySlug: "nube-e-infraestructura", description: "Servidores virtuales y computación en la nube." },
  { slug: "mongodb-atlas", name: "MongoDB Atlas", categorySlug: "nube-e-infraestructura", description: "Base de datos administrada en la nube." },
  { slug: "redis-cloud", name: "Redis Cloud", categorySlug: "nube-e-infraestructura", description: "Base de datos Redis administrada." },
  { slug: "hugging-face", name: "Hugging Face", categorySlug: "nube-e-infraestructura", description: "Plataforma para modelos y aplicaciones de inteligencia artificial." },
  { slug: "cloudinary", name: "Cloudinary", categorySlug: "nube-e-infraestructura", description: "Gestión y entrega de imágenes y vídeos en la nube." },
  { slug: "zoho-mail", name: "Zoho Mail", categorySlug: "correo-y-productividad", description: "Correo electrónico y herramientas empresariales." },
  { slug: "fastmail", name: "Fastmail", categorySlug: "correo-y-productividad", description: "Servicio de correo electrónico." },
  { slug: "tuta-mail", name: "Tuta Mail", categorySlug: "correo-y-productividad", description: "Correo electrónico cifrado." },
  { slug: "gmx-mail", name: "GMX Mail", categorySlug: "correo-y-productividad", description: "Servicio de correo electrónico." },
  { slug: "aol-mail", name: "AOL Mail", categorySlug: "correo-y-productividad", description: "Servicio de correo electrónico." },
  { slug: "proton-drive", name: "Proton Drive", categorySlug: "correo-y-productividad", description: "Almacenamiento de archivos en la nube." },
  { slug: "box", name: "Box", categorySlug: "correo-y-productividad", description: "Gestión y almacenamiento de archivos empresariales." },
  { slug: "figma", name: "Figma", categorySlug: "correo-y-productividad", description: "Diseño colaborativo de interfaces." },
  { slug: "trello", name: "Trello", categorySlug: "correo-y-productividad", description: "Gestión de proyectos mediante tableros." },
  { slug: "asana", name: "Asana", categorySlug: "correo-y-productividad", description: "Gestión de tareas y proyectos." },
  { slug: "dota-2", name: "Dota 2", categorySlug: "videojuegos", description: "Videojuego competitivo multijugador." },
  { slug: "overwatch-2", name: "Overwatch 2", categorySlug: "videojuegos", description: "Videojuego de acción multijugador." },
  { slug: "destiny-2", name: "Destiny 2", categorySlug: "videojuegos", description: "Videojuego de acción y servicios online." },
  { slug: "warframe", name: "Warframe", categorySlug: "videojuegos", description: "Juego cooperativo de acción en línea." },
  { slug: "gta-online", name: "GTA Online", categorySlug: "videojuegos", description: "Modo de juego multijugador en línea." },
  { slug: "pokemon-go", name: "Pokémon GO", categorySlug: "videojuegos", description: "Juego móvil conectado a servicios en línea." },
  { slug: "brawl-stars", name: "Brawl Stars", categorySlug: "videojuegos", description: "Juego móvil multijugador." },
  { slug: "clash-of-clans", name: "Clash of Clans", categorySlug: "videojuegos", description: "Juego móvil de estrategia en línea." },
  { slug: "mobile-legends", name: "Mobile Legends: Bang Bang", categorySlug: "videojuegos", description: "Juego móvil competitivo multijugador." },
  { slug: "among-us", name: "Among Us", categorySlug: "videojuegos", description: "Juego multijugador en línea." },
  { slug: "efootball", name: "eFootball", categorySlug: "videojuegos", description: "Juego de fútbol con funciones en línea." },
  { slug: "ea-sports-fc", name: "EA Sports FC", categorySlug: "videojuegos", description: "Franquicia de juegos de fútbol con servicios en línea." },
  { slug: "honkai-star-rail", name: "Honkai: Star Rail", categorySlug: "videojuegos", description: "Juego de rol conectado a servicios en línea." },
  { slug: "ubisoft-connect", name: "Ubisoft Connect", categorySlug: "videojuegos", description: "Plataforma de cuentas y juegos de Ubisoft." },
  { slug: "riot-games", name: "Riot Games", categorySlug: "videojuegos", description: "Servicios de juegos y cuentas de Riot Games." },
  { slug: "signal", name: "Signal", categorySlug: "plataformas-digitales", description: "Mensajería privada." },
  { slug: "wechat", name: "WeChat", categorySlug: "plataformas-digitales", description: "Mensajería y servicios digitales." },
  { slug: "line", name: "LINE", categorySlug: "plataformas-digitales", description: "Mensajería y llamadas en línea." },
  { slug: "bluesky", name: "Bluesky", categorySlug: "plataformas-digitales", description: "Red social de publicaciones." },
  { slug: "mastodon", name: "Mastodon", categorySlug: "plataformas-digitales", description: "Red social federada." },
  { slug: "tumblr", name: "Tumblr", categorySlug: "plataformas-digitales", description: "Plataforma de publicaciones y comunidades." },
  { slug: "quora", name: "Quora", categorySlug: "plataformas-digitales", description: "Plataforma de preguntas y respuestas." },
  { slug: "apple-music", name: "Apple Music", categorySlug: "streaming", description: "Servicio de música en streaming." },
  { slug: "youtube-music", name: "YouTube Music", categorySlug: "streaming", description: "Servicio de música en streaming." },
  { slug: "deezer", name: "Deezer", categorySlug: "streaming", description: "Música y pódcast en streaming." },
  { slug: "tidal", name: "TIDAL", categorySlug: "streaming", description: "Servicio de música en streaming." },
  { slug: "apple-tv-plus", name: "Apple TV+", categorySlug: "streaming", description: "Servicio de vídeo por suscripción." },
  { slug: "crunchyroll", name: "Crunchyroll", categorySlug: "streaming", description: "Servicio de anime por streaming." },
  { slug: "pluto-tv", name: "Pluto TV", categorySlug: "streaming", description: "Televisión y vídeo por streaming." },
  { slug: "plex", name: "Plex", categorySlug: "streaming", description: "Plataforma de vídeo y biblioteca multimedia." },
  { slug: "soundcloud", name: "SoundCloud", categorySlug: "streaming", description: "Publicación y reproducción de audio en línea." },
  { slug: "wise", name: "Wise", categorySlug: "comercio-global", description: "Transferencias y pagos internacionales." },
  { slug: "revolut", name: "Revolut", categorySlug: "comercio-global", description: "Servicios bancarios y financieros digitales." },
  { slug: "western-union", name: "Western Union", categorySlug: "comercio-global", description: "Transferencias internacionales de dinero." },
  { slug: "cash-app", name: "Cash App", categorySlug: "comercio-global", description: "Servicio de pagos digitales." },
  { slug: "venmo", name: "Venmo", categorySlug: "comercio-global", description: "Aplicación de pagos entre personas." },
  { slug: "etsy", name: "Etsy", categorySlug: "comercio-global", description: "Mercado de productos artesanales y creativos." },
  { slug: "shein", name: "SHEIN", categorySlug: "comercio-global", description: "Plataforma de comercio de moda en línea." },
  { slug: "walmart", name: "Walmart", categorySlug: "comercio-global", description: "Comercio minorista y compras en línea." },
  { slug: "airbnb", name: "Airbnb", categorySlug: "comercio-global", description: "Plataforma de reservas de alojamiento." },
  { slug: "uber", name: "Uber", categorySlug: "delivery-y-movilidad", description: "Servicio de transporte por aplicación." },
  { slug: "lyft", name: "Lyft", categorySlug: "delivery-y-movilidad", description: "Servicio de transporte por aplicación." },
  { slug: "bolt", name: "Bolt", categorySlug: "delivery-y-movilidad", description: "Servicio de movilidad por aplicación." },
  { slug: "uber-eats", name: "Uber Eats", categorySlug: "delivery-y-movilidad", description: "Plataforma de entrega de comidas." },
  { slug: "doordash", name: "DoorDash", categorySlug: "delivery-y-movilidad", description: "Plataforma de entrega de pedidos." },
  { slug: "openrouter", name: "OpenRouter", categorySlug: "inteligencia-artificial", description: "Plataforma de acceso a modelos de inteligencia artificial." },
  { slug: "character-ai", name: "Character.AI", categorySlug: "inteligencia-artificial", description: "Servicio de conversaciones con personajes de IA." },
  { slug: "poe", name: "Poe", categorySlug: "inteligencia-artificial", description: "Plataforma de acceso a asistentes de inteligencia artificial." },
] as const;
