/**
 * Categorías de nivel superior (brief, sección 4.1). Deliberadamente planas
 * (sin jerarquía padre/hijo): las distinciones más finas de esa sección
 * ("Internet fijo" vs. "Datos móviles", etc.) se resuelven a nivel de
 * servicio individual (description) e issue_types, no como subcategorías —
 * evita duplicar "Otro" por cada nivel y mantiene el admin panel simple.
 *
 * `icon` referencia nombres de lucide-react (^0.383.0, ya disponible en el
 * stack de artifacts/frontend) para que el componente de ícono del Etapa 4
 * pueda hacer icons[category.icon] directamente sin tabla de mapeo aparte.
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
    description: 'Aplicaciones bancarias, banca en línea, pago móvil, transferencias y puntos de venta.',
    icon: 'landmark',
    sortOrder: 2,
  },
  {
    slug: 'servicios-publicos',
    name: 'Servicios públicos',
    description: 'Electricidad, portales públicos, sistemas de trámites y plataformas gubernamentales.',
    icon: 'zap',
    sortOrder: 3,
  },
  {
    slug: 'plataformas-digitales',
    name: 'Plataformas digitales',
    description: 'Mensajería, redes sociales, correo, streaming y aplicaciones de uso masivo.',
    icon: 'smartphone',
    sortOrder: 4,
  },
] as const;
