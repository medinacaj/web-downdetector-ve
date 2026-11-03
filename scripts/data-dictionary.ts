import { is } from 'drizzle-orm';
import { getTableConfig, isPgEnum, PgTable } from 'drizzle-orm/pg-core';
import { readFileSync, writeFileSync } from 'node:fs';
import * as schema from '../src/lib/db/schema';

// Fuente: metadatos del código. No conecta a una base ni lee registros.
const lines = [
  '# Diccionario de datos', '',
  'Generado desde `src/lib/db/schema.ts` con `npm run docs:data`. No contiene registros de usuarios ni acredita que una base desplegada coincida con este esquema.', '',
  'Clasificación y decisiones operativas: [ESTANDARES-Y-CONTROLES.md](ESTANDARES-Y-CONTROLES.md). PK compuesta y FK se reflejan por columna. La existencia de una FK no implica que sus borrados en cascada sean adecuados para toda política de retención.', '',
];

const values: unknown[] = Object.values(schema);
const tables = values.filter((value): value is PgTable => is(value, PgTable));
for (const table of tables.sort((a, b) => getTableConfig(a).name.localeCompare(getTableConfig(b).name))) {
  const config = getTableConfig(table);
  lines.push(`## ${config.name}`, '', '| Columna SQL | Tipo | Nullable | PK | Default | Referencia |', '| --- | --- | --- | --- | --- | --- |');
  for (const col of config.columns) {
    const references = config.foreignKeys.flatMap(fk => {
      const ref = fk.reference();
      const idx = ref.columns.indexOf(col);
      return idx < 0 ? [] : [`${getTableConfig(ref.foreignTable).name}.${ref.foreignColumns[idx].name} (DELETE ${fk.onDelete ?? 'no action'})`];
    });
    const primary = col.primary || config.primaryKeys.some(pk => pk.columns.includes(col));
    lines.push(`| ${col.name} | ${col.getSQLType()} | ${col.notNull ? 'no' : 'sí'} | ${primary ? 'sí' : 'no'} | ${col.hasDefault ? 'sí' : 'no'} | ${references.join(', ') || '—'} |`);
  }
  lines.push('', `Índices explícitos: ${config.indexes.map(index => index.config.name).join(', ') || 'ninguno (puede haber índices implícitos de PK/UNIQUE)'}.`, '');
  lines.push(`Restricciones CHECK: ${config.checks.map(item => item.name).join(', ') || 'ninguna'}.`, '');
  for (const item of config.uniqueConstraints) {
    lines.push(`UNIQUE ${item.getName()}: ${item.columns.map(col => col.name).join(', ')}${item.nullsNotDistinct ? ' (NULLS NOT DISTINCT)' : ''}.`, '');
  }
}
lines.push('## Enumeraciones', '');
for (const value of values.filter(isPgEnum).sort((a, b) => a.enumName.localeCompare(b.enumName))) {
  lines.push(`- \`${value.enumName}\`: ${value.enumValues.map(item => `\`${item}\``).join(', ')}.`);
}
const output = lines.join('\n') + '\n';
const target = 'docs/DICCIONARIO-DATOS.md';
if (process.argv.includes('--check')) {
  let actual = '';
  try { actual = readFileSync(target, 'utf8'); } catch { /* La ausencia también es drift. */ }
  if (actual !== output) {
    console.error('Diccionario desactualizado. Ejecuta npm run docs:data y revisa el diff.');
    process.exitCode = 1;
  } else console.log('Diccionario de datos actualizado respecto al esquema de código.');
} else {
  writeFileSync(target, output);
  console.log(`Generado ${target} (${tables.length} tablas).`);
}
