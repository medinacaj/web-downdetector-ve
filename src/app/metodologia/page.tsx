import type { Metadata } from 'next';
export const metadata: Metadata = {title:'Metodología',description:'Cómo interpreta PulsoVE reportes y señales técnicas con prudencia.',alternates:{canonical:'/metodologia'}};
const stages=[
 ['1. Recogida','Los reportes ciudadanos son señales, no diagnósticos. Se minimizan datos personales y se aplican límites antiabuso.'],
 ['2. Comparación','Se compara la actividad por servicio y franja horaria con su comportamiento habitual, cuando existen datos suficientes.'],
 ['3. Corroboración','Se evalúan diversidad de reportantes, persistencia, distribución regional y comprobaciones técnicas cuando están disponibles.'],
 ['4. Comunicación','Un pico aislado no demuestra una interrupción general. Las señales insuficientes se presentan expresamente como tales.'],
];
export default function MethodologyPage(){
 return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
  <h1 className="font-display text-3xl font-semibold">Cómo se evalúan los reportes</h1>
  <p className="mt-4 text-ink-muted">PulsoVE es independiente. El estado de un servicio se estima con la evidencia disponible; no certifica que todos los usuarios puedan utilizarlo.</p>
  <ol className="mt-8 grid gap-4 sm:grid-cols-2">{stages.map(([title,detail])=>
   <li key={title} className="rounded-lg border border-border bg-surface p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-ink-muted">{detail}</p></li>
  )}</ol>
  <section className="mt-10"><h2 className="font-display text-xl font-semibold">Limitaciones y privacidad</h2>
   <p className="mt-3 text-ink-muted">El volumen de reportes depende del acceso a Internet y de la participación. Los datos de ejemplo son demostrativos. La geografía presentada en la fase actual es esquemática y no muestra la ubicación precisa de personas. Nunca debe afirmarse una caída oficial sin corroboración suficiente.</p>
  </section>
 </main>;
}
