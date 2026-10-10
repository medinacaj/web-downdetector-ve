import type { OperationalStatus } from '@/lib/engine/status-bands';

type ExtendedStatus = OperationalStatus | 'recovering' | 'resolved' | 'monitoring_unavailable';

interface StatusVisual {
  colorClass: string;
  dotClass: string;
  label: string;
  icon: 'check' | 'trend-up' | 'trend-down' | 'alert' | 'question';
}

const VISUALS: Record<ExtendedStatus, StatusVisual> = {
  normal: { colorClass: 'text-status-normal', dotClass: 'bg-status-normal', label: 'Normal', icon: 'check' },
  resolved: { colorClass: 'text-status-normal', dotClass: 'bg-status-normal', label: 'Resuelto', icon: 'check' },
  slightly_elevated: {
    colorClass: 'text-status-elevated',
    dotClass: 'bg-status-elevated',
    label: 'Actividad ligeramente elevada',
    icon: 'trend-up',
  },
  reports_elevated: {
    colorClass: 'text-status-elevated',
    dotClass: 'bg-status-elevated',
    label: 'Reportes elevados',
    icon: 'trend-up',
  },
  recovering: {
    colorClass: 'text-status-elevated',
    dotClass: 'bg-status-elevated',
    label: 'En recuperación',
    icon: 'trend-down',
  },
  possible_outage: {
    colorClass: 'text-status-incident',
    dotClass: 'bg-status-incident',
    label: 'Posible interrupción',
    icon: 'alert',
  },
  outage_detected: {
    colorClass: 'text-status-incident',
    dotClass: 'bg-status-incident',
    label: 'Interrupción detectada',
    icon: 'alert',
  },
  outage_high_confidence: {
    colorClass: 'text-status-incident',
    dotClass: 'bg-status-incident',
    label: 'Interrupción de alta confianza',
    icon: 'alert',
  },
  insufficient_data: {
    colorClass: 'text-ink-muted',
    dotClass: 'bg-ink-muted',
    label: 'Sin datos suficientes',
    icon: 'question',
  },
  monitoring_unavailable: {
    colorClass: 'text-ink-muted',
    dotClass: 'bg-ink-muted',
    label: 'Monitoreo no disponible',
    icon: 'question',
  },
};

const ICONS: Record<StatusVisual['icon'], React.ReactNode> = {
  check: (
    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'trend-up': (
    <path d="M3 17l6-6 4 4 7-7M14 8h6v6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'trend-down': (
    <path d="M3 7l6 6 4-4 7 7M14 16h6v-6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  alert: (
    <path
      d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  question: (
    <path
      d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4M12 17h.01"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

export function StatusBadge({
  status,
  size = 'md',
}: {
  status: ExtendedStatus;
  size?: 'sm' | 'md';
}) {
  const visual = VISUALS[status] ?? VISUALS.insufficient_data;
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${visual.colorClass} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        {ICONS[visual.icon]}
      </svg>
      <span>{visual.label}</span>
    </span>
  );
}

/** Punto de color simple para listas densas — SIEMPRE acompañado de texto en otro lugar cercano (nunca solo color). */
export function StatusDot({ status }: { status: ExtendedStatus }) {
  const visual = VISUALS[status] ?? VISUALS.insufficient_data;
  return <span className={`inline-block h-2 w-2 rounded-full ${visual.dotClass}`} aria-hidden="true" />;
}
