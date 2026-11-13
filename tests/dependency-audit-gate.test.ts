import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function runAudit(audit: unknown) {
  const directory = mkdtempSync(join(tmpdir(), 'pulsove-audit-'));
  try {
    const file = join(directory, 'audit.json');
    writeFileSync(file, typeof audit === 'string' ? audit : JSON.stringify(audit));
    return spawnSync(process.execPath, ['scripts/report-dependencies.mjs', file], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, FAIL_ON_HIGH: 'true' },
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function auditWith(high: number, critical: number) {
  return { metadata: { vulnerabilities: { critical, high, moderate: 2, low: 1 } } };
}

describe('Production dependency audit gate', () => {
  it('passes when only low and moderate advisories remain', () => {
    const result = runAudit(auditWith(0, 0));
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Sin avisos altos o críticos');
  });

  it('fails when npm reports a high vulnerability', () => {
    const result = runAudit(auditWith(1, 0));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Fallo de control');
  });

  it('fails when npm reports a critical vulnerability', () => {
    expect(runAudit(auditWith(0, 1)).status).toBe(1);
  });

  it('fails closed for incomplete and invalid audit output', () => {
    expect(runAudit({ error: { code: 'EAUDIT', summary: 'Registry unavailable' } }).status).toBe(2);
    expect(runAudit('{bad-json').status).toBe(2);
    expect(runAudit({ metadata: { vulnerabilities: { critical: 0 } } }).status).toBe(2);
  });
});
