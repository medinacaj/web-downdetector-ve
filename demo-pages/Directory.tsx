'use client';

import { useEffect, useState } from 'react';
import { demoCatalog, demoCategories } from './data';
import { ServiceGrid } from '../src/components/directory/ServiceGrid';
import { ViewToggleProvider } from '../src/components/directory/ViewToggle';

type Filters = { q: string; category: string; status: string; sort: string };
const initial: Filters = { q: '', category: '', status: '', sort: 'alphabetical' };

export default function DemoDirectory() {
  const [filters, setFilters] = useState(initial);
  const [draft, setDraft] = useState(initial);
  useEffect(() => {
    function sync() {
      const search = new URLSearchParams(window.location.search);
      const next = { q: search.get('q') || '', category: search.get('category') || '', status: search.get('status') || '', sort: search.get('sort') || 'alphabetical' };
      setFilters(next); setDraft(next);
    }
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  const services = demoCatalog.filter(s => s.name.toLocaleLowerCase('es').includes(filters.q.trim().toLocaleLowerCase('es')) &&
    (!filters.category || s.categorySlug === filters.category) && (!filters.status || s.status === filters.status))
    .sort((a, b) => filters.sort === 'activity' ? b.reportsLast24h - a.reportsLast24h || a.name.localeCompare(b.name, 'es') : a.name.localeCompare(b.name, 'es'));
  const control = 'rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-pulse-500';
  return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <div className="flex items-baseline justify-between gap-4"><h1 className="font-display text-2xl font-semibold tracking-tight">Servicios</h1><p className="font-mono text-sm text-ink-muted tabular-nums">{services.length} servicios</p></div>
    <form className="mt-6 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]" onSubmit={event => {
      event.preventDefault(); setFilters(draft);
      const search = new URLSearchParams(draft);
      window.history.pushState(null, '', window.location.pathname + '?' + search.toString());
    }}>
      <label className="sr-only" htmlFor="q">Buscar</label>
      <input id="q" name="q" type="search" placeholder="Buscar un servicio…" className={control} value={draft.q} onChange={event => setDraft({ ...draft, q: event.target.value })} />
      <label className="sr-only" htmlFor="category">Categoría</label>
      <select id="category" name="category" className={control} value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })}>
        <option value="">Toda categoría</option>{demoCategories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </select>
      <label className="sr-only" htmlFor="status">Estado</label>
      <select id="status" name="status" className={control} value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}>
        <option value="">Todo estado</option><option value="insufficient_data">Sin datos suficientes</option><option value="normal">Normal</option><option value="possible_outage">Posible interrupción</option>
      </select>
      <label className="sr-only" htmlFor="sort">Ordenar</label>
      <select id="sort" name="sort" className={control} value={draft.sort} onChange={event => setDraft({ ...draft, sort: event.target.value })}>
        <option value="alphabetical">Alfabético</option><option value="activity">Por actividad</option><option value="stability">Por estabilidad</option>
      </select>
      <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Filtrar</button>
    </form>
    <div className="mt-8"><ViewToggleProvider><ServiceGrid services={services} /></ViewToggleProvider></div>
  </div>;
}
