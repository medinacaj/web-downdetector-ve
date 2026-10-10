/**
 * Sanitización defensiva de texto libre proveniente de usuarios anónimos
 * (comentarios, ciudad, operador/red). React escapa al renderizar, así que
 * esto no es la única capa — pero nunca se confía en una sola.
 */
export function sanitizeFreeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // quita etiquetas HTML
    .replace(/[<>]/g, '') // quita ángulos sueltos que sobrevivan
    .trim()
    .slice(0, 500); // tope defensivo, independiente del max() de zod
}
