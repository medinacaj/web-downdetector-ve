/**
 * Categorías de nivel superior. Las cuatro primeras vienen del brief
 * (sección 4.1); las otras cuatro (streaming, videojuegos, delivery y
 * movilidad, apuestas y loterías) se añadieron después, a pedido de la
 * persona propietaria — ver docs/CATALOGO-SERVICIOS.md (criterio, fuentes).
 *
 * Deliberadamente planas (sin jerarquía padre/hijo): las distinciones más
 * finas ("Internet fijo" vs. "Datos móviles", etc.) se resuelven a nivel de
 * servicio individual (description) e issue_types, no como subcategorías —
 * evita duplicar "Otro" por cada nivel y mantiene el admin panel simple.
 *
 * `icon` guarda nombres de ícono con la convención de lucide. Hoy `lucide-react`
 * NO es dependencia del proyecto y ninguna pantalla dibuja el ícono de la
 * categoría: el valor solo se devuelve como dato (p. ej. en /api/services).
 * Si se añade un mapa de íconos en la UI, estos son los nombres a resolver.
 *
 * `db:seed` sincroniza estas filas con upsert (nombre, descripción, ícono y
 * orden); el `slug` es la clave y NO debe cambiarse sin una redirección.
 */
export const categoriesSeed = [
  {
    slug: 'telecomunicaciones',
    name: 'Telecomunicaciones',
    description: 'Internet fijo, fibra, inalámbrico, datos móviles, telefonía y TV por suscripción.',
    icon: 'radio-tower',
    sortOrder: 1,
  },
  {
    slug: 'banca-y-pagos',
    name: 'Banca y pagos',
    description:
      'Bancos, aplicaciones bancarias, pago móvil, transferencias, billeteras digitales y plataformas de pago.',
    icon: 'landmark',
    sortOrder: 2,
  },
  {
    slug: 'servicios-publicos',
    name: 'Servicios públicos',
    description: 'Electricidad, agua, portales públicos, sistemas de trámites y plataformas gubernamentales.',
    icon: 'zap',
    sortOrder: 3,
  },
  {
    slug: 'plataformas-digitales',
    name: 'Plataformas digitales',
    description:
      'Mensajería, redes sociales, correo y aplicaciones de uso masivo, incluido el comercio electrónico.',
    icon: 'smartphone',
    sortOrder: 4,
  },
  {
    slug: 'streaming',
    name: 'Streaming',
    description: 'Video y música bajo demanda: plataformas por suscripción y de acceso gratuito.',
    icon: 'tv',
    sortOrder: 5,
  },
  {
    slug: 'videojuegos',
    name: 'Videojuegos',
    description: 'Juegos con partidas en línea, tiendas y redes de consolas y PC.',
    icon: 'gamepad-2',
    sortOrder: 6,
  },
  {
    slug: 'delivery-y-movilidad',
    name: 'Delivery y movilidad',
    description: 'Pedidos a domicilio y transporte privado por aplicación.',
    icon: 'bike',
    sortOrder: 7,
  },
  {
    slug: 'apuestas-y-loterias',
    name: 'Apuestas y loterías',
    description:
      'Loterías y casas de apuestas en línea. PulsoVE solo informa disponibilidad técnica: no las promueve ni confirma que estén autorizadas.',
    icon: 'dices',
    sortOrder: 8,
  },
  // Global services requested for international coverage (Nov 2026).
  { slug: "correo-y-productividad", name: "Correo y productividad", description: "Correo electrónico, colaboración, reuniones y almacenamiento de archivos.", icon: "mail", sortOrder: 9 },
  { slug: "nube-e-infraestructura", name: "Nube e infraestructura", description: "CDN, DNS, hosting, servidores, repositorios de código y herramientas de desarrollo.", icon: "cloud", sortOrder: 10 },
  { slug: "inteligencia-artificial", name: "Inteligencia artificial", description: "Servicios y asistentes de inteligencia artificial accesibles en línea.", icon: "brain-circuit", sortOrder: 11 },
  { slug: "comercio-global", name: "Comercio global", description: "Mercados, tiendas y plataformas internacionales de comercio y pagos.", icon: "shopping-bag", sortOrder: 12 },

  // New editorial groupings for the requested Chilean, Venezuelan and global catalog.
  { slug: "viajes-y-turismo", name: "Viajes y turismo", description: "Reservas, aerolíneas, transporte interurbano y servicios digitales de viajes.", icon: "plane", sortOrder: 13 },
  { slug: "salud-y-farmacias", name: "Salud y farmacias", description: "Farmacias, bienestar, actividad física y servicios digitales de salud.", icon: "heart-pulse", sortOrder: 14 },
  { slug: "logistica-y-envios", name: "Logística y envíos", description: "Operadores postales, encomiendas y seguimiento de envíos.", icon: "package", sortOrder: 15 },
  { slug: "seguridad-y-privacidad", name: "Seguridad y privacidad", description: "VPN, antivirus, identidad digital, autenticación y ciberseguridad.", icon: "shield-check", sortOrder: 16 },
  { slug: "educacion-y-contenidos", name: "Educación y contenidos", description: "Cursos, aulas virtuales y herramientas educativas.", icon: "graduation-cap", sortOrder: 17 },
  { slug: "clima-y-datos", name: "Clima y datos", description: "Pronósticos meteorológicos y plataformas de datos en línea.", icon: "cloud-sun", sortOrder: 18 },
] as const;
