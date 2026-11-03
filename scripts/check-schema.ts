import { is } from 'drizzle-orm';
import { PgTable, getTableConfig } from 'drizzle-orm/pg-core';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as schema from '../src/lib/db/schema';

/** Deuda explícita: dos referencias sin FK y dos identificadores polimórficos. */
const referencesWithoutFK = new Set([
  'incidents.created_by', 'official_updates.verified_by',
  'moderation_actions.target_id', 'audit_logs.entity_id',
]);
const validName = (name: string) => /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(name) && Buffer.byteLength(name) <= 63;

export function checkTables(values: unknown[]): string[] {
  const errors: string[] = [];
  const tables = values.filter((value): value is PgTable => is(value, PgTable));
  if (!tables.length) errors.push('No se encontraron tablas para verificar');
  for (const table of tables) {
    const config = getTableConfig(table);
    if (!validName(config.name)) errors.push(`Nombre SQL inválido: ${config.name}`);
    if (!config.columns.some(col => col.primary) && !config.primaryKeys.length) errors.push(`Falta PK: ${config.name}`);
    const references = new Set(config.foreignKeys.flatMap(fk => fk.reference().columns.map(col => col.name)));
    for (const col of config.columns) {
      const id = `${config.name}.${col.name}`;
      if (!validName(col.name)) errors.push(`Nombre SQL inválido: ${id}`);
      if (col.getSQLType().startsWith('timestamp') && !col.getSQLType().includes('with time zone')) errors.push(`Timestamp sin zona: ${id}`);
      if (col.name.endsWith('_id') && !references.has(col.name) && !referencesWithoutFK.has(id)) errors.push(`Referencia sin FK: ${id}`);
    }
    for (const name of [
      ...config.indexes.map(index => index.config.name),
      ...config.foreignKeys.map(fk => fk.getName()),
      ...config.checks.map(check => check.name),
    ]) {
      if (name && !validName(name)) errors.push(`Nombre SQL inválido: ${config.name}.${name}`);
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const errors = checkTables(Object.values(schema));
  errors.forEach(error => console.error(error));
  if (errors.length) process.exitCode = 1;
  else console.log('Esquema: nombres, claves primarias, referencias y zonas horarias verificados (con excepciones documentadas).');
}
