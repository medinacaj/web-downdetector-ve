import bcrypt from 'bcryptjs';

/** Contraseñas de administradores (bcrypt, coste 12). */
export const PASSWORD_MIN_LENGTH = 12;
const COST = 12;

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  if (password.length > 72) return 'La contraseña no puede superar 72 caracteres (límite de bcrypt)';
  return null;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

// Hash de relleno para comparar cuando el correo no existe: la respuesta tarda lo mismo
// (mismo coste) y no revela qué correos son de administradores. Se genera una vez.
let dummyHash: Promise<string> | null = null;

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (!hash) {
    dummyHash ??= bcrypt.hash('pulsove-relleno-sin-usuario', COST);
    await bcrypt.compare(password, await dummyHash);
    return false;
  }
  return bcrypt.compare(password, hash);
}
