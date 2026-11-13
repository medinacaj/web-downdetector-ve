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
      'Aún no disponemos de una reseña corporativa individual contrastada; esta ficha se ampliará con fuentes del proveedor.'
    ),
    mainUses: [...(editorial?.uses ?? [description])],
    monitoringContext: CATEGORY_CONTEXT[input.categorySlug ?? ''] ??
      'PulsoVE diferencia los reportes ciudadanos de las confirmaciones oficiales. Sin datos suficientes no se afirma disponibilidad.',
    sourceUrl: editorial?.source ?? null,
  };
}
