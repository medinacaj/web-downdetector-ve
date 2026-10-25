import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, type Crumb } from '@/lib/seo/json-ld';
import { getSiteConfig } from '@/lib/seo/site';

/**
 * Miga de pan visible y su BreadcrumbList, desde la misma lista: así los datos
 * estructurados nunca dicen algo distinto de lo que se ve. El último elemento es
 * la página actual (sin enlace).
 */
export function Breadcrumbs({ crumbs }: { crumbs: readonly Crumb[] }) {
  return (
    <>
      <nav aria-label="Ruta" className="text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-x-1.5">
          {crumbs.map((c, i) => (
            <li key={c.path} className="flex items-center gap-x-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i < crumbs.length - 1 ? (
                <Link href={c.path} className="underline-offset-4 hover:text-ink hover:underline">
                  {c.name}
                </Link>
              ) : (
                <span aria-current="page">{c.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(getSiteConfig().origin, crumbs)} />
    </>
  );
}
