/**
 * Ubicación aproximada para el formulario de reporte (Etapa 5): sugiere el ESTADO a
 * partir de las cabeceras de ubicación que añade el hosting/CDN delante del sitio. No
 * consulta servicios de terceros, no usa coordenadas ni GPS, no baja de estado y no se
 * guarda aparte: solo preselecciona el desplegable, que la persona puede cambiar.
 *
 * Cabeceras soportadas (las publica el proveedor; país ISO 3166-1 y región ISO 3166-2,
 * con o sin el prefijo "VE-"):
 * - Vercel: `x-vercel-ip-country` + `x-vercel-ip-country-region`.
 * - Cloudflare: `cf-ipcountry` + `cf-region-code` (esta última requiere activar la
 *   transformación "visitor location headers" en el panel de Cloudflare).
 * Sin esas cabeceras (local, otro hosting) no hay sugerencia. Un cliente podría enviarlas
 * a mano: es inocuo, solo cambiaría la preselección de su propio formulario.
 * NO VERIFICADO en un hosting real (aún no hay despliegue).
 */
const COUNTRY_HEADERS = ['x-vercel-ip-country', 'cf-ipcountry'];
const REGION_HEADERS = ['x-vercel-ip-country-region', 'cf-region-code'];

export function suggestStateCode(headers: Pick<Headers, 'get'>, validCodes: ReadonlySet<string>): string | null {
  const country = COUNTRY_HEADERS.map((h) => headers.get(h)?.trim().toUpperCase()).find(Boolean);
  if (country !== 'VE') return null;
  for (const h of REGION_HEADERS) {
    const raw = headers.get(h)?.trim().toUpperCase();
    if (!raw) continue;
    const code = raw.startsWith('VE-') ? raw : `VE-${raw}`;
    if (/^VE-[A-Z]$/.test(code) && validCodes.has(code)) return code;
  }
  return null;
}
