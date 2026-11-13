import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { GET, POST } from '../src/app/api/services/[slug]/comments/route';
import { db } from '../src/lib/db/client';
import { serviceComments } from '../src/lib/db/schema';
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
