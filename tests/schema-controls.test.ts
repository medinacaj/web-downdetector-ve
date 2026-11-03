import { describe, expect, it } from 'vitest';
import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { checkTables } from '../scripts/check-schema';
import * as schema from '../src/lib/db/schema';

describe('convenciones del esquema', () => {
  it('no presenta un esquema vacío como validado', () => {
    expect(checkTables([])).toContain('No se encontraron tablas para verificar');
  });
  it('acepta el esquema vigente con excepciones explícitas', () => {
    expect(checkTables(Object.values(schema))).toEqual([]);
  });
  it('rechaza identificadores SQL fuera de snake_case', () => {
    expect(checkTables([pgTable('WrongName', { id: uuid('id').primaryKey() })]))
      .toContain('Nombre SQL inválido: WrongName');
  });
  it('exige clave primaria', () => {
    expect(checkTables([pgTable('examples', { id: uuid('id') })]))
      .toContain('Falta PK: examples');
  });
  it('impide timestamps sin zona horaria', () => {
    expect(checkTables([pgTable('examples', { id: uuid('id').primaryKey(), createdAt: timestamp('created_at') })]))
      .toContain('Timestamp sin zona: examples.created_at');
  });
  it('rechaza referencias nuevas sin integridad referencial', () => {
    expect(checkTables([pgTable('examples', { id: uuid('id').primaryKey(), userId: uuid('user_id') })]))
      .toContain('Referencia sin FK: examples.user_id');
  });
});
