/** Formatos de fecha y duración de la interfaz (es-VE, hora de negocio America/Caracas). */
const TIME_ZONE = 'America/Caracas';

export function formatDateTime(date: Date | null): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat('es-VE', { timeZone: TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/** Duración legible ("45 min", "3 h 10 min", "2 d 4 h"); redondea hacia abajo al minuto. */
export function formatDuration(from: Date, to: Date): string {
  const minutes = Math.max(0, Math.floor((to.getTime() - from.getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
  const days = Math.floor(hours / 24);
  return hours % 24 ? `${days} d ${hours % 24} h` : `${days} d`;
}
