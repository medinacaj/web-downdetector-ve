import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Solo lectura: no reescribir el historial ni actualizar checksums automáticamente. */
export function checkMigrations(root: string): string[] {
  const errors: string[] = [];
  try {
    const dir = join(root, 'drizzle');
    const journal = JSON.parse(readFileSync(join(dir, 'meta/_journal.json'), 'utf8'));
    const checksums = JSON.parse(readFileSync(join(dir, 'checksums.json'), 'utf8'));
    if (!Array.isArray(journal.entries) || !checksums || typeof checksums !== 'object' || Array.isArray(checksums)) {
      return ['Formato inválido del journal o checksums'];
    }
    const registered = new Set<string>();
    if (!journal.entries.length) errors.push('Journal sin migraciones');
    for (const [idx, entry] of journal.entries.entries()) {
      if (!entry || entry.idx !== idx || typeof entry.tag !== 'string'
          || !/^\d{4}_[a-z][a-z0-9_]*$/.test(entry.tag)
          || Number(entry.tag.slice(0, 4)) !== idx || registered.has(`${entry.tag}.sql`)) {
        errors.push(`Entrada inválida del journal: ${idx}`);
        continue;
      }
      const name = `${entry.tag}.sql`;
      registered.add(name);
      if (!Object.hasOwn(checksums, name)) errors.push(`Falta checksum: ${name}`);
      else {
        const actual = createHash('sha256').update(readFileSync(join(dir, name))).digest('hex');
        if (actual !== checksums[name]) errors.push(`Checksum incorrecto: ${name}`);
      }
    }
    for (const name of readdirSync(dir).filter(name => name.endsWith('.sql'))) {
      if (!registered.has(name)) errors.push(`SQL sin registrar: ${name}`);
    }
    for (const name of Object.keys(checksums)) {
      if (!registered.has(name)) errors.push(`Checksum sin migración: ${name}`);
    }
  } catch {
    errors.push('No se pudo leer el historial completo de migraciones');
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const errors = checkMigrations(process.cwd());
  errors.forEach(error => console.error(error));
  if (errors.length) process.exitCode = 1;
  else console.log('Migraciones: journal, nombres y checksums verificados.');
}
