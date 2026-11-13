import { beforeEach, describe, expect, it } from 'vitest';
import { and, eq, inArray } from 'drizzle-orm';
import { GET, POST } from '../src/app/api/services/[slug]/comments/route';
import { db } from '../src/lib/db/client';
import { auditLogs, serviceComments, services } from '../src/lib/db/schema';
import {
  pruneStaleServiceComments,
  removeServiceComment,
} from '../src/lib/comments/moderation-operations';
import { _resetMemoryRateLimits } from '../src/lib/security/rate-limit';

const context = (slug = 'movistar') => ({ params: Promise.resolve({ slug }) });
const seed = () => 'integration-comment-' + crypto.randomUUID();
const payload = (body = 'Mi servicio falla por la tarde y vuelve después de unos minutos.') => ({
  body, deviceSeed: seed(), privacyAcknowledged: true,
});
const post = (body: unknown, slug = 'movistar') => POST(
  new Request('http://localhost/api/services/' + slug + '/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
  context(slug),
);
const get = (slug = 'movistar') => GET(
  new Request('http://localhost/api/services/' + slug + '/comments'),
  context(slug),
);

describe('Community comments API (real PostgreSQL integration)', () => {
  beforeEach(() => _resetMemoryRateLimits());

  it('holds posts in moderation and never leaks anonymous hashes through GET', async () => {
    const created = await post(payload());
    expect(created.status).toBe(201);
    const data = (await created.json()).data;
    expect(data.status).toBe('pending');
    expect(data.published).toBeUndefined();

    try {
      const hidden = await get();
      expect(hidden.status).toBe(200);
      const hiddenData = (await hidden.json()).data as Array<{ id: string }>;
      expect(hiddenData.some((entry) => entry.id === data.id)).toBe(false);

      await db.update(serviceComments)
        .set({ moderationStatus: 'approved', moderatedAt: new Date() })
        .where(eq(serviceComments.id, data.id));
      const publicResponse = await get();
      expect(publicResponse.status).toBe(200);
      const publicData = (await publicResponse.json()).data as Array<Record<string, unknown>>;
      const approved = publicData.find((entry) => entry.id === data.id);
      expect(approved).toBeDefined();
      expect(approved).toHaveProperty('body');
      expect(approved).toHaveProperty('createdAt');
      expect(approved).not.toHaveProperty('anonymousHash');
      expect(approved).not.toHaveProperty('ipPrefixHash');
      expect(approved).not.toHaveProperty('moderationStatus');
    } finally {
      await db.delete(serviceComments).where(eq(serviceComments.id, data.id));
    }
  });

  it('rejects invalid content, absent privacy acknowledgement and missing services', async () => {
    expect((await post({ ...payload(), body: 'Visita https://example.org' })).status).toBe(400);
    expect((await post({ ...payload(), privacyAcknowledged: false })).status).toBe(400);
    expect((await post(payload(), 'does-not-exist')).status).toBe(404);
  });

  it('removes an approved comment without preserving text or identity in the audit record', async () => {
    const created = await post(payload('Comparto mi experiencia: la conexión fue irregular desde temprano.'));
    expect(created.status).toBe(201);
    const id = (await created.json()).data.id as string;
    try {
      await db.update(serviceComments).set({ moderationStatus: 'approved' })
        .where(eq(serviceComments.id, id));
      const visible = (await (await get()).json()).data as Array<{ id: string }>;
      expect(visible.some((comment) => comment.id === id)).toBe(true);
      expect(await removeServiceComment(id)).toBe(true);
      expect(await removeServiceComment(id)).toBe(false);
      const after = (await (await get()).json()).data as Array<{ id: string }>;
      expect(after.some((comment) => comment.id === id)).toBe(false);
      const records = await db.select({
        action: auditLogs.action,
        before: auditLogs.before,
        after: auditLogs.after,
      }).from(auditLogs).where(and(
        eq(auditLogs.entityId, id),
        eq(auditLogs.action, 'comment_removed'),
      ));
      expect(records).toHaveLength(1);
      const audit = JSON.stringify(records[0]);
      expect(audit).toContain('comment_removed');
      expect(audit).not.toContain('Comparto mi experiencia');
      expect(audit).not.toContain('anonymousHash');
      expect(audit).not.toContain('ipPrefixHash');
    } finally {
      await db.delete(serviceComments).where(eq(serviceComments.id, id));
      await db.delete(auditLogs).where(eq(auditLogs.entityId, id));
    }
  });

  it('dry-runs retention and prunes only expired pending/rejected comments', async () => {
    const service = await db.select({ id: services.id }).from(services)
      .where(eq(services.slug, 'movistar')).limit(1);
    expect(service).toHaveLength(1);
    const now = new Date();
    const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);
    const fixtures = await db.insert(serviceComments).values([
      { serviceId: service[0].id, body: 'Comentario pendiente antiguo de la comunidad.',
        anonymousHash: 'a'.repeat(64), ipPrefixHash: 'b'.repeat(64),
        moderationStatus: 'pending', createdAt: daysAgo(40) },
      { serviceId: service[0].id, body: 'Comentario rechazado antiguo de la comunidad.',
        anonymousHash: 'c'.repeat(64), ipPrefixHash: 'd'.repeat(64),
        moderationStatus: 'rejected', createdAt: daysAgo(9) },
      { serviceId: service[0].id, body: 'Comentario aprobado conservado en la comunidad.',
        anonymousHash: 'e'.repeat(64), ipPrefixHash: 'f'.repeat(64),
        moderationStatus: 'approved', createdAt: daysAgo(250) },
      { serviceId: service[0].id, body: 'Comentario pendiente reciente de la comunidad.',
        anonymousHash: '1'.repeat(64), ipPrefixHash: '2'.repeat(64),
        moderationStatus: 'pending', createdAt: daysAgo(1) },
      { serviceId: service[0].id, body: 'Comentario rechazado reciente de la comunidad.',
        anonymousHash: '3'.repeat(64), ipPrefixHash: '4'.repeat(64),
        moderationStatus: 'rejected', createdAt: daysAgo(1) },
    ]).returning({ id: serviceComments.id });
    const ids = fixtures.map((row) => row.id);
    try {
      const preview = await pruneStaleServiceComments({ now });
      expect(preview.dryRun).toBe(true);
      expect(preview.removed).toBe(0);
      const before = await db.select({ id: serviceComments.id }).from(serviceComments)
        .where(inArray(serviceComments.id, ids));
      expect(before).toHaveLength(5);

      const result = await pruneStaleServiceComments({ now, confirm: true });
      expect(result.dryRun).toBe(false);
      expect(result.removed).toBeGreaterThanOrEqual(2);
      const remaining = await db.select({
        id: serviceComments.id,
        status: serviceComments.moderationStatus,
      }).from(serviceComments).where(inArray(serviceComments.id, ids));
      expect(remaining).toHaveLength(3);
      expect(remaining.map((row) => row.status).sort())
        .toEqual(['approved', 'pending', 'rejected']);
      const deletedIds = ids.filter((id) => !remaining.some((row) => row.id === id));
      const logs = await db.select({ id: auditLogs.entityId, before: auditLogs.before })
        .from(auditLogs).where(and(
          inArray(auditLogs.entityId, deletedIds),
          eq(auditLogs.action, 'comment_retention_pruned'),
        ));
      expect(logs).toHaveLength(2);
      for (const item of logs) {
        expect(JSON.stringify(item)).not.toContain('anonymousHash');
        expect(JSON.stringify(item)).not.toContain('Comentario ');
      }
    } finally {
      await db.delete(serviceComments).where(inArray(serviceComments.id, ids));
      await db.delete(auditLogs).where(inArray(auditLogs.entityId, ids));
    }
  });

  it('limits repeated messages for one anonymous device', async () => {
    const body = payload();
    const created = await post(body);
    expect(created.status).toBe(201);
    const id = (await created.json()).data.id as string;
    try {
      expect((await post(body)).status).toBe(429);
    } finally {
      await db.delete(serviceComments).where(eq(serviceComments.id, id));
    }
  });
});
