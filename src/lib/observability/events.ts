import { randomUUID } from 'node:crypto';

type FailureEvent = 'api.request_failed' | 'worker.cycle_failed';
type FailureCategory = 'data_integrity' | 'dependency_unavailable' | 'dependency_timeout' | 'unexpected';
const categories: Record<string, FailureCategory> = {
  '23505': 'data_integrity', '23514': 'data_integrity', '23503': 'data_integrity',
  ECONNREFUSED: 'dependency_unavailable', CONNECTION_CLOSED: 'dependency_unavailable',
  ETIMEDOUT: 'dependency_timeout', CONNECT_TIMEOUT: 'dependency_timeout', '57014': 'dependency_timeout',
};

function categoryOf(error: unknown): FailureCategory {
  // No serializar objetos Error/cause: pueden contener SQL, parámetros o secretos.
  let current = error;
  try {
    for (let depth = 0; depth < 3 && current && typeof current === 'object'; depth++) {
      const value = current as { code?: unknown; cause?: unknown };
      const code = value.code;
      if (typeof code === 'string' && Object.hasOwn(categories, code)) return categories[code];
      current = value.cause;
    }
  } catch { /* Un getter o Proxy hostil tampoco debe romper la respuesta controlada. */ }
  return 'unexpected';
}

/** Solo campos permitidos. La referencia se genera en servidor, nunca desde una cabecera externa. */
export function logServiceFailure(event: FailureEvent, error: unknown): string {
  const reference = randomUUID();
  const record = { timestamp: new Date().toISOString(), level: 'error', event, reference, category: categoryOf(error) };
  try { console.error(JSON.stringify(record)); } catch { /* El fallo del destino de logs no expone el error original. */ }
  return reference;
}
