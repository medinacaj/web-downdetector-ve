import { ok } from '@/lib/api/respond';
import { databaseIsReady } from '@/lib/observability/database-readiness';

export const dynamic = 'force-dynamic';
export async function GET() {
  const ready = await databaseIsReady();
  return ok({ status: ready ? 'ok' : 'unavailable' }, undefined, {
    status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' },
  });
}
