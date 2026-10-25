import { db } from '@/lib/db/client';
import { auditLogs } from '@/lib/db/schema';

/**
 * Registro de auditoría (tabla audit_logs). Toda acción del panel y todo intento de
 * acceso deja una fila: quién (userId, null si no se identificó), qué, sobre qué, el
 * antes/después cuando hay cambios y el hash del prefijo de IP (nunca la IP).
 */
export async function logAudit(entry: {
  userId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipHash?: string | null;
}): Promise<void> {
  await db.insert(auditLogs).values({
    userId: entry.userId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    ipHash: entry.ipHash ?? null,
  });
}
