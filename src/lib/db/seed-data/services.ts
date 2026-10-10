/**
 * Servicios semilla (brief, sección 4.2) — lista inicial configurable, NO
 * definitiva. `officialUrl` se deja SIEMPRE null: el brief prohíbe
 * explícitamente inventar URLs oficiales (secciones 4.2 y 28), y aunque
 * varias son de dominio público bien conocido, este seed no es el lugar
 * para afirmarlas como verificadas — services.ts (schema) ya documenta la
 * convención: null = "pendiente de verificación". Verificar y cargar antes
 * de cualquier despliegue con datos reales (sección 4.2, último párrafo).
 *
 * `isDemo: true` en todas las filas: son registros de demostración para
 * que la plataforma tenga contenido navegable, no una afirmación
 * operativa sobre estas empresas. El frontend (Etapa 4) renderiza la
 * insignia "Datos demostrativos" en cualquier tarjeta/página donde
 * is_demo = true.
 *
 * `cashea` se agregó fuera de la lista original de la sección 4.2, a
 * pedido explícito — es la fintech BNPL ("compra ahora, paga después")
 * más grande de Venezuela, verificado por búsqueda antes de describirla,
 * no asumido. La propia sección 4.2 anticipa esto: "Estos servicios son
 * datos iniciales configurables, no una lista definitiva."
 */
export const servicesSeed = [
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
    slug: 'cashea',
    name: 'Cashea',
    categorySlug: 'banca-y-pagos',
    description: 'Compras a crédito en cuotas (modalidad "compra ahora, paga después"), usada en comercios físicos y en línea.',
  },
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
] as const;
