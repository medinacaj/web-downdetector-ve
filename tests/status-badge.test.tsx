import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatusBadge } from '@/components/ui/StatusBadge';

describe('compact service status indicators', () => {
  it('shows the full explanatory text without an ambiguous question-mark glyph', () => {
    for (const status of ['insufficient_data', 'monitoring_unavailable'] as const) {
      const html = renderToStaticMarkup(<StatusBadge status={status} size="sm" />);
      expect(html).toContain(status === 'insufficient_data' ? 'Sin datos suficientes' : 'Monitoreo no disponible');
      expect(html).not.toContain('<svg');
    }
  });

  it('retains semantic icons for incident and normal states', () => {
    const normal = renderToStaticMarkup(<StatusBadge status="normal" />);
    const incident = renderToStaticMarkup(<StatusBadge status="outage_detected" />);
    expect(normal).toContain('<svg');
    expect(normal).toContain('Normal');
    expect(incident).toContain('<svg');
    expect(incident).toContain('Interrupción detectada');
  });
});
