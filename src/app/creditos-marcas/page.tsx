import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Créditos de logotipos y marcas',
  description: 'Procedencia de los logotipos de servicios mostrados en PulsoVE.',
  robots: { index: false, follow: true },
};

const SOURCES = [
  { name: 'CANTV', url: 'https://commons.wikimedia.org/wiki/File:CANTV_logo.svg', provider: 'Wikimedia Commons' },
  { name: 'Movistar', url: 'https://commons.wikimedia.org/wiki/File:Movistar_2020_logo.svg', provider: 'Wikimedia Commons' },
  { name: 'Digitel', url: 'https://commons.wikimedia.org/wiki/File:Digitel_(2014).svg', provider: 'Wikimedia Commons' },
  { name: 'Movilnet', url: 'https://commons.wikimedia.org/wiki/File:Movilnet-logo_0.png', provider: 'Wikimedia Commons' },
  { name: 'Corpoelec', url: 'https://commons.wikimedia.org/wiki/File:Logo_CORPOELEC_(Venezuela).jpg', provider: 'Wikimedia Commons' },
  { name: 'Banco de Venezuela', url: 'https://commons.wikimedia.org/wiki/File:Bdv2022logo.png', provider: 'Wikimedia Commons' },
  { name: 'Banesco', url: 'https://commons.wikimedia.org/wiki/File:Banesco_Nuevo_Logo.svg', provider: 'Wikimedia Commons', license: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  { name: 'WhatsApp', url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/whatsapp.svg', provider: 'Simple Icons' },
  { name: 'Instagram', url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/instagram.svg', provider: 'Simple Icons' },
  { name: "Cloudflare", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/cloudflare.svg', provider: 'Simple Icons' },
  { name: "Gmail", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/gmail.svg', provider: 'Simple Icons' },
  { name: "Fortnite", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/fortnite.svg', provider: 'Simple Icons' },
  { name: "Discord", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/discord.svg', provider: 'Simple Icons' },
  { name: "GitHub", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/github.svg', provider: 'Simple Icons' },
  { name: "Google Cloud", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/googlecloud.svg', provider: 'Simple Icons' },
  { name: "Vercel", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/vercel.svg', provider: 'Simple Icons' },
  { name: "Epic Games Store", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/epicgames.svg', provider: 'Simple Icons' },
  { name: "Steam", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/steam.svg', provider: 'Simple Icons' },
  { name: "Roblox", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/roblox.svg', provider: 'Simple Icons' },
  { name: "VALORANT", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/valorant.svg', provider: 'Simple Icons' },
  { name: "Google Gemini", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/googlegemini.svg', provider: 'Simple Icons' },
  { name: "PayPal", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/paypal.svg', provider: 'Simple Icons' },
  { name: "Shopify", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/shopify.svg', provider: 'Simple Icons' },
  { name: "Stripe", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/stripe.svg', provider: 'Simple Icons' },
  { name: "Reddit", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/reddit.svg', provider: 'Simple Icons' },
  { name: "Twitch", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/twitch.svg', provider: 'Simple Icons' },
  { name: "Claude", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/claude.svg', provider: 'Simple Icons' },
  { name: "Zoom", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/zoom.svg', provider: 'Simple Icons' },
  { name: "Google Drive", url: 'https://github.com/simple-icons/simple-icons/blob/develop/icons/googledrive.svg', provider: 'Simple Icons' },
] as const;

export default function CreditsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-pulse-600">Transparencia editorial</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Créditos de marcas y logotipos</h1>
      <p className="mt-4 text-sm text-ink-muted">
        Las imágenes identifican los servicios que reciben reportes en PulsoVE.
        Las marcas son propiedad de sus titulares y no representan patrocinio,
        colaboración, validación de fallas ni respaldo de esos proveedores.
        Los archivos se alojan localmente para no compartir consultas de nuestros
        visitantes con proveedores externos de imágenes.
      </p>
      <ul className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface px-5">
        {SOURCES.map((item) => (
          <li key={item.name} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <span className="font-medium">{item.name}</span>
            <span className="text-sm">
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="text-brand-600 underline underline-offset-2 hover:text-brand-700">
                Archivo y derechos · {item.provider}
              </a>
              {'license' in item && (
                <span className="block text-xs text-ink-muted">
                  Obra atribuida a Banesco: conversión de formato a PNG sin redibujar la marca.
                  {' '}
                  <a href={item.license} target="_blank" rel="noopener noreferrer" className="underline">
                    Licencia CC BY-SA 3.0
                  </a>
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-ink-muted">
        Si un logo falta o no está verificado, se utiliza un identificador tipográfico.
        Para solicitar una actualización o retirar un archivo, consulta el repositorio del proyecto.
      </p>
      <Link href="/" className="mt-8 inline-block text-sm font-medium text-brand-600 underline underline-offset-4">
        Volver al inicio
      </Link>
    </main>
  );
}
