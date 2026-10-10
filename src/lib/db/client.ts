import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL no está definida. Copia .env.example a .env y configúrala.');
}

// Una sola conexión pooled por proceso. En serverless (Vercel) esto se
// reinstancia por invocación fría; para el MVP y para Railway/Render con
// proceso persistente esto es suficiente. Si se despliega en edge/serverless
// con alta concurrencia, evaluar @neondatabase/serverless o un pool externo
// (PgBouncer) — ver docs/00-PLAN-MAESTRO.md, sección de escalabilidad.
const client = postgres(databaseUrl, {
  max: process.env.NODE_ENV === 'production' ? 10 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
