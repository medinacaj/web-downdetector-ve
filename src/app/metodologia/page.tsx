import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Metodología: cómo interpretamos los reportes',
  description: 'Conoce cómo PulsoVE presenta reportes ciudadanos, compara su actividad habitual y comunica posibles interrupciones sin confundir señales con confirmaciones.',
  alternates: { canonical: '/metodologia' },
};

const FEATURES = [
  {
    title: 'Estado del servicio',
    description: 'La ficha muestra las señales que realmente existen: datos insuficientes, actividad habitual o un posible incidente. Una etiqueta no certifica que el proveedor esté disponible para todos.',
    note: 'Los incidentes abiertos pueden clasificarse como posibles, detectados o de alta confianza.',
  },
  {
    title: 'Información del proveedor',
    description: 'Separamos los reportes ciudadanos de las confirmaciones oficiales. Una fuente o un comunicado del proveedor solo se identifica como oficial cuando está verificado; no existe una herramienta de comunicados empresariales abierta a todos.',
    note: 'Sin verificación, no atribuimos mensajes a la empresa.',
  },
  {
    title: 'Botón de reporte',
    description: 'Cada servicio dispone de un acceso para reportar una falla. El formulario solicita el tipo de problema y el estado de Venezuela; ciudad, operador y comentarios son opcionales.',
    note: 'Los reportes se revisan con controles contra duplicados y abuso.',
  },
  {
    title: 'Histórico de reportes',
    description: 'Las fichas permiten consultar reportes recibidos en las últimas 24 horas y en períodos de 7, 30 y 90 días, cambiar entre línea, área o barras y examinar intervalos e incidentes registrados.',
    note: 'La línea de referencia se usa en el motor de detección; no se representa como una medición de disponibilidad.',
  },
  {
    title: 'Problemas más reportados',
    description: 'Los tipos de problemas se ordenan por la cantidad de reportes reales del servicio, cuando existen datos. Así se diferencian dificultades de acceso, aplicación, red u otras categorías pertinentes.',
    note: 'Una categoría frecuente no identifica por sí sola la causa de una interrupción.',
  },
  {
    title: 'Actividad por región',
    description: 'Los reportes pueden agruparse por estado de Venezuela. La vista geográfica actual es una cuadrícula esquemática de actividad acumulada, no un mapa de calor en vivo ni un seguimiento de personas.',
    note: 'La ubicación se elige en el formulario; no se publican coordenadas personales.',
  },
  {
    title: 'Comentarios de la comunidad',
    description: 'Las fichas disponen de comentarios sujetos a moderación. Son testimonios útiles para contextualizar experiencias, pero no constituyen evidencia técnica ni declaraciones del proveedor.',
    note: 'Las publicaciones pueden requerir revisión antes de aparecer.',
  },
] as const;

const PROCESS = [
  ['01', 'Recibimos', 'Se registran el servicio, el problema y el estado elegido. Se aplica limitación de frecuencia por identidad anónima y, cuando hay una red confiable, controles adicionales.'],
  ['02', 'Establecemos una referencia', 'El sistema compara ventanas de actividad con la mediana y dispersión histórica de ese servicio, día de la semana y hora en Venezuela. El período de referencia predeterminado es de hasta 90 días.'],
  ['03', 'Buscamos señales consistentes', 'Se consideran la desviación, diversidad de reportantes, persistencia de la actividad y distribución regional. Las señales técnicas u oficiales ausentes se excluyen, no se inventan.'],
  ['04', 'Comunicamos con cautela', 'Los umbrales predeterminados exigen al menos dos reportantes distintos y dos ventanas consecutivas elevadas para abrir un incidente. Sin evidencia suficiente se indica explícitamente.'],
] as const;

function ConceptPreview({ number }: { number: number }) {
  if (number === 1) return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Lectura de estado</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-100 px-3 py-3 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
          <span className="block text-xs font-semibold">Sin datos suficientes</span>
          <span className="mt-1 block text-[11px] opacity-75">No se interpreta como normalidad</span>
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <span className="block text-xs font-semibold">Posible interrupción</span>
          <span className="mt-1 block text-[11px] opacity-75">Señales que requieren cautela</span>
        </div>
        <div className="rounded-xl bg-rose-50 px-3 py-3 text-rose-900 dark:bg-rose-950 dark:text-rose-200">
          <span className="block text-xs font-semibold">Interrupción detectada</span>
          <span className="mt-1 block text-[11px] opacity-75">Evidencia estadística más elevada</span>
        </div>
        <div className="rounded-xl bg-teal-50 px-3 py-3 text-teal-900 dark:bg-teal-950 dark:text-teal-200">
          <span className="block text-xs font-semibold">Actividad habitual</span>
          <span className="mt-1 block text-[11px] opacity-75">No garantiza funcionamiento</span>
        </div>
      </div>
    </div>
  );
  if (number === 2) return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Origen de la información</p>
      <div className="mt-3 rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
        <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Reportes ciudadanos</div>
        <p className="mt-1 text-xs text-ink-muted">Señales aportadas por usuarios</p>
      </div>
      <div className="mt-2 rounded-xl bg-teal-50 p-4 dark:bg-teal-950">
        <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2.5 w-2.5 rounded-full bg-teal-600" /> Confirmación oficial</div>
        <p className="mt-1 text-xs text-ink-muted">Solo si hay una fuente verificada disponible</p>
      </div>
    </div>
  );
  if (number === 3) return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Contenido del formulario</p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-border bg-bg px-3 py-3"><span className="block text-[11px] text-ink-muted">Tipo de problema</span><strong className="mt-1 block font-medium">Seleccionar</strong></div>
        <div className="rounded-lg border border-border bg-bg px-3 py-3"><span className="block text-[11px] text-ink-muted">Estado</span><strong className="mt-1 block font-medium">Seleccionar</strong></div>
      </div>
      <p className="text-xs text-ink-muted">Opcionales: ciudad, operador y detalles.</p>
      <span className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"><span aria-hidden="true" className="font-black">!</span> Reportar falla</span>
    </div>
  );
  if (number === 4) return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Cómo interpretar un aumento</p>
        <span className="rounded-full bg-bg px-2 py-1 text-[11px] text-ink-muted">Esquema conceptual</span>
      </div>
      <svg viewBox="0 0 330 126" role="img" aria-label="Diagrama conceptual de una línea de referencia estable y un aumento temporal de reportes; no contiene mediciones reales" className="w-full">
        <path d="M12 106H320 M12 63H320 M12 20H320" stroke="currentColor" strokeOpacity=".15" strokeDasharray="3 5" fill="none" />
        <path d="M12 82 H320" stroke="#0d9488" strokeWidth="2" strokeDasharray="7 5" fill="none"/>
        <path d="M12 91L38 88L64 92L90 86L116 89L142 82L168 44L194 17L220 42L246 76L272 85L296 88L320 87" stroke="#e2685a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-[11px] text-ink-muted"><span><span className="mr-1 inline-block h-0.5 w-4 align-middle bg-teal-600"/> Referencia</span><span><span className="mr-1 inline-block h-0.5 w-4 align-middle bg-rose-500"/> Actividad observada</span></div>
      <p className="mt-2 text-[11px] text-ink-muted">Ilustración explicativa, sin datos reales ni predicción de fallas.</p>
    </div>
  );
  if (number === 5) return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Desglose por tipo</p>
      <div className="mt-3 space-y-3">
        {['Acceso a la cuenta', 'Aplicación o sitio web', 'Conexión o red'].map((item, index) => (
          <div key={item} className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-200">{index + 1}</span>
            <span className="min-w-0 flex-1 text-sm">{item}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-ink-muted">Ejemplos de tipos, no un ranking real ni porcentajes inventados.</p>
    </div>
  );
  if (number === 6) return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Agregación por estados</p>
      <div className="mt-3 grid grid-cols-3 gap-2" aria-label="Representación esquemática de regiones, sin ubicaciones precisas">
        {['Zulia', 'Lara', 'Miranda', 'Carabobo', 'Aragua', 'Bolívar'].map((state, index) => (
          <div key={state} className={`flex min-h-14 items-center justify-center rounded-lg px-2 text-center text-xs font-semibold ${index % 3 === 0 ? 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200' : index % 3 === 1 ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'}`}>{state}</div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-ink-muted">Colores ilustrativos, no niveles de falla ni un mapa a escala.</p>
    </div>
  );
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Participación moderada</p>
      <div className="mt-3 rounded-xl bg-bg p-4">
        <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">C</span><div><p className="text-sm font-semibold">Comunidad</p><p className="text-[11px] text-ink-muted">Comentarios aprobados</p></div></div>
        <div className="mt-3 space-y-2"><div className="h-2.5 w-4/5 rounded-full bg-border"/><div className="h-2.5 w-3/5 rounded-full bg-border"/></div>
      </div>
      <p className="mt-3 text-[11px] text-ink-muted">Representación de la sección; no reproduce mensajes reales.</p>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-11">
      <nav className="text-xs text-ink-muted" aria-label="Ruta de navegación"><Link className="hover:underline" href="/">Inicio</Link><span className="mx-2">/</span>Metodología</nav>
      <header className="mt-5 max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">Cómo funciona PulsoVE</p>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">Examinamos reportes ciudadanos para identificar posibles problemas de servicio.</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-ink-muted">Un aumento de reportes puede ser la primera señal de una interrupción, pero no es una prueba concluyente. PulsoVE reúne la información disponible, compara patrones y explica qué puede —y qué no puede— inferirse.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/servicios" className="inline-flex items-center rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">Explorar servicios</Link>
          <a href="#deteccion" className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold hover:bg-bg">Cómo detectamos incidentes</a>
        </div>
      </header>

      <section className="mt-14" aria-labelledby="guia-title">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">Guía de lectura</p>
          <h2 id="guia-title" className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Siete elementos de una ficha de servicio</h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">Los ejemplos visuales de esta guía explican las funciones. No representan estadísticas actuales ni sustituyen las fichas de cada plataforma.</p>
        </div>
        <ol className="mt-7 space-y-5">
          {FEATURES.map((feature, index) => (
            <li key={feature.title} className="grid min-w-0 gap-5 rounded-2xl bg-surface p-4 shadow-[0_5px_22px_rgba(16,37,44,0.08)] sm:p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
              <div className="min-w-0 rounded-xl bg-bg p-4 sm:p-5"><ConceptPreview number={index + 1} /></div>
              <div className="min-w-0 pb-1">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-lg font-bold text-white" aria-hidden="true">{index + 1}</span>
                  <div><h3 className="pt-1 font-display text-xl font-semibold">{feature.title}</h3><p className="mt-3 text-sm leading-7 text-ink-muted">{feature.description}</p><p className="mt-3 border-l-2 border-teal-500 pl-3 text-xs leading-6 text-ink-muted">{feature.note}</p></div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="deteccion" className="mt-16 scroll-mt-20" aria-labelledby="deteccion-title">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Detección de anomalías</p>
          <h2 id="deteccion-title" className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Cómo identificamos un posible incidente</h2>
          <p className="mt-3 text-sm leading-7 text-ink-muted">No basta con recibir unos pocos reportes. Una señal se interpreta respecto a la actividad histórica, los reportantes distintos y la continuidad del aumento.</p>
        </div>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {PROCESS.map(([number, title, description]) => (
            <li key={number} className="rounded-xl bg-surface px-5 py-6 shadow-sm">
              <span className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-300">{number}</span>
              <h3 className="mt-2 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink-muted">{description}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[#123f47] p-5 text-white"><p className="text-2xl font-bold">90 días</p><p className="mt-1 text-xs leading-5 text-cyan-100">Máximo de referencia histórica por defecto, no seis meses.</p></div>
          <div className="rounded-xl bg-[#304d72] p-5 text-white"><p className="text-2xl font-bold">15 min</p><p className="mt-1 text-xs leading-5 text-blue-100">Tamaño predeterminado de ventana del motor; no garantiza ejecución automática.</p></div>
          <div className="rounded-xl bg-[#714b59] p-5 text-white"><p className="text-2xl font-bold">2 + 2</p><p className="mt-1 text-xs leading-5 text-rose-100">Dos reportantes distintos y dos ventanas elevadas como mínimos configurables.</p></div>
        </div>
      </section>

      <section className="mt-14 grid gap-5 lg:grid-cols-2" aria-labelledby="estados-title">
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 id="estados-title" className="font-display text-xl font-semibold">Qué significan los estados</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div><dt className="font-semibold">Sin datos suficientes</dt><dd className="mt-1 leading-6 text-ink-muted">No hay evidencia adecuada para estimar el estado. No significa que el servicio funcione.</dd></div>
            <div><dt className="font-semibold">Actividad habitual</dt><dd className="mt-1 leading-6 text-ink-muted">No se observa una desviación relevante en la señal disponible; no equivale a disponibilidad certificada.</dd></div>
            <div><dt className="font-semibold">Posible interrupción</dt><dd className="mt-1 leading-6 text-ink-muted">Se observan señales elevadas que justifican atención, con incertidumbre.</dd></div>
            <div><dt className="font-semibold">Interrupción detectada / alta confianza</dt><dd className="mt-1 leading-6 text-ink-muted">La señal estadística supera umbrales más altos. Solo una fuente verificada permite identificar una confirmación oficial.</dd></div>
          </dl>
        </div>
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold">Ubicación, privacidad y límites</h2>
          <p className="mt-4 text-sm leading-7 text-ink-muted">La región se elige al enviar el reporte. PulsoVE no necesita publicar coordenadas, direcciones ni la posición exacta del usuario. Las identidades se tratan mediante identificadores anónimos y se limita la frecuencia de envío.</p>
          <p className="mt-3 text-sm leading-7 text-ink-muted">Los duplicados sospechosos pueden conservarse para auditoría y recibir menor peso; no prometemos que todos los duplicados desaparezcan de cada contador público. Los reportes también dependen de quiénes participan y de su conectividad.</p>
          <p className="mt-3 text-sm leading-7 text-ink-muted">Las comprobaciones técnicas automatizadas generales y los comunicados empresariales no se presumen activos sin una fuente realmente conectada. La periodicidad de procesamiento depende de la ejecución configurada del motor, no de un intervalo de actualización garantizado.</p>
        </div>
      </section>

      <section className="mt-12 rounded-2xl bg-[#14343f] px-6 py-8 text-white sm:px-8">
        <h2 className="font-display text-2xl font-semibold">¿Experimentas un problema?</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Busca tu plataforma, revisa su ficha y comparte un reporte. Tu experiencia puede ayudar a identificar patrones, aunque por sí sola no confirma una caída general.</p>
        <Link href="/servicios" className="mt-5 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#14343f] hover:bg-slate-100">Buscar un servicio</Link>
      </section>
    </main>
  );
}
