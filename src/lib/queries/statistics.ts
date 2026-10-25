import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { services, categories, reports, incidents } from '@/lib/db/schema';

/**
 * Estadísticas generales en vivo (GET /api/statistics y /estadisticas). El brief
 * (sección 6) exige que cada métrica declare fuente, período y si es estimada; lo
 * que no se puede calcular honestamente se lista en `pendingMetrics` en vez de
 * devolverse como cero (sección 28: no inventar estadísticas).
 */
export async function getStatistics(now: Date = new Date()) {
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    serviceCount,
    categoryCount,
    reportsAllTime,
    reportsLast24h,
    incidentsAllTime,
    incidentsOpen,
    reportsByCategory,
    mostActive24h,
  ] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(services).where(eq(services.active, true)),
    db.select({ n: sql<number>`count(*)::int` }).from(categories),
    db.select({ n: sql<number>`count(*)::int` }).from(reports),
    db.select({ n: sql<number>`count(*)::int` }).from(reports).where(gte(reports.createdAt, since24h)),
    db.select({ n: sql<number>`count(*)::int` }).from(incidents),
    db.select({ n: sql<number>`count(*)::int` }).from(incidents).where(sql`${incidents.status} != 'resolved'`),
    db
      .select({
        category: categories.name,
        categorySlug: categories.slug,
        count: sql<number>`count(${reports.id})::int`,
      })
      .from(categories)
      .leftJoin(services, eq(services.categoryId, categories.id))
      .leftJoin(reports, eq(reports.serviceId, services.id))
      .groupBy(categories.id)
      .orderBy(desc(sql`count(${reports.id})`), asc(categories.sortOrder)),
    db
      .select({
        service: services.name,
        serviceSlug: services.slug,
        reportsLast24h: sql<number>`count(${reports.id})::int`,
      })
      .from(services)
      .leftJoin(reports, and(eq(reports.serviceId, services.id), gte(reports.createdAt, since24h)))
      .where(eq(services.active, true))
      .groupBy(services.id)
      .orderBy(desc(sql`count(${reports.id})`), asc(services.name))
      .limit(10),
  ]);

  return {
    data: {
      totals: {
        services: serviceCount[0]?.n ?? 0,
        categories: categoryCount[0]?.n ?? 0,
        reportsAllTime: reportsAllTime[0]?.n ?? 0,
        reportsLast24h: reportsLast24h[0]?.n ?? 0,
        incidentsAllTime: incidentsAllTime[0]?.n ?? 0,
        incidentsOpen: incidentsOpen[0]?.n ?? 0,
      },
      reportsByCategory,
      mostActiveServices24h: mostActive24h,
    },
    meta: {
      generatedAt: now.toISOString(),
      source: 'Consulta en vivo a PostgreSQL',
      period: 'Totales históricos donde se indica; el resto, últimas 24h',
      estimated: false,
      // Por qué no se publican todavía (el motor existe; faltan datos reales).
      pendingMetrics: {
        availabilityEstimate: 'Requiere mediciones técnicas, que aún no están activas',
        meanRecoveryTime: 'Requiere incidentes reales resueltos; hoy los datos son demostrativos',
        stabilityRanking: 'Requiere historial suficiente de incidentes reales',
        providerComparison: 'Requiere datos operativos reales, no de demostración',
      },
    },
  };
}

export type Statistics = Awaited<ReturnType<typeof getStatistics>>;
