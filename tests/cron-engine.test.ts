import { describe, it, expect, afterEach } from 'vitest';
import { lastCompletedWindowStart, windowStartFor, windowsToProcess } from '../src/lib/engine/cycle';
import { ENGINE_MAX_CATCH_UP_WINDOWS } from '../src/lib/engine/parameters';
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

describe('motor: recuperación de ventanas perdidas', () => {
  const NOW = new Date('2026-10-19T12:05:00Z'); // última ventana cerrada: 11:45
  const iso = (ds: Date[]) => ds.map((d) => d.toISOString().slice(11, 16));

  it('sin historia procesa solo la última ventana cerrada', () => {
    expect(iso(windowsToProcess(null, NOW, 15))).toEqual(['11:45']);
  });

  it('al día, o con la última ya procesada (ejecución duplicada), no hace nada', () => {
    expect(windowsToProcess(new Date('2026-10-19T11:45:00Z'), NOW, 15)).toEqual([]);
    // La ventana en curso procesada a mano (aggregate:run) tampoco provoca reprocesar una anterior.
    expect(windowsToProcess(new Date('2026-10-19T12:00:00Z'), NOW, 15)).toEqual([]);
  });

  it('tras ejecuciones perdidas recupera las pendientes en orden cronológico', () => {
    expect(iso(windowsToProcess(new Date('2026-10-19T11:00:00Z'), NOW, 15))).toEqual(['11:15', '11:30', '11:45']);
  });

  it('tras una parada larga recupera como mucho las más recientes', () => {
    const out = windowsToProcess(new Date('2026-10-18T00:00:00Z'), NOW, 15);
    expect(out).toHaveLength(ENGINE_MAX_CATCH_UP_WINDOWS);
    expect(out.at(-1)!.toISOString()).toBe('2026-10-19T11:45:00.000Z');
    expect(out[1].getTime() - out[0].getTime()).toBe(15 * 60_000);
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
});
