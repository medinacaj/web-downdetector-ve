import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL no está definida. Copia .env.example a .env y configúrala.');
}

// Un pool por proceso. En Vercel cada instancia de función tiene el suyo y
// puede haber muchas a la vez: pocas conexiones por instancia y, con Neon, la
// URL "-pooler" (PgBouncer en modo transacción, que no admite sentencias
// preparadas con nombre: de ahí `prepare: false`). Ver docs/DESPLIEGUE-VERCEL.md.
const pooled = /-pooler\./.test(databaseUrl);
const client = postgres(databaseUrl, {
  max: process.env.VERCEL ? 3 : process.env.NODE_ENV === 'production' ? 10 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: !pooled,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
