/**
 * Carga los datos semilla (categorías, estados, tipos de problema,
 * servicios) descritos en src/lib/db/seed-data/*.
 *
 * Idempotente: puede ejecutarse varias veces sin duplicar filas
 * (onConflictDoNothing sobre las columnas únicas de cada tabla). No borra
 * ni modifica datos existentes que no vengan de este seed.
 *
 * Uso: npm run db:seed   (requiere DATABASE_URL en .env y la migración ya
 * aplicada — ver npm run db:migrate:deploy)
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../src/lib/db/client';
import { categories, states, issueTypes, services } from '../src/lib/db/schema';
import { categoriesSeed } from '../src/lib/db/seed-data/categories';
import { statesSeed } from '../src/lib/db/seed-data/states';
import { issueTypesSeed } from '../src/lib/db/seed-data/issue-types';
import { servicesSeed } from '../src/lib/db/seed-data/services';

async function main() {
  console.log('→ Sembrando categorías...');
  await db
    .insert(categories)
    .values([...categoriesSeed])
    .onConflictDoNothing({ target: categories.slug });
  const categoryRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));

  console.log('→ Sembrando estados...');
  await db
    .insert(states)
    .values([...statesSeed])
    .onConflictDoNothing({ target: states.code });

  console.log('→ Sembrando tipos de problema...');
  const issueTypeRows = issueTypesSeed.map((it) => {
    const categoryId = it.categorySlug ? categoryIdBySlug.get(it.categorySlug) : null;
    if (it.categorySlug && !categoryId) {
      throw new Error(`issue_type "${it.slug}": categorySlug "${it.categorySlug}" no existe`);
    }
    return { slug: it.slug, name: it.name, categoryId: categoryId ?? null };
  });
  await db.insert(issueTypes).values(issueTypeRows).onConflictDoNothing({ target: issueTypes.slug });

  console.log('→ Sembrando servicios...');
  const serviceRows = servicesSeed.map((s) => {
    const categoryId = categoryIdBySlug.get(s.categorySlug);
    if (!categoryId) {
      throw new Error(`service "${s.slug}": categorySlug "${s.categorySlug}" no existe`);
    }
    return {
      slug: s.slug,
      name: s.name,
      description: s.description,
      categoryId,
      officialUrl: null, // ver comentario en seed-data/services.ts — nunca inventar
      isDemo: true,
    };
  });
  await db.insert(services).values(serviceRows).onConflictDoNothing({ target: services.slug });

  const finalStates = await db.select({ id: states.id }).from(states);
  const finalIssueTypes = await db.select({ id: issueTypes.id }).from(issueTypes);
  const finalServices = await db.select({ id: services.id }).from(services);

  console.log('');
  console.log('✓ Seed completado. Filas totales en cada tabla tras esta ejecución:');
  console.log(`  categorías:     ${categoryRows.length}`);
  console.log(`  estados:        ${finalStates.length}`);
  console.log(`  tipos problema: ${finalIssueTypes.length}`);
  console.log(`  servicios:      ${finalServices.length} (is_demo=true, official_url=null en todos)`);

  process.exit(0);
}

main().catch((err) => {
  console.error('✗ Seed falló:', err);
  process.exit(1);
});
