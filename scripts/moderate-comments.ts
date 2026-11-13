import 'dotenv/config';
/**
 * Server-only moderation. Requires a verified operator with DATABASE_URL.
 * No public deletion endpoint or client-side administrator credentials.
 *
 * npm run comments:moderate -- list [pending|approved|rejected]
 * npm run comments:moderate -- approve <UUID>
 * npm run comments:moderate -- reject <UUID>
 * npm run comments:moderate -- remove <UUID> --confirm
 * npm run comments:moderate -- prune [--confirm]
 */
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../src/lib/db/client';
import { auditLogs, serviceComments, services } from '../src/lib/db/schema';
import { parseCommentModerationCommand } from '../src/lib/comments/moderation-policy';
import { pruneStaleServiceComments, removeServiceComment } from '../src/lib/comments/moderation-operations';

async function main() {
  const command = parseCommentModerationCommand(process.argv.slice(2));
  if (command.action === 'list') {
    const rows = await db.select({
      id: serviceComments.id,
      service: services.name,
      body: serviceComments.body,
      createdAt: serviceComments.createdAt,
    })
      .from(serviceComments)
      .innerJoin(services, eq(services.id, serviceComments.serviceId))
      .where(eq(serviceComments.moderationStatus, command.status))
      .orderBy(asc(serviceComments.createdAt))
      .limit(30);
    for (const row of rows) process.stdout.write(JSON.stringify(row) + '\n');
    process.stdout.write(command.status + ' mostrados: ' + rows.length + '\n');
    return;
  }

  if (command.action === 'remove') {
    const removed = await removeServiceComment(command.id);
    if (!removed) throw new Error('Comentario no encontrado.');
    process.stdout.write('Comentario ' + command.id + ': retirado y auditado\n');
    return;
  }

  if (command.action === 'prune') {
    const result = await pruneStaleServiceComments({ confirm: command.confirm });
    process.stdout.write(JSON.stringify(result) + '\n');
    if (result.dryRun) {
      process.stdout.write('Simulación: no se ha eliminado nada. Revisa los resultados y usa --confirm.\n');
    }
    if (result.matched >= result.batchLimit) {
      process.stdout.write('Puede haber más comentarios antiguos; ejecuta nuevamente tras revisar.\n');
    }
    return;
  }

  const status = command.action === 'approve' ? 'approved' : 'rejected';
  const updated = await db.transaction(async (tx) => {
    const rows = await tx.update(serviceComments)
      .set({ moderationStatus: status, moderatedAt: new Date() })
      .where(and(
        eq(serviceComments.id, command.id),
        eq(serviceComments.moderationStatus, 'pending'),
      ))
      .returning({ id: serviceComments.id });
    if (rows.length !== 1) return false;
    await tx.insert(auditLogs).values({
      action: 'comment_' + status,
      entity: 'service_comment',
      entityId: command.id,
      after: { moderationStatus: status },
    });
    return true;
  });
  if (!updated) throw new Error('Comentario no encontrado o ya moderado.');
  process.stdout.write('Comentario ' + command.id + ': ' + status + '\n');
}

main().catch((error) => {
  console.error('Error de moderación:', error instanceof Error ? error.message : 'desconocido');
  process.exitCode = 1;
});
