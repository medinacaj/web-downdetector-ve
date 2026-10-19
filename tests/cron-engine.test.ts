import { describe, it, expect, afterEach } from 'vitest';
import { lastCompletedWindowStart, windowStartFor } from '../src/lib/engine/cycle';
import { GET, POST } from '../src/app/api/cron/engine/route';

const SECRET = 'x'.repeat(40);
const original = process.env.CRON_SECRET;

function call(method: 'GET' | 'POST', auth?: string) {
  const req = new Request('http://localhost/api/cron/engine', {
    method,
    headers: auth ? { Authorization: auth } : {},
  });
  return method === 'GET' ? GET(req) : POST(req);
}

afterEach(() => {
  if (original === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = original;
});

describe('motor: ventanas de la tarea programada', () => {
  it('windowStartFor redondea hacia abajo al múltiplo de la ventana', () => {
    expect(windowStartFor(new Date('2026-10-19T10:14:59Z'), 15).toISOString()).toBe('2026-10-19T10:00:00.000Z');
    expect(windowStartFor(new Date('2026-10-19T10:15:00Z'), 15).toISOString()).toBe('2026-10-19T10:15:00.000Z');
  });

  it('la tarea procesa la última ventana cerrada aunque llegue con retraso', () => {
    // Programada a las 10:17, ejecutada a las 10:29: sigue siendo la ventana 10:00–10:15.
    for (const at of ['2026-10-19T10:17:00Z', '2026-10-19T10:29:59Z']) {
      expect(lastCompletedWindowStart(new Date(at), 15).toISOString(), at).toBe('2026-10-19T10:00:00.000Z');
    }
  });
});

describe('/api/cron/engine: acceso', () => {
  it('sin CRON_SECRET (o demasiado corta) falla cerrada con 503', async () => {
    delete process.env.CRON_SECRET;
    expect((await call('POST', `Bearer ${SECRET}`)).status).toBe(503);
    process.env.CRON_SECRET = 'corta';
    expect((await call('POST', 'Bearer corta')).status).toBe(503);
  });

  it('sin la clave correcta responde 401 y no revela nada', async () => {
    process.env.CRON_SECRET = SECRET;
    for (const auth of [undefined, '', SECRET, `Bearer ${SECRET}x`, `Basic ${SECRET}`, 'Bearer ']) {
      const res = await call('POST', auth);
      expect(res.status, String(auth)).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe('unauthorized');
      expect(JSON.stringify(body)).not.toContain(SECRET);
    }
  });

  it('con la clave correcta ejecuta un ciclo sobre la última ventana cerrada (Postgres real)', async () => {
    process.env.CRON_SECRET = SECRET;
    const res = await call('GET', `Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.windowMinutes).toBe(15);
    expect(new Date(data.windowStart).getTime()).toBe(lastCompletedWindowStart(new Date(), 15).getTime());
    expect(typeof data.servicesScored).toBe('number');
  });
});
