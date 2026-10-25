import { ok, withErrorHandling } from '@/lib/api/respond';
import { getStatistics } from '@/lib/queries/statistics';

// La consulta, sus fuentes y las métricas pendientes viven en src/lib/queries/statistics.ts
// (las comparte la página /estadisticas).
async function handleGET(_request: Request) {
  const { data, meta } = await getStatistics();
  return ok(data, meta);
}

export const GET = withErrorHandling(handleGET);
