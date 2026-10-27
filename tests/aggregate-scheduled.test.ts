import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'pulsove-scheduler-'));
  dirs.push(dir);
  const marker = join(dir, 'ran');
  writeFileSync(join(dir, 'npm'), '#!/bin/sh\nprintf "%s\\n" "$@" > "$SCHEDULER_TEST_MARKER"\nexit "${SCHEDULER_TEST_EXIT:-0}"\n', { mode: 0o700 });
  return { marker, env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, SCHEDULER_TEST_MARKER: marker } };
}
describe('ejecutor programado de un host', () => {
  it('omite ejecución si otro proceso tiene el bloqueo', () => {
    const { marker, env } = fixture();
    const run = spawnSync('bash', ['-c', 'mkdir -p .runtime; exec 8>.runtime/aggregate.lock; flock 8; bash scripts/aggregate-scheduled.sh'], { env, timeout: 5000 });
    expect(run.status).toBe(0);
    expect(existsSync(marker)).toBe(false);
  });
  it('propaga el fallo del motor y libera el bloqueo', () => {
    const { marker, env } = fixture();
    const failed = spawnSync('bash', ['scripts/aggregate-scheduled.sh'], { env: { ...env, SCHEDULER_TEST_EXIT: '7' }, timeout: 5000 });
    expect(failed.status).toBe(7);
    expect(existsSync(marker)).toBe(true);
    expect(spawnSync('bash', ['scripts/aggregate-scheduled.sh'], { env, timeout: 5000 }).status).toBe(0);
  });
});
