export function parseRunOptions(args: string[], now = new Date()) {
  const seen = new Set<string>();
  for (const arg of args) {
    const name = arg.split('=')[0];
    if ((name !== '--window' && name !== '--at' && arg !== '--completed') || seen.has(name)
        || (name !== '--completed' && !arg.includes('='))) {
      throw new Error('Argumentos inválidos del motor. Usa --window=N, --at=ISO o --completed.');
    }
    seen.add(name);
  }
  if (seen.has('--completed') && seen.has('--at')) throw new Error('--completed no admite --at.');
  const windowMinutes = Number(args.find(arg => arg.startsWith('--window='))?.slice(9) ?? 15);
  const explicitAt = args.find(arg => arg.startsWith('--at='))?.slice(5);
  const at = explicitAt === undefined ? now : new Date(explicitAt);
  if (!Number.isInteger(windowMinutes) || windowMinutes < 1 || windowMinutes > 1440 || !Number.isFinite(at.getTime())) {
    throw new Error('Ventana inválida (1–1440 minutos enteros) o fecha inválida.');
  }
  const ms = windowMinutes * 60_000;
  const start = Math.floor(at.getTime() / ms) * ms - (seen.has('--completed') ? ms : 0);
  // La línea base del trabajo programado usa el cierre de la ventana, no el reloj de ejecución.
  return { windowMinutes, at: seen.has('--completed') ? new Date(start + ms) : at, windowStart: new Date(start) };
}
