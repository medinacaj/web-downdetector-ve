import { getMicrosoftOfficialStatuses } from '@/lib/official-status/microsoft-rss';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sources = await getMicrosoftOfficialStatuses();
  return Response.json(
    { data: sources, meta: { source: 'Microsoft public RSS', refreshSeconds: 300 } },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' } },
  );
}
