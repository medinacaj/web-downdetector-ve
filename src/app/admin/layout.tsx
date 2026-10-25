import type { Metadata } from 'next';

// Panel privado: fuera de buscadores (aquí y con la cabecera X-Robots-Tag de
// next.config.mjs), fuera del sitemap y nunca listado en robots.txt (regla del proyecto:
// no exponer rutas administrativas). La protección real es la sesión (src/lib/auth/dal.ts).
export const metadata: Metadata = {
  title: { default: 'Administración', template: '%s · Administración | PulsoVE' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">{children}</div>;
}
