'use client';

import Link from 'next/link';
import { useView } from './ViewToggle';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { DirectoryService } from '@/lib/queries/directory';

export function ServiceGrid({ services }: { services: DirectoryService[] }) {
  const view = useView();

  if (services.length === 0) {
    return (
      <p className="rounded-lg border border-border p-8 text-center text-sm text-ink-muted">
        Ningún servicio coincide con estos filtros.
      </p>
    );
  }

  if (view === 'list') {
    return (
      <ul className="divide-y divide-border rounded-lg border border-border">
        {services.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/servicios/${s.slug}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="text-xs text-ink-muted">{s.categoryName}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-xs text-ink-muted tabular-nums">
                  {s.reportsLast24h} rep. (24h)
                </span>
                <StatusBadge status={s.status} size="sm" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => (
        <li key={s.slug}>
          <Link
            href={`/servicios/${s.slug}`}
            className="flex h-full flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:border-brand-400"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-ink-muted">{s.categoryName}</p>
              </div>
              <StatusBadge status={s.status} size="sm" />
            </div>
            {s.description && <p className="line-clamp-2 text-sm text-ink-muted">{s.description}</p>}
            <p className="mt-auto font-mono text-xs text-ink-muted tabular-nums">
              {s.reportsLast24h} reportes (24h)
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
