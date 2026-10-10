const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Caracas',
  weekday: 'short',
  hour: 'numeric',
  hourCycle: 'h23',
});

/**
 * América/Caracas no tiene cambios de horario de verano desde 2016 (UTC-4
 * fijo), pero se usa Intl en vez de restar 4 horas a mano para no
 * codificar ese supuesto directamente — si algún día cambia, esto se
 * ajusta solo.
 */
export function getCaracasWeekdayHour(date: Date): { weekday: number; hour: number } {
  const parts = formatter.formatToParts(date);
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0';

  const weekday = WEEKDAY_INDEX[weekdayStr] ?? 0;
  // hourCycle h23 da "0".."23", pero medianoche a veces llega como "24" en
  // algunos motores ICU — se normaliza por seguridad.
  const hour = Number(hourStr) % 24;

  return { weekday, hour };
}
