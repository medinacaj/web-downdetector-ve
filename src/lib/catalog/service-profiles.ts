/**
 * Curated editorial context for platform pages. Entries are descriptive and
 * DO NOT imply operational monitoring, coverage, official endorsement or uptime.
 * Omitted owners must be shown as "Por verificar", never guessed from a slug.
 * Keep owner identity distinct from the owner of a domain or a reseller.
 */
export interface ServiceProfile {
  provider: string | null;
  type: string;
  description: string;
  tags: string[];
  companyOverview: string;
  mainUses: string[];
  monitoringContext: string;
  sourceUrl: string | null;
}

const PROVIDERS: Readonly<Record<string, string>> = {
  'cantv': 'CANTV',
  'digitel': 'Digitel',
  'movistar': 'Movistar',
  'movilnet': 'Movilnet',
  'corpoelec': 'CORPOELEC',
  'banco-de-venezuela': 'Banco de Venezuela',
  'banesco': 'Banesco',
  'mercantil': 'Mercantil',
  'netflix': 'Netflix',
  'spotify': 'Spotify',
  'telegram': 'Telegram',
  'youtube': 'Google',
  'whatsapp': 'WhatsApp (Meta)',
  'instagram': 'Meta Platforms',
  'cloudflare': 'Cloudflare, Inc.',
  'amazon-web-services': 'Amazon Web Services',
  'google-cloud': 'Google',
  'microsoft-azure': 'Microsoft',
  'github': 'GitHub (Microsoft)',
  'vercel': 'Vercel',
  'gmail': 'Google',
  'outlook': 'Microsoft',
  'microsoft-365': 'Microsoft',
  'google-drive': 'Google',
  'microsoft-teams': 'Microsoft',
  'zoom': 'Zoom',
  'fortnite': 'Epic Games',
  'roblox': 'Roblox Corporation',
  'steam': 'Valve',
  'valorant': 'Riot Games',
  'minecraft': 'Mojang Studios (Microsoft)',
  'epic-games-store': 'Epic Games',
  'chatgpt': 'OpenAI',
  'google-gemini': 'Google',
  'claude': 'Anthropic',
  'discord': 'Discord',
  'reddit': 'Reddit',
  'twitch': 'Twitch',
  'linkedin': 'LinkedIn (Microsoft)',
  'playstation-network': 'Sony Interactive Entertainment',
  'amazon': 'Amazon',
  'paypal': 'PayPal',
  'shopify': 'Shopify',
  'stripe': 'Stripe',
  'aliexpress': 'Alibaba Group',
  'ebay': 'eBay',
  'signal': 'Signal Foundation',
  'wechat': 'Tencent',
  'line': 'LY Corporation',
  'bluesky': 'Bluesky Social',
  'mastodon': 'Mastodon',
  'tumblr': 'Automattic',
  'apple-music': 'Apple',
  'youtube-music': 'Google',
  'crunchyroll': 'Crunchyroll',
  'pluto-tv': 'Pluto TV',
  'soundcloud': 'SoundCloud',
  'deezer': 'Deezer',
  'dota-2': 'Valve',
  'overwatch-2': 'Blizzard Entertainment',
  'gta-online': 'Rockstar Games',
  'brawl-stars': 'Supercell',
  'among-us': 'Innersloth',
  'fastly': 'Fastly',
  'railway': 'Railway',
  'render': 'Render',
  'mongodb-atlas': 'MongoDB',
  'airbnb': 'Airbnb',
  'uber': 'Uber',
  'wise': 'Wise',
  'etsy': 'Etsy',
  'figma': 'Figma',
  'trello': 'Atlassian',
  'asana': 'Asana',
};

const TAGS: Readonly<Record<string, readonly string[]>> = {
  cloudflare: ['CDN', 'DNS', 'Seguridad web'],
  gmail: ['Correo electrónico', 'Productividad'],
  outlook: ['Correo electrónico', 'Calendario'],
  fortnite: ['Videojuego', 'Multijugador'],
  'amazon-web-services': ['Computación en la nube', 'Infraestructura'],
  'google-cloud': ['Computación en la nube', 'Infraestructura'],
  'microsoft-azure': ['Computación en la nube', 'Infraestructura'],
  github: ['Código', 'Colaboración'],
  vercel: ['Despliegue web', 'Hosting'],
  'microsoft-365': ['Productividad', 'Colaboración'],
  'google-drive': ['Archivos', 'Almacenamiento'],
  'microsoft-teams': ['Videollamadas', 'Colaboración'],
  steam: ['Tienda de videojuegos', 'PC'],
  discord: ['Comunidad', 'Mensajería'],
  whatsapp: ['Mensajería', 'Llamadas'],
  instagram: ['Red social', 'Contenido'],
  'google-gemini': ['Inteligencia artificial', 'Asistente'],
  chatgpt: ['Inteligencia artificial', 'Asistente'],
  claude: ['Inteligencia artificial', 'Asistente'],
  cantv: ['Internet fijo', 'Telefonía'],
  digitel: ['Telefonía móvil', 'Datos móviles'],
  movistar: ['Telefonía móvil', 'Datos móviles'],
  movilnet: ['Telefonía móvil', 'Datos móviles'],
};


/**
 * Verifiable editorial references for key services. These describe companies
 * and products, NEVER their current operational health.
 * Generic descriptions remain transparent when no dedicated source is present.
 */
const COMPANY_EDITORIAL: Readonly<Record<string, {
  overview: string;
  uses: readonly string[];
  source: string | null;
}>> = {
  aliexpress: {
    overview: 'AliExpress es una plataforma internacional de comercio electrónico del ecosistema Alibaba. Reúne vendedores y compradores en un catálogo de productos de distintas categorías; los problemas de acceso, búsqueda, pago y seguimiento de pedidos pueden afectar funciones diferentes.',
    uses: ['Explorar productos', 'Compras en línea', 'Gestión de pedidos', 'Seguimiento de envíos'],
    source: 'https://www.aliexpress.com/',
  },
  ebay: {
    overview: 'eBay es una plataforma de comercio electrónico que conecta compradores y vendedores. Ofrece anuncios de productos y distintos formatos de compra. La búsqueda, la publicación de anuncios, la cuenta y el pago son componentes que conviene evaluar por separado.',
    uses: ['Buscar artículos', 'Comprar y vender', 'Publicar anuncios', 'Gestionar pedidos'],
    source: 'https://www.ebayinc.com/company/',
  },
  minecraft: {
    overview: 'Minecraft es un videojuego de construcción y exploración desarrollado por Mojang Studios. Sus experiencias incluyen partidas individuales, multijugador y servidores; una incidencia de autenticación o de servidores no implica que el juego local deje de funcionar.',
    uses: ['Construcción y exploración', 'Partidas multijugador', 'Servidores y mundos', 'Acceso a cuentas'],
    source: 'https://www.minecraft.net/',
  },
  amazon: {
    overview: 'Amazon opera una plataforma de comercio electrónico con catálogo, cuentas, pedidos y servicios de entrega. Los problemas de acceso, búsqueda, compras y logística pueden tener alcance distinto según el país y el servicio.',
    uses: ['Compras en línea', 'Búsqueda de productos', 'Pedidos y entregas', 'Gestión de cuenta'],
    source: 'https://www.aboutamazon.com/',
  },
  tumblr: {
    overview: 'Tumblr es una plataforma de publicación y comunidades en la que los usuarios crean blogs y comparten contenido. Las incidencias pueden afectar el inicio de sesión, la publicación, las notificaciones o la visualización del contenido.',
    uses: ['Publicar entradas', 'Seguir blogs', 'Compartir contenido', 'Mensajes y comunidades'],
    source: 'https://www.tumblr.com/about',
  },
  'youtube-music': {
    overview: 'YouTube Music es un servicio de música y contenido de audio del ecosistema YouTube de Google. El acceso, la búsqueda, la reproducción y las listas pueden presentar problemas diferentes dependiendo del dispositivo y la conexión.',
    uses: ['Escuchar música', 'Buscar artistas y canciones', 'Crear listas', 'Reproducción en distintos dispositivos'],
    source: 'https://music.youtube.com/',
  },
  twitch: {
    overview: 'Twitch es una plataforma de transmisión de video en directo centrada en comunidades y creadores. Reúne contenido de videojuegos, música, deporte y otras actividades con chat interactivo. La reproducción de transmisiones, el acceso a canales, las notificaciones y el chat pueden presentar incidencias distintas.',
    uses: ['Ver transmisiones en directo', 'Emitir contenido propio', 'Participar en chats', 'Seguir canales y comunidades'],
    source: 'https://www.twitch.tv/p/es-es/company/',
  },
  reddit: {
    overview: 'Reddit es una plataforma de comunidades organizadas por temas en la que las personas publican enlaces, textos y contenido multimedia, comentan y votan. La navegación por comunidades, el inicio de sesión, la publicación y la carga de comentarios son componentes que pueden funcionar de forma diferente durante una incidencia.',
    uses: ['Leer comunidades temáticas', 'Crear publicaciones', 'Comentar y votar', 'Gestionar una cuenta'],
    source: 'https://about.reddit.com/',
  },
  linkedin: {
    overview: 'LinkedIn es una red profesional para establecer contactos, compartir información laboral y consultar oportunidades de empleo. La plataforma también reúne servicios para empresas, reclutamiento y aprendizaje. El acceso al perfil, la mensajería, el buscador de empleos y las páginas corporativas pueden fallar por separado.',
    uses: ['Perfil y red profesional', 'Oportunidades laborales', 'Mensajería profesional', 'Publicaciones de empresas'],
    source: 'https://about.linkedin.com/es-es',
  },
  'playstation-network': {
    overview: 'PlayStation Network permite utilizar una cuenta de PlayStation para acceder a servicios y funcionalidades conectadas, como juegos en línea, PlayStation Store y otros productos. Los incidentes pueden afectar el inicio de sesión, las funciones sociales, las compras o los juegos en red sin interrumpir necesariamente todas las actividades.',
    uses: ['Cuenta y autenticación', 'Juego en línea', 'PlayStation Store', 'Funciones sociales'],
    source: 'https://www.playstation.com/en-us/your-account-for-playstation/',
  },
  netflix: {
    overview: 'Netflix es un servicio de entretenimiento en línea que ofrece series, películas y juegos. El catálogo y las funciones pueden variar según la ubicación y el dispositivo. Un problema de reproducción, de inicio de sesión o de facturación no implica necesariamente que todo el servicio esté interrumpido.',
    uses: ['Reproducción de series y películas', 'Descubrimiento de contenidos', 'Perfiles y acceso', 'Aplicaciones para distintos dispositivos'],
    source: 'https://about.netflix.com/es',
  },
  spotify: {
    overview: 'Spotify es una plataforma de audio digital que ofrece música, podcasts y audiolibros en determinados mercados. Permite descubrir contenido, guardar bibliotecas y escuchar desde varias plataformas. Las incidencias en búsqueda, autenticación o reproducción deben distinguirse de problemas con la red local.',
    uses: ['Música en streaming', 'Podcasts y audiolibros', 'Bibliotecas y listas', 'Reproducción en dispositivos'],
    source: 'https://newsroom.spotify.com/company-info/',
  },
  telegram: {
    overview: 'Telegram es una aplicación de mensajería basada en la nube con sincronización entre dispositivos. Incluye chats privados, grupos, canales, archivos y bots. El envío de mensajes, las notificaciones y el acceso a una cuenta son funciones separadas que pueden presentar incidencias diferentes.',
    uses: ['Mensajes y archivos', 'Grupos y canales', 'Bots y aplicaciones', 'Sincronización entre dispositivos'],
    source: 'https://telegram.org/faq/es',
  },
  youtube: {
    overview: 'YouTube es una plataforma de videos y contenidos de creadores del ecosistema Google. Sus servicios incluyen búsqueda, reproducción, canales y transmisión en vivo. Una dificultad para subir videos no significa necesariamente que la reproducción o la navegación también estén afectadas.',
    uses: ['Ver videos', 'Publicar y gestionar canales', 'Transmisiones en vivo', 'Búsqueda y descubrimiento'],
    source: 'https://about.youtube/',
  },
  signal: {
    overview: 'Signal es una aplicación de mensajería privada mantenida por una organización independiente sin ánimo de lucro. Ofrece mensajes, grupos y llamadas con cifrado de extremo a extremo. Los incidentes de registro, envío de mensajes y llamadas pueden tener síntomas diferentes.',
    uses: ['Mensajes privados', 'Llamadas y videollamadas', 'Grupos', 'Uso en móvil y escritorio'],
    source: 'https://signal.org/es/',
  },
  cloudflare: {
    overview: 'Cloudflare es una empresa de infraestructura de Internet fundada en 2009, con sede en San Francisco. Su red global ofrece protección de aplicaciones, distribución de contenido, servicios DNS, acceso Zero Trust y herramientas para desarrollar y ejecutar aplicaciones. Una incidencia puede tener efectos distintos según los productos usados por cada sitio.',
    uses: ['Protección contra ataques DDoS', 'CDN y aceleración de sitios web', 'DNS y servicios de red', 'Plataforma para desarrolladores'],
    source: 'https://www.cloudflare.com/about/',
  },
  gmail: {
    overview: 'Gmail es el servicio de correo electrónico de Google para cuentas personales y organizaciones. Incluye búsqueda de mensajes, filtros contra correo no deseado e integración con el entorno de trabajo de Google. Una interrupción puede afectar el envío, recepción o acceso, sin que necesariamente fallen todas las funciones a la vez.',
    uses: ['Enviar y recibir mensajes', 'Gestionar bandejas de entrada', 'Integración con Google Workspace', 'Archivos adjuntos y búsqueda'],
    source: 'https://knowledge.workspace.google.com/admin/domains/about-gmail-business-email-and-domain-verified-google-workspace-accounts?hl=es',
  },
  outlook: {
    overview: 'Outlook es una familia de aplicaciones de Microsoft para correo electrónico, calendario, contactos y organización del trabajo. Se utiliza tanto con cuentas personales como en entornos empresariales de Microsoft 365. El correo y el calendario pueden mostrar incidencias diferentes, por lo que conviene distinguir el componente afectado.',
    uses: ['Correo y bandejas de entrada', 'Calendarios y reuniones', 'Contactos y agenda', 'Colaboración de Microsoft 365'],
    source: 'https://support.microsoft.com/es-es/outlook/calendar/introduction-to-the-outlook-calendar',
  },
  fortnite: {
    overview: 'Fortnite es un ecosistema de experiencias multijugador de Epic Games, compañía estadounidense fundada en 1991 y con sede en Cary, Carolina del Norte. Además de Battle Royale, incorpora experiencias y actividades creadas por otros desarrolladores. Problemas de inicio de sesión, emparejamiento y servidores de partidas pueden presentarse de forma independiente.',
    uses: ['Partidas multijugador', 'Experiencias creadas por la comunidad', 'Cuenta y acceso a Epic Games', 'Juego en varias plataformas'],
    source: 'https://www.epicgames.com/site/about?lang=es-ES',
  },
  'amazon-web-services': {
    overview: 'Amazon Web Services (AWS) es la plataforma de computación en la nube de Amazon, con servicios de servidores, almacenamiento, bases de datos, redes y análisis. Sus servicios se distribuyen por regiones; un problema localizado no implica una caída mundial de AWS.',
    uses: ['Servidores y computación', 'Bases de datos y almacenamiento', 'Redes, DNS y entrega de contenido', 'Aplicaciones empresariales'],
    source: null,
  },
  'microsoft-azure': {
    overview: 'Microsoft Azure agrupa servicios en la nube para alojar aplicaciones, procesar datos, usar redes, identidad y herramientas de inteligencia artificial. Su funcionamiento se organiza por servicios y regiones; los reportes de una función concreta no describen necesariamente el conjunto.',
    uses: ['Infraestructura en la nube', 'Datos y almacenamiento', 'Identidad y redes', 'Aplicaciones empresariales'],
    source: null,
  },
  'google-cloud': {
    overview: 'Google Cloud es el conjunto de productos de computación en la nube de Google: servidores, plataformas de datos, redes, alojamiento y servicios administrados para aplicaciones. El impacto de una incidencia depende del producto y la región afectados.',
    uses: ['Servidores y redes', 'Almacenamiento y bases de datos', 'Analítica e inteligencia artificial', 'Despliegues de aplicaciones'],
    source: null,
  },
  github: {
    overview: 'GitHub es una plataforma de alojamiento y colaboración sobre repositorios de código, propiedad de Microsoft. Reúne control de versiones Git, solicitudes de cambios, incidencias y flujos de automatización para equipos de desarrollo.',
    uses: ['Repositorios Git', 'Pull requests e Issues', 'GitHub Actions', 'Colaboración de equipos'],
    source: null,
  },
  whatsapp: {
    overview: 'WhatsApp es un servicio de mensajería y llamadas de Meta. Permite conversaciones individuales y de grupo y cuenta con aplicaciones web y móviles. El envío de mensajes, las llamadas y la vinculación entre dispositivos pueden presentar problemas diferentes.',
    uses: ['Mensajería', 'Llamadas y videollamadas', 'Grupos y comunidades', 'WhatsApp Web'],
    source: null,
  },
  instagram: {
    overview: 'Instagram es una red social de Meta centrada en fotografías, videos, historias y mensajes. La carga de contenido, la reproducción, la autenticación y los mensajes pueden experimentar incidentes por separado.',
    uses: ['Publicaciones y reels', 'Historias', 'Mensajes', 'Cuentas y acceso'],
    source: null,
  },
  'microsoft-365': {
    overview: 'Microsoft 365 reúne herramientas de correo, documentos, reuniones y colaboración. Incluye productos como Outlook, Teams y aplicaciones de Office; la disponibilidad puede variar por producto y tipo de cuenta.',
    uses: ['Correo y calendario', 'Documentos y archivos', 'Reuniones y colaboración', 'Gestión de identidades'],
    source: null,
  },
  steam: {
    overview: 'Steam es la plataforma de Valve para adquirir, instalar y actualizar videojuegos de PC, mantener bibliotecas y participar en comunidades. Una falla de tienda, descarga o inicio de sesión no siempre afecta a todos los juegos.',
    uses: ['Tienda de videojuegos', 'Descargas y actualizaciones', 'Biblioteca de juegos', 'Comunidad'],
    source: null,
  },
  'epic-games-store': {
    overview: 'Epic Games Store es la tienda y plataforma de distribución digital de Epic Games para videojuegos y aplicaciones. Sus componentes incluyen catálogo, compras, biblioteca, descarga y acceso a cuentas.',
    uses: ['Compra y descarga', 'Actualizaciones', 'Biblioteca de juegos', 'Autenticación'],
    source: null,
  },
  'google-drive': {
    overview: 'Google Drive permite almacenar, compartir y sincronizar archivos en la nube. Forma parte de los servicios de productividad de Google y se integra con herramientas de documentos colaborativos.',
    uses: ['Archivos en la nube', 'Compartir documentos', 'Sincronización', 'Trabajo colaborativo'],
    source: null,
  },
  'chatgpt': {
    overview: 'ChatGPT es una aplicación de inteligencia artificial de OpenAI para trabajar con texto y otras modalidades según las funciones disponibles. El acceso, las conversaciones, la carga de archivos y otras herramientas pueden funcionar de manera distinta durante una incidencia.',
    uses: ['Consultas y respuestas', 'Redacción y análisis', 'Trabajo con archivos', 'Funciones de IA disponibles'],
    source: null,
  },
  'discord': {
    overview: 'Discord es una plataforma de comunicación por texto y voz, utilizada por comunidades, grupos y equipos. Cuenta con servidores, canales, mensajes y llamadas; sus problemas pueden concentrarse en una sola función.',
    uses: ['Servidores y comunidades', 'Mensajes', 'Voz y video', 'Aplicación de escritorio y móvil'],
    source: null,
  },
  'paypal': {
    overview: 'PayPal ofrece servicios de pagos digitales para compradores y comerciantes. Las operaciones pueden depender de autenticación, procesamiento de pagos y comunicaciones bancarias que deben distinguirse al registrar incidencias.',
    uses: ['Pagos en línea', 'Cobros comerciales', 'Gestión de cuenta', 'Transacciones'],
    source: null,
  },
  'cantv': {
    overview: 'CANTV es un proveedor de telecomunicaciones en Venezuela vinculado a conectividad fija y telefonía. Las experiencias de usuarios pueden variar por localidad y tecnología de acceso; por eso los reportes se agrupan por región y tipo de problema.',
    uses: ['Internet fijo', 'Telefonía', 'Acceso residencial', 'Servicios de conectividad'],
    source: null,
  },
  'digitel': {
    overview: 'Digitel es una empresa de telecomunicaciones móviles en Venezuela. Sus clientes utilizan servicios de voz y datos, cuyas incidencias pueden estar relacionadas con cobertura, congestión, autenticación o acceso a Internet.',
    uses: ['Datos móviles', 'Telefonía móvil', 'Servicios de red', 'Conectividad en Venezuela'],
    source: null,
  },
  'movistar': {
    overview: 'Movistar opera servicios de telecomunicaciones en varios mercados, entre ellos Venezuela. La experiencia puede depender del acceso móvil o fijo y de la localidad. PulsoVE reúne reportes ciudadanos, no diagnósticos de red del operador.',
    uses: ['Datos móviles', 'Telefonía', 'Internet', 'Servicios de telecomunicaciones'],
    source: null,
  },
};

const CATEGORY_CONTEXT: Readonly<Record<string, string>> = {
  'telecomunicaciones': 'Los reportes pueden referirse a conectividad, latencia, voz o cobertura. Conviene revisar por región y operador antes de atribuir un incidente general.',
  'banca-y-pagos': 'Los problemas más útiles de distinguir son acceso a la cuenta, inicio de sesión, transferencias y pagos. Un reporte no acredita fallas en una transacción específica.',
  'servicios-publicos': 'La experiencia puede variar por localidad, tipo de suministro y portal usado. Los datos ciudadanos no sustituyen las comunicaciones del organismo.',
  'plataformas-digitales': 'Se pueden distinguir problemas de acceso, publicación, envío de contenido y notificaciones; una función aislada no implica caída completa.',
  'correo-y-productividad': 'Una incidencia puede afectar correo, archivos, sincronización o acceso sin interrumpir todos los productos relacionados.',
  'nube-e-infraestructura': 'Los servicios pueden operar por regiones y componentes. Una anomalía reportada no confirma interrupciones en toda la red del proveedor.',
  'videojuegos': 'Conviene separar inicio de sesión, partidas, emparejamiento, descarga y pagos: no siempre comparten la misma causa.',
  'streaming': 'Los problemas de reproducción pueden depender de la plataforma, del dispositivo o de la conexión local. PulsoVE no atribuye causas sin evidencia.',
  'inteligencia-artificial': 'Los usuarios pueden experimentar incidencias de acceso, respuestas, carga de archivos o límites de servicio; se registran como categorías separadas.',
  'comercio-global': 'Es útil distinguir catálogo, autenticación, carrito, pago y entrega; una falla en el proceso no indica necesariamente caída total.',
  'delivery-y-movilidad': 'La experiencia depende de ubicación, asignación y conectividad. Los reportes se interpretan con su contexto regional.',
  'apuestas-y-loterias': 'PulsoVE registra incidencias técnicas sin promover el servicio ni confirmar autorización legal de sus operaciones.',
};

export function getServiceProfile(input: {
  slug: string;
  name?: string;
  categorySlug?: string;
  categoryName: string;
  description: string | null | undefined;
}): ServiceProfile {
  const tags = [input.categoryName, ...(TAGS[input.slug] ?? [])];
  const editorial = COMPANY_EDITORIAL[input.slug];
  const description = input.description?.trim() || 'Descripción editorial pendiente de verificar para este servicio.';
  const name = input.name || input.slug.replace(/-/g, ' ');
  const provider = PROVIDERS[input.slug] ?? null;
  return {
    provider,
    type: input.categoryName,
    description,
    tags: [...new Set(tags)],
    companyOverview: editorial?.overview ?? (
      (provider ? `Sobre ${provider}: ` : 'Sobre este servicio: ') +
      `${name} figura en el catálogo de PulsoVE por su función: ${description} ` +
      'Reseña corporativa individual pendiente de verificación; esta ficha se ampliará con fuentes del proveedor.'
    ),
    mainUses: [...(editorial?.uses ?? [description])],
    monitoringContext: CATEGORY_CONTEXT[input.categorySlug ?? ''] ??
      'PulsoVE diferencia los reportes ciudadanos de las confirmaciones oficiales. Sin datos suficientes no se afirma disponibilidad.',
    sourceUrl: editorial?.source ?? null,
  };
}
