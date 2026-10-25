import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategories, getCategoryBySlug, getDirectoryServices } from '@/lib/queries/directory';
import { ViewToggleProvider } from '@/components/directory/ViewToggle';
import { ServiceGrid } from '@/components/directory/ServiceGrid';
import { GamblingNotice, GAMBLING_CATEGORY_SLUG, GAMBLING_META_DISCLAIMER } from '@/components/service/GamblingNotice';
import { pageMetadata } from '@/lib/seo/metadata';
import { ROUTE, categoryHref } from '@/lib/nav';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { EngineFreshnessNotice } from '@/components/ui/EngineFreshnessNotice';
import { getEngineFreshness } from '@/lib/queries/engine';

// Datos en vivo: se renderiza en cada petición (si no, `next build` la congela).
export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

// Una categoría sin servicios activos sería una página vacía: 404 (y fuera del sitemap).
async function loadCategory(slug: string) {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;
  const { services, total } = await getDirectoryServices({ category: category.slug });
  if (total === 0) return null;
  return { category, services, total };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadCategory(slug);
  if (!data) return { title: 'Categoría no encontrada' };
  const { category } = data;
  return pageMetadata({
    title: `${category.name}: estado de los servicios en Venezuela`,
    // La descripción de la categoría es propia y está en la semilla (no se inventa aquí).
    description: [
      category.description ?? category.name,
      category.slug === GAMBLING_CATEGORY_SLUG ? GAMBLING_META_DISCLAIMER : null,
      'Reportes ciudadanos y estado actual en Venezuela.',
    ]
      .filter(Boolean)
      .join(' '),
    path: categoryHref(category.slug),
  });
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await loadCategory(slug);
  if (!data) notFound();
  const { category, services, total } = data;
  const otherCategories = (await getCategories()).filter((c) => c.slug !== category.slug);

  const freshness = await getEngineFreshness();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <EngineFreshnessNotice freshness={freshness} />
      <Breadcrumbs
        crumbs={[
          { name: ROUTE.services.label, path: ROUTE.services.href },
          { name: category.name, path: categoryHref(category.slug) },
        ]}
      />

      <div className="mt-2 flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{category.name}</h1>
        <p className="shrink-0 font-mono text-sm text-ink-muted tabular-nums">
          {total} {total === 1 ? 'servicio' : 'servicios'}
        </p>
      </div>
      {category.description && <p className="mt-2 max-w-2xl text-ink-muted">{category.description}</p>}

      {services.some((s) => s.isDemo) && (
        <p className="mt-3 inline-block rounded border border-border px-2 py-0.5 text-xs text-ink-muted">
          Datos demostrativos
        </p>
      )}
      {category.slug === GAMBLING_CATEGORY_SLUG && <GamblingNotice subject="category" />}

      <div className="mt-8">
        <ViewToggleProvider>
          <ServiceGrid services={services} />
        </ViewToggleProvider>
      </div>

      <section className="mt-12 border-t border-border pt-6">
        <h2 className="font-display text-base font-semibold">Otras categorías</h2>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {otherCategories.map((c) => (
            <li key={c.slug}>
              <Link href={categoryHref(c.slug)} className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
