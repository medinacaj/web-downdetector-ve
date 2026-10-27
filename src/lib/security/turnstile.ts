import { siteUrl } from '../seo';

/** No registrar tokens, secretos ni la respuesta del proveedor. */
export async function verifyTurnstile(token: string | undefined): Promise<'verified' | 'rejected' | 'unavailable'> {
  if (process.env.ENABLE_TURNSTILE !== 'true') return 'verified';
  if (!token?.trim() || token.length > 2048) return 'rejected';
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const hostname = siteUrl()?.hostname;
  if (!secret || !hostname) return 'unavailable';

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }).toString(),
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!response.ok) return 'unavailable';
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') return 'rejected';
    const result = data as Record<string, unknown>;
    return result.success === true && result.hostname === hostname && result.action === 'report'
      ? 'verified' : 'rejected';
  } catch {
    return 'unavailable';
  }
}
