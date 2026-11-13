import { describe, expect, it } from 'vitest';
import { createServiceCommentSchema } from '@/lib/validation/service-comments';

const valid = {
  body: 'Mi conexión comenzó a fallar desde esta mañana, ¿a alguien más le ocurre?',
  deviceSeed: 'unit-test-seed-12345',
  privacyAcknowledged: true,
};

describe('Moderated community comments', () => {
  it('accepts a short anonymous comment with explicit acknowledgement', () => {
    expect(createServiceCommentSchema.safeParse(valid).success).toBe(true);
  });
  it('requires a meaningful comment and explicit acknowledgement', () => {
    expect(createServiceCommentSchema.safeParse({ ...valid, body: 'Hola' }).success).toBe(false);
    expect(createServiceCommentSchema.safeParse({ ...valid, privacyAcknowledged: false }).success).toBe(false);
    expect(createServiceCommentSchema.safeParse({ ...valid, body: 'x'.repeat(501) }).success).toBe(false);
  });
  it('blocks direct links and identifying contact details', () => {
    for (const value of [
      'Mi teléfono es +58 412 123 4567, comuníquense conmigo',
      'Mi correo es prueba@example.com. Escríbanme por favor.',
      'Consulta el problema en https://example.com/estado',
      'Visita www.example.com/para-mas-informacion',
    ]) {
      expect(createServiceCommentSchema.safeParse({ ...valid, body: value }).success, value).toBe(false);
    }
  });
});
