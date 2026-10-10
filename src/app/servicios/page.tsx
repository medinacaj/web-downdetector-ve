import type { Metadata } from 'next';
import { getDirectoryServices, getCategories, type DirectorySort } from '@/lib/queries/directory';
import { ViewToggleProvider } from '@/components/directory/ViewToggle';
import { ServiceGrid } from '@/components/directory/ServiceGrid';
import type { OperationalStatus } from '@/lib/engine/status-bands';

export const metadata: Metadata = {
  title: 'Servicios',
  description: 'Directorio de servicios monitoreados en Venezuela: telecomunicaciones, banca, servicios públicos, plataformas, streaming, videojuegos, delivery y loterías.',
};

const STATUS_OPTIONS: { value: OperationalStatus; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'possible_outage', label: 'Posible interrupción' },
  { value: 'outage_detected', label: 'Interrupción detectada' },
  { value: 'outage_high_confidence', label: 'Interrupción de alta confianza' },
  { value: 'insufficient_data', label: 'Sin datos suficientes' },
];

const SORT_OPTIONS: { value: DirectorySort; label: string }[] = [
  { value: 'alphabetical', label: 'Alfabético' },
  { value: 'activity', label: 'Por actividad' },
  { value: 'stability', label: 'Por estabilidad' },
];

export default async function ServicesDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const validStatus = STATUS_OPTIONS.find((o) => o.value === params.status)?.value;
  const validSort = SORT_OPTIONS.find((o) => o.value === params.sort)?.value;

  const [{ services, total }, categoryList] = await Promise.all([
    getDirectoryServices({ q: params.q, category: params.category, status: validStatus, sort: validSort }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Servicios</h1>
        <p className="font-mono text-sm text-ink-muted tabular-nums">{total} servicios</p>
      </div>

      <form className="mt-6 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]" action="/servicios">
        <label className="sr-only" htmlFor="q">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={params.q}
          placeholder="Buscar un servicio…"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-pulse-500"
        />

        <label className="sr-only" htmlFor="category">
          Categoría
        </label>
        <select
          id="category"
          name="category"
          defaultValue={params.category ?? ''}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-pulse-500"
        >
          <option value="">Toda categoría</option>
          {categoryList.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="status">
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={validStatus ?? ''}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-pulse-500"
        >
          <option value="">Todo estado</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="sort">
          Ordenar
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={validSort ?? 'alphabetical'}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-pulse-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Filtrar
        </button>
      </form>

      <div className="mt-8">
        <ViewToggleProvider>
          <ServiceGrid services={services} />
        </ViewToggleProvider>
      </div>
    </div>
  );
}
