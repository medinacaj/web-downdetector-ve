// Apuestas y loterías: la revisión legal profesional está pendiente (CLAUDE.md,
// docs/CATALOGO-SERVICIOS.md). Se aclara que PulsoVE no promueve ni valida. Va en la
// página de cada servicio de la categoría y en la de la categoría.
export const GAMBLING_CATEGORY_SLUG = 'apuestas-y-loterias';

/** Frase fija para la metadescripción de la categoría (no depende de texto editable). */
export const GAMBLING_META_DISCLAIMER = 'PulsoVE no las promueve ni confirma que estén autorizadas.';

export function GamblingNotice({ subject }: { subject: 'service' | 'category' }) {
  return (
    <p className="mt-3 max-w-xl rounded border border-border bg-surface px-3 py-2 text-xs text-ink-muted">
      {subject === 'service'
        ? 'PulsoVE solo informa la disponibilidad técnica de este servicio. Incluirlo aquí no es una promoción ni confirma que esté autorizado.'
        : 'PulsoVE solo informa la disponibilidad técnica de estos servicios. Incluirlos aquí no es una promoción ni confirma que estén autorizados.'}
    </p>
  );
}
