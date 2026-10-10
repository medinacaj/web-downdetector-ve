/**
 * Genera tráfico sintético para EJERCITAR el motor de anomalías durante
 * desarrollo (brief, sección 28: "durante el desarrollo utilizar datos
 * sintéticos" es explícitamente lo esperado). NO se ejecuta como parte de
 * `db:seed` ni de ningún flujo de producción.
 *
 * Usa un servicio de prueba dedicado y obviamente falso
 * ("Servicio de Prueba (Motor)") — nunca CANTV/Digitel/Movistar ni ningún
 * otro de los 16 servicios reales del brief, para no atribuirles jamás un
 * patrón de falla que no ocurrió.
 *
 * Patrón generado: 5 semanas de historial "normal" EN EL MISMO DÍA DE LA
 * SEMANA Y HORA donde va el pico (la línea base agrupa por día×hora: días
 * consecutivos nunca repiten el día de hoy) + un pico sostenido de 3
 * ventanas de 15 min terminando ahora + algo de variedad en días
 * recientes.
 *
 * Uso: npm run dev:synthetic-traffic
 * Limpieza: npm run dev:synthetic-traffic -- --cleanup
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../src/lib/db/client';
import { services, categories, issueTypes, states, reports } from '../src/lib/db/schema';
import { hashAnonymousId, hashIpPrefix } from '../src/lib/privacy';

const TEST_SERVICE_SLUG = 'motor-test-service';

async function ensureTestService() {
  const existing = await db.select().from(services).where(eq(services.slug, TEST_SERVICE_SLUG)).limit(1);
  if (existing.length > 0) return existing[0];

  const [category] = await db.select().from(categories).where(eq(categories.slug, 'telecomunicaciones')).limit(1);
  if (!category) throw new Error('Categoría telecomunicaciones no existe — corre npm run db:seed primero');

  const [created] = await db
    .insert(services)
    .values({
      slug: TEST_SERVICE_SLUG,
      name: 'Servicio de Prueba (Motor)',
      description: 'Servicio ficticio SOLO para ejercitar el motor de anomalías en desarrollo. No representa ninguna empresa real.',
      categoryId: category.id,
      officialUrl: null,
      isDemo: true,
    })
    .returning();
  return created;
}

async function cleanup() {
  const [service] = await db.select().from(services).where(eq(services.slug, TEST_SERVICE_SLUG)).limit(1);
  if (!service) {
    console.log('Nada que limpiar — el servicio de prueba no existe.');
    return;
  }
  // El borrado en cascada (onDelete: 'cascade') se encarga de reports,
  // aggregated_windows, baselines e incidents asociados.
  await db.delete(services).where(eq(services.id, service.id));
  console.log('✓ Servicio de prueba y todos sus datos sintéticos eliminados.');
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function insertSyntheticReport(serviceId: string, issueTypeId: string, stateId: string, at: Date, seedSuffix: string) {
  const deviceSeed = `synthetic-${seedSuffix}-${Math.random().toString(36).slice(2, 10)}`;
  await db.insert(reports).values({
    serviceId,
    issueTypeId,
    stateId,
    comment: null,
    source: 'web',
    anonymousHash: hashAnonymousId(deviceSeed),
    ipPrefixHash: hashIpPrefix(`10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}`),
    confidence: 0.5,
    suspicious: false,
    createdAt: at,
  });
}

async function main() {
  const cleanupOnly = process.argv.includes('--cleanup');
  if (cleanupOnly) {
    await cleanup();
    process.exit(0);
  }

  const service = await ensureTestService();
  const [issueType] = await db.select().from(issueTypes).where(eq(issueTypes.slug, 'sin-conexion')).limit(1);
  const [state] = await db.select().from(states).where(eq(states.code, 'VE-D')).limit(1); // Aragua, arbitrario
  if (!issueType || !state) throw new Error('Faltan datos semilla — corre npm run db:seed primero');

  console.log(`→ Servicio de prueba: ${service.name} (${service.id})`);

  const now = new Date();
  let totalInserted = 0;

  const currentWindowStart = new Date(Math.floor(now.getTime() / (15 * 60_000)) * 15 * 60_000);
  const hourStart = new Date(Math.floor(currentWindowStart.getTime() / (60 * 60_000)) * 60 * 60_000);

  console.log('→ Generando historial: mismo día de la semana, 5 semanas atrás...');
  // Las 4 sub-ventanas de 15 min de ESTA hora (hourStart..hourStart+45min)
  // — el pico, más abajo, usa estas mismas 4 franjas, nunca "terminando
  // ahora": así nunca se parte entre dos buckets de hora distintos.
  for (let weeksBack = 5; weeksBack >= 1; weeksBack--) {
    const dayHourStart = new Date(hourStart.getTime() - weeksBack * 7 * 24 * 60 * 60_000);
    for (let slot = 0; slot < 4; slot++) {
      const slotStart = new Date(dayHourStart.getTime() + slot * 15 * 60_000);
      const volume = randomInt(1, 3);
      for (let i = 0; i < volume; i++) {
        const at = new Date(slotStart.getTime() + randomInt(0, 14 * 60) * 1000);
        await insertSyntheticReport(service.id, issueType.id, state.id, at, `normal-w${weeksBack}s${slot}`);
        totalInserted++;
      }
    }
  }

  console.log('→ Generando algo de variedad en días recientes (no solo el bucket del pico)...');
  for (let daysBack = 3; daysBack >= 1; daysBack--) {
    for (let hourOffset = 0; hourOffset < 24; hourOffset += 3) {
      const at = new Date(now.getTime() - daysBack * 24 * 60 * 60_000 - hourOffset * 60 * 60_000 + randomInt(0, 59) * 60_000);
      await insertSyntheticReport(service.id, issueType.id, state.id, at, `variety-d${daysBack}h${hourOffset}`);
      totalInserted++;
    }
  }

  console.log('→ Generando pico sostenido (sub-ventanas 1,2,3 de hoy, misma hora que el historial)...');
  // Sub-ventana 0 de HOY se deja "normal" (igual que las 5 semanas
  // anteriores); el pico va en 1,2,3 — las tres dentro de hourStart, nunca
  // cruzando a la hora siguiente.
  const spikeWindowStarts: Date[] = [];
  for (let slot = 1; slot <= 3; slot++) {
    const windowStart = new Date(hourStart.getTime() + slot * 15 * 60_000);
    spikeWindowStarts.push(windowStart);
    const windowVolume = randomInt(18, 28);
    for (let i = 0; i < windowVolume; i++) {
      const at = new Date(windowStart.getTime() + randomInt(0, 14 * 60) * 1000);
      await insertSyntheticReport(service.id, issueType.id, state.id, at, `spike-slot${slot}`);
      totalInserted++;
    }
  }

  console.log(`✓ ${totalInserted} reportes sintéticos insertados para "${service.name}".`);
  console.log(`  Ventanas del pico (para --at): ${spikeWindowStarts.map((d) => d.toISOString()).join(', ')}`);
  console.log(`  Ventana siguiente (recuperación, sin datos nuevos): ${new Date(hourStart.getTime() + 4 * 15 * 60_000).toISOString()}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('✗ Falló:', err);
  process.exit(1);
});
