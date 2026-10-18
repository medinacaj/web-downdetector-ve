import { ImageResponse } from 'next/og';
import { SHARE_IMAGE_SIZE, SITE_NAME } from './brand';

/**
 * Imagen para compartir (Open Graph y Twitter), común a todo el sitio.
 * Solo la marca propia y afirmaciones que el sitio cumple hoy: sin logos ni
 * nombres de terceros, sin cifras (los datos aún son demostrativos).
 */
export { SHARE_IMAGE_ALT, SHARE_IMAGE_SIZE } from './brand';

export function renderShareImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: '#0b1220',
          color: '#eef2f6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <svg width="96" height="96" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 12h4l2-7 4 14 2-7h8"
              stroke="#00c2a8"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>{SITE_NAME}</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 52, fontWeight: 600, lineHeight: 1.2 }}>
          Estado de servicios en Venezuela
        </div>
        <div style={{ marginTop: 20, fontSize: 32, color: '#94a3b4' }}>
          Reportes ciudadanos anónimos y un motor estadístico explicable
        </div>
      </div>
    ),
    SHARE_IMAGE_SIZE,
  );
}
