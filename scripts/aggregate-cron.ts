/**
 * Orquesta un ciclo completo del motor de detección para todos los
 * servicios activos: agrega la ventana que contiene `--at` (por defecto,
 * ahora), recalcula líneas base, puntúa anomalías y actualiza el ciclo de
 * vida de incidentes. La lógica vive en src/lib/engine/cycle.ts, compartida
 * con `/api/cron/engine` (la tarea programada en producción, que procesa la
 * última ventana cerrada).
 *
 * Uso: npm run aggregate:run -- --window=15 --at=2026-08-17T14:00:00Z
 */
import 'dotenv/config';
import { DEFAULT_WINDOW_MINUTES } from '../src/lib/engine/parameters';
import { runEngineCycle } from '../src/lib/engine/cycle';

function parseArgs() {
  const args = process.argv.slice(2);
  const windowArg = args.find((a) => a.startsWith('--window='));
  const atArg = args.find((a) => a.startsWith('--at='));
  return {
    windowMinutes: windowArg ? Number(windowArg.split('=')[1]) : DEFAULT_WINDOW_MINUTES,
    at: atArg ? new Date(atArg.split('=')[1]) : new Date(),
  };
}

async function main() {
  const { windowMinutes, at } = parseArgs();
  await runEngineCycle(at, windowMinutes, (line) => console.log(line));
  console.log('✓ Ciclo completado.');
  process.exit(0);
}

main().catch((err) => {
  console.error('✗ Ciclo del motor falló:', err);
  process.exit(1);
});
