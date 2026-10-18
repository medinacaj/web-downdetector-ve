'use client';

import dynamic from 'next/dynamic';

// recharts pesa ~410 KB sin comprimir: se descarga solo cuando la página pinta un gráfico
// (el servicio tiene reportes en las últimas 24 h), no en cada página de servicio. El hueco
// de carga tiene la misma altura que el gráfico para que no salte el diseño.
export const LazyHistoryChart = dynamic(() => import('./HistoryChart').then((m) => m.HistoryChart), {
  ssr: false,
  loading: () => <div className="h-60" aria-hidden="true" />,
});
