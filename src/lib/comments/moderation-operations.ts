import { and, asc, eq, inArray, lt, or } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { auditLogs, serviceComments } from '@/lib/db/schema';
import { COMMENT_RETENTION, commentRetentionCutoffs } from './moderation-policy';

export async function removeServiceComment(id: string): Promise<boolean> {
  // Deleting a comment must atomically leave an audit record, but never a
  // copy of its text or the anonymous/network hashes.
  return db.transaction(async (tx) => {
    const rows = await tx.delete(serviceComments)
      .where(eq(serviceComments.id, id))
      .returning({
        id: serviceComments.id,
        serviceId: serviceComments.serviceId,
        status: serviceComments.moderationStatus,
      });
    if (rows.length !== 1) return false;
    await tx.insert(auditLogs).values({
      action: 'comment_removed',
      entity: 'service_comment',
      entityId: id,
      before: { serviceId: rows[0].serviceId, moderationStatus: rows[0].status },
      after: { removed: true },
    });
    return true;
  });
}

export async function pruneStaleServiceComments({
  confirm = false,
  now = new Date(),
}: { confirm?: boolean; now?: Date } = {}) {
  const cutoffs = commentRetentionCutoffs(now);
  const stale = or(
    and(eq(serviceComments.moderationStatus, 'pending'),
      lt(serviceComments.createdAt, cutoffs.pending)),
    and(eq(serviceComments.moderationStatus, 'rejected'),
      lt(serviceComments.createdAt, cutoffs.rejected)),
  );
  const rows = await db.select({
    id: serviceComments.id,
    status: serviceComments.moderationStatus,
    createdAt: serviceComments.createdAt,
  }).from(serviceComments)
    .where(stale)
    .orderBy(asc(serviceComments.createdAt))
    .limit(COMMENT_RETENTION.maxPruneBatch);

  if (!confirm || rows.length === 0) {
    return { matched: rows.length, removed: 0, dryRun: !confirm,
      batchLimit: COMMENT_RETENTION.maxPruneBatch };
  }

  // Reapply the expiry and moderation predicates at delete time, so a
  // concurrently approved comment never gets pruned by a stale selection.
  const removed = await db.transaction(async (tx) => {
    const deleted = await tx.delete(serviceComments)
      .where(and(inArray(serviceComments.id, rows.map((row) => row.id)), stale))
      .returning({
        id: serviceComments.id,
        status: serviceComments.moderationStatus,
        serviceId: serviceComments.serviceId,
      });
    if (deleted.length > 0) {
      await tx.insert(auditLogs).values(deleted.map((row) => ({
        action: 'comment_retention_pruned',
        entity: 'service_comment',
        entityId: row.id,
        before: { serviceId: row.serviceId, moderationStatus: row.status },
        after: { removed: true },
      })));
    }
    return deleted.length;
  });
  return { matched: rows.length, removed, dryRun: false,
    batchLimit: COMMENT_RETENTION.maxPruneBatch };
}
