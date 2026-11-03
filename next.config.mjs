/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      // No limita scripts/frames hijos: Next, el tema y Turnstile mantienen su funcionamiento.
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
    ] }];
  },
  // bcryptjs usa un binding que no debe quedar en el bundle de Server
  // Components. En Next 16 esta opción vive en la raíz, ya no bajo
  // `experimental` (cambió al subir de la 14.2 a la 16.3 en la Etapa 1).
  serverExternalPackages: ['bcryptjs'],
  // ESLint se ejecuta desde eslint.config.mjs, separado del build de Next.
};

export default nextConfig;
