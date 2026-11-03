import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkMigrations } from '../scripts/check-migrations';

const roots: string[] = [];
afterEach(() => { roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'pulsove-migrations-'));
  roots.push(root);
  mkdirSync(join(root, 'drizzle/meta'), { recursive: true });
  const sql = 'CREATE TABLE example (id uuid PRIMARY KEY);\n';
  writeFileSync(join(root, 'drizzle/0000_initial.sql'), sql);
  writeFileSync(join(root, 'drizzle/meta/_journal.json'), JSON.stringify({ entries: [{ idx: 0, tag: '0000_initial' }] }));
  writeFileSync(join(root, 'drizzle/checksums.json'), JSON.stringify({
    '0000_initial.sql': createHash('sha256').update(sql).digest('hex'),
  }));
  return root;
}
describe('control de migraciones', () => {
  it('acepta una migración registrada e íntegra', () => {
    expect(checkMigrations(fixture())).toEqual([]);
  });
  it('detecta la edición posterior de una migración registrada', () => {
    const root = fixture();
    writeFileSync(join(root, 'drizzle/0000_initial.sql'), 'DROP TABLE example;');
    expect(checkMigrations(root)).toContain('Checksum incorrecto: 0000_initial.sql');
  });
  it('rechaza SQL sin registrar en el journal', () => {
    const root = fixture();
    writeFileSync(join(root, 'drizzle/0001_extra.sql'), 'SELECT 1;');
    expect(checkMigrations(root)).toContain('SQL sin registrar: 0001_extra.sql');
  });
  it('rechaza un nombre de migración que escape del directorio', () => {
    const root = fixture();
    writeFileSync(join(root, 'drizzle/meta/_journal.json'), JSON.stringify({ entries: [{ idx: 0, tag: '../outside' }] }));
    expect(checkMigrations(root)).toContain('Entrada inválida del journal: 0');
  });
  it('detecta un checksum eliminado', () => {
    const root = fixture();
    writeFileSync(join(root, 'drizzle/checksums.json'), '{}');
    expect(checkMigrations(root)).toContain('Falta checksum: 0000_initial.sql');
  });
  it('rechaza un journal sin migraciones', () => {
    const root = fixture();
    writeFileSync(join(root, 'drizzle/meta/_journal.json'), '{"entries":[]}');
    expect(checkMigrations(root)).toContain('Journal sin migraciones');
  });
});
