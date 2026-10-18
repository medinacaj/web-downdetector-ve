import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getSiteConfig } from '@/lib/seo/site';
import { SITE_NAME } from '@/lib/seo/metadata';
import './globals.css';

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

const site = getSiteConfig();

export const metadata: Metadata = {
  metadataBase: new URL(site.origin),
  // Política de indexación: ver src/lib/seo/site.ts (hoy noindex global, opción A).
  robots: site.indexable ? { index: true, follow: true } : { index: false, follow: true },
  title: {
    default: `${SITE_NAME} — Estado de servicios en Venezuela`,
    template: `%s | ${SITE_NAME}`,
  },
  applicationName: SITE_NAME,
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
    // suppressHydrationWarning: THEME_INIT_SCRIPT añade `dark` a <html> antes de hidratar, así que
    // su className difiere a propósito del HTML del servidor. Solo afecta a los atributos de <html>.
    <html lang="es" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col font-body antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
