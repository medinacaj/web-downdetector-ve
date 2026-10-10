/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // bcryptjs usa un binding que no debe quedar en el bundle de Server
  // Components. En Next 16 esta opción vive en la raíz, ya no bajo
  // `experimental` (cambió al subir de la 14.2 a la 16.3 en la Etapa 1).
  serverExternalPackages: ['bcryptjs'],
  // La clave `eslint` en next.config ya no es válida en Next 16 (ver aviso
  // del propio `next dev`). No hay eslint.config.js en el proyecto todavía
  // — pendiente real, no resuelto aquí (ver docs/00-PLAN-MAESTRO.md).
};

export default nextConfig;
