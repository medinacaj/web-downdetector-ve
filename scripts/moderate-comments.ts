import 'dotenv/config';
/**
 * Server-side moderation. Requires DATABASE_URL with write privileges.
 * No public route, admin token in the browser or user-supplied IP is needed.
 *
 * npm run comments:moderate -- list
 * npm run comments:moderate -- approve <UUID>
 * npm run comments:moderate -- reject <UUID>
 */
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../src/lib/db/client';
import { auditLogs, serviceComments, services } from '../src/lib/db/schema';

async function main() {
  const [command, id] = process.argv.slice(2);
  if (command === 'list' && !id) {
    const rows = await db.select({
      id: serviceComments.id,
      service: services.name,
      body: serviceComments.body,
      createdAt: serviceComments.createdAt,
    })
      .from(serviceComments)
      .innerJoin(services, eq(services.id, serviceComments.serviceId))
      .where(eq(serviceComments.moderationStatus, 'pending'))
      .orderBy(asc(serviceComments.createdAt))
      .limit(30);
    for (const row of rows) {
      process.stdout.write(JSON.stringify(row) + '\n');
    }
    process.stdout.write('Pendientes mostrados: ' + rows.length + '\n');
    return;
  }

  if ((command !== 'approve' && command !== 'reject') ||
      !id || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Uso: comments:moderate -- list | approve <UUID> | reject <UUID>');
  }

  const status = command === 'approve' ? 'approved' : 'rejected';
  const updated = await db.transaction(async (tx) => {
    const rows = await tx.update(serviceComments)
      .set({ moderationStatus: status, moderatedAt: new Date() })
      .where(and(
        eq(serviceComments.id, id),
        eq(serviceComments.moderationStatus, 'pending'),
      ))
      .returning({ id: serviceComments.id });
    if (rows.length !== 1) return false;
    await tx.insert(auditLogs).values({
      action: 'comment_' + status,
      entity: 'service_comment',
      entityId: id,
      after: { moderationStatus: status },
    });
    return true;
  });
  if (!updated) throw new Error('Comentario no encontrado o ya moderado.');
  process.stdout.write('Comentario ' + id + ': ' + status + '\n');
}

main().catch((error) => {
  console.error('Error de moderación:', error instanceof Error ? error.message : 'desconocido');
  process.exitCode = 1;
});
