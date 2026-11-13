import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { serviceComments } from '@/lib/db/schema';

/** Public query exposes only approved text; no hashes or moderation metadata. */
export async function getApprovedServiceComments(serviceId: string, limit = 20) {
  return db.select({
    id: serviceComments.id,
    body: serviceComments.body,
    createdAt: serviceComments.createdAt,
  })
    .from(serviceComments)
    .where(and(
      eq(serviceComments.serviceId, serviceId),
      eq(serviceComments.moderationStatus, 'approved'),
    ))
    .orderBy(desc(serviceComments.createdAt), desc(serviceComments.id))
    .limit(Math.max(1, Math.min(Math.trunc(limit), 20)));
}
