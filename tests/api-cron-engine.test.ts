import { describe, it, expect, afterEach } from 'vitest';
import { lastCompletedWindowStart } from '../src/lib/engine/cycle';
import { ENGINE_MAX_CATCH_UP_WINDOWS } from '../src/lib/engine/parameters';
import { GET, POST } from '../src/app/api/cron/engine/route';

/** Integración (Postgres real, `npm run test:integration`): escribe ventanas y líneas base. */
const SECRET = 'x'.repeat(40);
const original = process.env.CRON_SECRET;

function call(method: 'GET' | 'POST', auth: string) {
  const req = new Request('http://localhost/api/cron/engine', { method, headers: { Authorization: auth } });
  return method === 'GET' ? GET(req) : POST(req);
}

afterEach(() => {
  if (original === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = original;
});

describe('/api/cron/engine (integración, Postgres real)', () => {
  it('con la clave correcta procesa las ventanas pendientes y una segunda llamada no repite nada (Postgres real)', async () => {
    process.env.CRON_SECRET = SECRET;
    const res = await call('GET', `Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.windowMinutes).toBe(15);
    expect(data.processed.length).toBeLessThanOrEqual(ENGINE_MAX_CATCH_UP_WINDOWS);
    const starts = data.processed.map((p: { windowStart: string }) => Date.parse(p.windowStart));
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
    if (starts.length) expect(starts.at(-1)).toBe(lastCompletedWindowStart(new Date(), 15).getTime());

    // Sin repetir nada: vacío, salvo que entre ambas llamadas se haya cerrado una ventana nueva.
    const again = await (await call('POST', `Bearer ${SECRET}`)).json();
    const againStarts = again.data.processed.map((p: { windowStart: string }) => Date.parse(p.windowStart));
    expect(againStarts.length).toBeLessThanOrEqual(1);
    for (const t of againStarts) expect(t).toBeGreaterThan(starts.at(-1) ?? 0);
  });
});
