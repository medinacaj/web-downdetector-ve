/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // bcryptjs usa un binding que no debe quedar en el bundle de Server
  // Components. En Next 16 esta opción vive en la raíz, ya no bajo
  // `experimental` (cambió al subir de la 14.2 a la 16.3 en la Etapa 1).
  serverExternalPackages: ['bcryptjs'],
  // Panel privado: además del <meta robots> de src/app/admin/layout.tsx, la cabecera
  // cubre también respuestas que no son HTML. No se lista en robots.txt (no exponer
  // rutas administrativas); la protección real es la sesión.
  async headers() {
    return [{ source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
  // La clave `eslint` en next.config ya no es válida en Next 16 (ver aviso
  // del propio `next dev`). No hay eslint.config.js en el proyecto todavía
  // — pendiente real, no resuelto aquí (ver docs/00-PLAN-MAESTRO.md).
};

export default nextConfig;
