/**
 * Carga los datos semilla (categorías, estados, tipos de problema,
 * servicios) descritos en src/lib/db/seed-data/*.
 *
 * Idempotente: puede ejecutarse varias veces sin duplicar filas.
 * - Categorías y tipos de problema se SINCRONIZAN con el código (upsert por
 *   `slug`: nombre, descripción, ícono, orden y categoría). Así, un cambio en
 *   las semillas llega también a bases ya sembradas. No tocan `active`, para no
 *   reactivar un tipo que alguien desactivó.
 * - Estados y servicios solo se INSERTAN si faltan (onConflictDoNothing): un
 *   servicio puede haberse editado o desactivado después y no se pisa.
 * - Nunca borra filas; retirar un servicio o tipo = `active = false`.
 *
 * Uso: npm run db:seed   (requiere DATABASE_URL en .env y la migración ya
 * aplicada — ver npm run db:migrate:deploy)
 */
import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db/client';
import { categories, states, issueTypes, services } from '../src/lib/db/schema';
import { categoriesSeed } from '../src/lib/db/seed-data/categories';
import { statesSeed } from '../src/lib/db/seed-data/states';
import { issueTypesSeed } from '../src/lib/db/seed-data/issue-types';
import { servicesSeed } from '../src/lib/db/seed-data/services';

async function main() {
  const servicesBefore = (await db.select({ id: services.id }).from(services)).length;

  console.log('→ Sincronizando categorías...');
  await db
    .insert(categories)
    .values([...categoriesSeed])
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        icon: sql`excluded.icon`,
        sortOrder: sql`excluded.sort_order`,
      },
    });
  const categoryRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));

  console.log('→ Sembrando estados...');
  await db
    .insert(states)
    .values([...statesSeed])
    .onConflictDoNothing({ target: states.code });

  console.log('→ Sincronizando tipos de problema...');
  const issueTypeRows = issueTypesSeed.map((it) => {
    const categoryId = it.categorySlug ? categoryIdBySlug.get(it.categorySlug) : null;
    if (it.categorySlug && !categoryId) {
      throw new Error(`issue_type "${it.slug}": categorySlug "${it.categorySlug}" no existe`);
    }
    return { slug: it.slug, name: it.name, categoryId: categoryId ?? null };
  });
  await db
    .insert(issueTypes)
    .values(issueTypeRows)
    .onConflictDoUpdate({
      target: issueTypes.slug,
      set: {
        name: sql`excluded.name`,
        categoryId: sql`excluded.category_id`,
      },
    });

  console.log('→ Sembrando servicios que falten...');
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
  console.log(
    `  servicios:      ${finalServices.length} (${finalServices.length - servicesBefore} nuevos en esta ejecución; is_demo=true, official_url=null en los sembrados)`,
  );

  process.exit(0);
}

main().catch((err) => {
  console.error('✗ Seed falló:', err);
  process.exit(1);
});
