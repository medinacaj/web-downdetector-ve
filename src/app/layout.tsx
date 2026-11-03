import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';
import { siteUrl, indexable } from '@/lib/seo';

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});
const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: siteUrl() ?? undefined,
  robots: { index: indexable(), follow: indexable() },
  alternates: siteUrl() ? { canonical: '/' } : undefined,
  openGraph: { type: 'website', locale: 'es_VE', siteName: 'PulsoVE', title: 'PulsoVE — Estado de servicios en Venezuela', description: 'Observación ciudadana de disponibilidad de servicios en Venezuela. Datos insuficientes no equivalen a normalidad.' },
  title: {
    default: 'PulsoVE — Estado de servicios en Venezuela',
    template: '%s | PulsoVE',
  },
  description:
    'Consulta si un servicio presenta problemas en Venezuela: internet, bancos, servicios públicos, redes, streaming, juegos y delivery. Monitoreo ciudadano.',
};

// Aplica el tema guardado ANTES de que React hidrate, para no parpadear
// entre claro/oscuro (brief sección 6.2: modo oscuro completo).
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem('pulsove-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col font-body antialiased">
        <a href="#contenido-principal" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:p-3 focus:text-ink">Saltar al contenido principal</a>
        <Header />
        <main id="contenido-principal" tabIndex={-1} className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
