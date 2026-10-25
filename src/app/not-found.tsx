import Link from 'next/link';
import { ROUTE } from '@/lib/nav';

// 404 propia: responde con código 404 (Next añade además `noindex`) y ofrece
// salidas útiles en vez de una página sin navegación. No consulta la base: debe
// funcionar aunque falle.
//
// Limitación conocida (Next 16.3, verificada con `next build`): para una URL que no
// existe sale renderizada en el HTML; para un servicio inexistente (notFound() en
// una página dinámica) Next responde 404 con un documento de error que la pinta en el
// cliente. El código 404 y el noindex son correctos en ambos casos.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <p className="font-mono text-sm text-ink-muted">Error 404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        No encontramos esta página
      </h1>
      <p className="mt-3 text-ink-muted">
        Puede que la dirección esté mal escrita o que el servicio ya no se monitoree. Busca el servicio en el
        directorio.
      </p>

      <form action={ROUTE.services.href} className="mx-auto mt-7 flex max-w-sm gap-2">
        <label htmlFor="not-found-search" className="sr-only">
          Buscar un servicio
        </label>
        <input
          id="not-found-search"
          name="q"
          type="search"
          placeholder="CANTV, Banesco, WhatsApp…"
          className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-pulse-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Buscar
        </button>
      </form>

      <div className="mt-6 flex justify-center gap-6 text-sm">
        <Link href={ROUTE.home.href} className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
          Ir al inicio
        </Link>
        <Link href={ROUTE.services.href} className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
          Ver todos los servicios
        </Link>
      </div>
    </div>
  );
}
