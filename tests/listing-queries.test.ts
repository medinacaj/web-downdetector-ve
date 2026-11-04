import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '@/lib/db/schema';
import { getDirectoryServices } from '@/lib/queries/directory';
import { getHomeData } from '@/lib/queries/home';
import { getServiceStatusDetail } from '@/lib/queries/status';

// Sustituye solo la conexión: SQL, agregaciones y mapeo de producción son reales.
const harness = vi.hoisted(() => ({
  db: undefined as unknown as import('@/lib/db/client').Database,
  queries: [] as string[],
}));
vi.mock('@/lib/db/client', () => ({ get db() { return harness.db; } }));
const { validateSourceURL } = createRequire(import.meta.url)('../scripts/smoke-migrations.cjs');
let admin: ReturnType<typeof postgres>;
let client: ReturnType<typeof postgres>;
let created = false;
const target = `pulsove_listing_${randomBytes(6).toString('hex')}_test`;
const ids: Record<string, string> = {};

beforeAll(async () => {
  const source = validateSourceURL(process.env.DATABASE_URL || 'http://invalid') as URL;
  const adminURL = new URL(source); adminURL.pathname = '/postgres';
  const fixtureURL = new URL(source); fixtureURL.pathname = '/' + target;
  admin = postgres(adminURL.href, { max: 1, onnotice: () => {} });
  await admin`create database ${admin(target)}`;
  created = true;
  client = postgres(fixtureURL.href, { max: 5, onnotice: () => {} });
  harness.db = drizzle(client, { schema, logger: { logQuery(query) { harness.queries.push(query); } } });
  await migrate(harness.db, { migrationsFolder: 'drizzle' });
  await client`insert into categories(slug,name) values ('fixture-a','A'),('fixture-b','B')`;
  const rows = await client`insert into services(slug,name,category_id,active)
    select 'fixture-' || lpad(g::text,3,'0'), 'Servicio ' || lpad(g::text,3,'0'),
      (select id from categories where slug=case when g<=35 then 'fixture-a' else 'fixture-b' end),g<=71
    from generate_series(1,72) g returning id,slug`;
  for (const row of rows) ids[row.slug] = row.id;
  const state = (await client`insert into states(code,name,grid_row,grid_col) values ('VE-M','Fixture',0,0) returning id`)[0].id;
  const issue = (await client`insert into issue_types(slug,name) values ('fixture','Fixture') returning id`)[0].id;
  for (const slug of ['fixture-001', 'fixture-001', 'fixture-002', 'fixture-072']) {
    await client`insert into reports(service_id,issue_type_id,state_id,anonymous_hash,ip_prefix_hash)
      values (${ids[slug]},${issue},${state},'fixture','fixture')`;
  }
  await client`insert into reports(service_id,issue_type_id,state_id,anonymous_hash,ip_prefix_hash,created_at)
    values (${ids['fixture-001']},${issue},${state},'fixture','fixture',now()-interval '48 hours')`;
  const statuses = ['possible', 'detected', 'high_confidence', 'confirmed', 'recovering', 'resolved'];
  for (let i = 0; i < statuses.length; i++) {
    await client`insert into incidents(service_id,status,started_at)
      values (${ids[`fixture-00${i + 1}`]},${statuses[i]},now()-interval '2 hours')`;
  }
  await client`insert into incidents(service_id,status,started_at) values
    (${ids['fixture-001']},'resolved',now()-interval '1 hour'),
    (${ids['fixture-007']},'possible',now()-interval '3 hours'),
    (${ids['fixture-007']},'confirmed',now()-interval '1 hour')`;
  // Empate temporal: ID descendente como criterio estable, también en detalle.
  await client`insert into incidents(id,service_id,status,started_at) values
    ('00000000-0000-0000-0000-000000000001',${ids['fixture-008']},'possible','2026-01-01'),
    ('00000000-0000-0000-0000-000000000002',${ids['fixture-008']},'confirmed','2026-01-01')`;
}, 15000);

afterAll(async () => {
  try { if (client) await client.end({ timeout: 2 }); }
  finally {
    try { if (created) await admin`drop database ${admin(target)} with(force)`; }
    finally { if (admin) await admin.end(); }
  }
});
beforeEach(() => { harness.queries = []; });

describe('listados con PostgreSQL real y presupuesto de consultas', () => {
  it('directorio de 71 servicios usa como máximo dos consultas, sin N+1', async () => {
    const result = await getDirectoryServices({});
    console.info(`PROFILE directory services=${result.total} queries=${harness.queries.length}`);
    expect(result.total).toBe(71);
    expect(harness.queries.length).toBeLessThanOrEqual(2);
  });
  it('inicio usa como máximo siete consultas aunque crezca el catálogo', async () => {
    const result = await getHomeData();
    console.info(`PROFILE home services=${result.services.length} queries=${harness.queries.length}`);
    expect(result.services).toHaveLength(71);
    expect(harness.queries.length).toBeLessThanOrEqual(7);
    expect(result.totals).toEqual({ reportsAllTime: 5, reportsLast24h: 4, incidentsOpen: 9, incidentsAllTime: 11, servicesCount: 71 });
    expect(result.services.find(s => s.slug === 'fixture-001')?.reportsLast24h).toBe(2);
  });
  it('conserva conteos, categorías, búsqueda y orden por actividad sin multiplicar reportes', async () => {
    const result = await getDirectoryServices({ category: 'fixture-a', sort: 'activity' });
    expect(result.total).toBe(35);
    expect(result.services[0]).toMatchObject({ slug: 'fixture-001', reportsLast24h: 2, incidentsAllTime: 2 });
    expect(result.services[1]).toMatchObject({ slug: 'fixture-002', reportsLast24h: 1 });
    expect((await getDirectoryServices({ q: 'Servicio 001' })).services.map(s => s.slug)).toEqual(['fixture-001']);
    const stable = await getDirectoryServices({ category: 'fixture-a', sort: 'stability' });
    expect(stable.services[0].incidentsAllTime).toBe(0);
    expect(stable.services.at(-1)?.incidentsAllTime).toBe(2);
    const beforeEmpty = harness.queries.length;
    expect((await getDirectoryServices({ q: 'no-existe' })).services).toEqual([]);
    expect(harness.queries.length - beforeEmpty).toBe(1);
  });
  it('mapea estados, ignora resueltos y filtra antes de calcular el total', async () => {
    const result = await getDirectoryServices({});
    const bySlug = Object.fromEntries(result.services.map(s => [s.slug, s.status]));
    expect(bySlug).toMatchObject({ 'fixture-001': 'possible_outage', 'fixture-002': 'outage_detected', 'fixture-003': 'outage_high_confidence', 'fixture-004': 'outage_high_confidence', 'fixture-005': 'possible_outage', 'fixture-006': 'insufficient_data', 'fixture-009': 'insufficient_data' });
    expect(bySlug['fixture-072']).toBeUndefined();
    const filtered = await getDirectoryServices({ status: 'outage_detected' });
    expect(filtered.total).toBe(1);
    expect(filtered.services.map(s => s.slug)).toEqual(['fixture-002']);
  });
  it('elige el incidente abierto más reciente y desempata igual que el detalle', async () => {
    const listing = await getDirectoryServices({});
    for (const slug of ['fixture-007', 'fixture-008']) {
      expect(listing.services.find(s => s.slug === slug)?.status).toBe('outage_high_confidence');
      expect((await getServiceStatusDetail(ids[slug])).status).toBe('outage_high_confidence');
    }
  });
});
