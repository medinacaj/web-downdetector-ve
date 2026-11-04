import postgres from 'postgres';
import { createReadinessCheck } from './readiness';

// Pool separado y mínimo para no acumular comprobaciones en el pool de la aplicación.
let client: ReturnType<typeof postgres> | undefined;
export const databaseIsReady = createReadinessCheck(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Database configuration unavailable');
  client ??= postgres(url, {
    max: 1,
    idle_timeout: 10,
    connect_timeout: 2,
    max_lifetime: 60,
    connection: { statement_timeout: 1500, application_name: 'pulsove-health' },
    onnotice: () => {},
    debug: false,
  });
  // Comprobar conexión, tabla y permiso de lectura, sin devolver registros.
  await client`select id from services limit 1`.simple();
});
