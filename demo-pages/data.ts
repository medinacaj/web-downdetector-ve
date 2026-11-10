// Fixtures públicas, deterministas y sin conexiones de base de datos.
import { servicesSeed } from '../src/lib/db/seed-data/services';
import { categoriesSeed } from '../src/lib/db/seed-data/categories';
import { statesSeed } from '../src/lib/db/seed-data/states';
import { issueTypesSeed } from '../src/lib/db/seed-data/issue-types';
import type { OperationalStatus } from '../src/lib/engine/status-bands';

export type DirectorySort = 'activity' | 'alphabetical' | 'stability';
export interface DirectoryService {
  slug: string;
  name: string;
  description: string | null;
  categorySlug: string;
  categoryName: string;
  reportsLast24h: number;
  incidentsAllTime: number;
  status: OperationalStatus;
}
export const demoDate = new Date('2026-11-10T12:00:00Z');
export const demoCategories = categoriesSeed.map(c => ({ slug: c.slug, name: c.name }));
export const demoStates = statesSeed.map(s => ({ ...s, count: s.code === 'VE-D' ? 72 : s.code === 'VE-M' ? 48 : s.code === 'VE-A' ? 17 : 0 }));
export const demoCatalog: DirectoryService[] = [...servicesSeed, {
  slug: 'servicio-demo', name: 'Servicio de Demostración', categorySlug: 'telecomunicaciones',
  description: 'Servicio ficticio para mostrar actividad de ejemplo. No representa a un proveedor real.',
}].map(s => ({ ...s, categoryName: categoriesSeed.find(c => c.slug === s.categorySlug)!.name,
  reportsLast24h: s.slug === 'servicio-demo' ? 72 : 0, incidentsAllTime: 0,
  status: 'insufficient_data',
}));

export async function getHomeData() {
  return {
    services: demoCatalog,
    mostActive: [...demoCatalog].sort((a, b) => b.reportsLast24h - a.reportsLast24h).slice(0, 6),
    hasAnyActivity: true,
    totals: { reportsAllTime: 137, reportsLast24h: 72, incidentsOpen: 0, incidentsAllTime: 0, servicesCount: demoCatalog.length },
    activeIncidents: [] as { id: string; status: string; startedAt: Date; serviceName: string; serviceSlug: string }[],
    generatedAt: demoDate,
  };
}

export async function getServiceDetailData(slug: string) {
  const item = demoCatalog.find(s => s.slug === slug);
  if (!item) return null;
  const category = categoriesSeed.find(c => c.slug === item.categorySlug)!;
  const fictional = slug === 'servicio-demo';
  return {
    service: { ...item, id: item.slug, active: true, isDemo: true, officialUrl: null,
      category: { ...category, id: category.slug } },
    statusDetail: { status: item.status, confidence: null, lastUpdated: demoDate, officiallyConfirmed: false },
    issueTypeOptions: issueTypesSeed.filter(it => !it.categorySlug || it.categorySlug === item.categorySlug),
    issueBreakdown: fictional ? [{ name: 'Sin conexión (ejemplo)', count: 90 }, { name: 'Lentitud (ejemplo)', count: 47 }] : [],
    recentIncidents: [] as { id: string; status: string; startedAt: Date; endedAt: Date | null; confidence: number }[],
    affectedStates: fictional ? demoStates.filter(s => s.count > 0).map(s => ({ name: s.name, code: s.code, reports: s.count })) : [],
    allStates: demoStates.map(s => ({ code: s.code, name: s.name })),
  };
}
