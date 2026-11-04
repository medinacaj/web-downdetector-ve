import { ok } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';
export function GET() {
  return ok({ status: 'ok' }, undefined, { headers: { 'Cache-Control': 'no-store' } });
}
