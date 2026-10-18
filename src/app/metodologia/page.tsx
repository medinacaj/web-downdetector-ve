import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BASELINE_LOOKBACK_DAYS,
  DEFAULT_WINDOW_MINUTES,
  INCIDENT_RULES,
  MIN_BASELINE_SAMPLES_FOR_STATUS,
  RELIABILITY_BANDS,
  RELIABILITY_FULL,
  REPORT_RATE_LIMIT,
  SIGNAL_WEIGHTS,
} from '@/lib/engine/parameters';
import { STATUS_BANDS, STATUS_LABELS_ES } from '@/lib/engine/status-bands';
import { pageMetadata } from '@/lib/seo/metadata';
import { ROUTE, isRouteAvailable } from '@/lib/nav';

// Las cifras salen de los mismos parámetros que usa el motor (src/lib/engine/parameters.ts),
// que pueden venir del entorno del servidor: se renderiza en cada petición para mostrar
// los valores vigentes, no los del momento del build.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMetadata({
  title: 'Metodología: cómo detectamos fallas',
  description:
    'Cómo PulsoVE convierte reportes ciudadanos anónimos en estados y posibles interrupciones: línea base, señales y pesos, umbrales, privacidad y limitaciones actuales.',
  path: ROUTE.methodology.href,
});

const pct = (w: number) => `${Math.round(w * 100)} %`;

const SIGNALS = [
  {
    name: 'Desviación',
    weight: SIGNAL_WEIGHTS.deviation,
    how: 'Cuánto se aleja el número de reportes de la ventana de lo habitual para ese servicio en ese día y hora (puntuación z robusta: 0 si no supera lo normal, 100 a partir de 6).',
    active: true,
  },
  {
    name: 'Diversidad de reportantes',
    weight: SIGNAL_WEIGHTS.uniqueSources,
    how: 'Qué parte de los reportes viene de dispositivos distintos. Muchos reportes de pocos dispositivos pesan menos.',
    active: true,
  },
  {
    name: 'Persistencia',
    weight: SIGNAL_WEIGHTS.persistence,
    how: 'Si la desviación se mantiene en la ventana actual y en las dos anteriores, en vez de ser un pico aislado.',
    active: true,
  },
  {
    name: 'Dispersión geográfica',
    weight: SIGNAL_WEIGHTS.geoDispersion,
    how: 'En cuántos estados distintos hay reportes. Un solo estado puede ser una falla regional legítima, así que no se descarta.',
    active: true,
  },
  {
    name: 'Mediciones técnicas',
    weight: SIGNAL_WEIGHTS.technical,
    how: 'Comprobaciones automáticas de disponibilidad. Todavía no están activas.',
    active: false,
  },
  {
    name: 'Confirmación oficial',
    weight: SIGNAL_WEIGHTS.official,
    how: 'Un comunicado del proveedor verificado por una persona en las últimas 24 horas. Aún no hay forma de registrarlos (llegará con el panel de administración).',
    active: false,
  },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-20" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`} className="font-display text-xl font-semibold">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-ink-muted">{children}</div>
    </section>
  );
}

export default function MethodologyPage() {
  const reliabilityRows = RELIABILITY_BANDS.map((b, i) => ({
    range: i === 0 ? `menos de ${b.belowSamples}` : `${RELIABILITY_BANDS[i - 1].belowSamples} a ${b.belowSamples - 1}`,
    factor: b.factor,
  }));
  reliabilityRows.push({
    range: `${RELIABILITY_BANDS[RELIABILITY_BANDS.length - 1].belowSamples} o más`,
    factor: RELIABILITY_FULL,
  });
  const bandRows = STATUS_BANDS.map((b, i) => ({
    range: `${i === 0 ? 0 : STATUS_BANDS[i - 1].max + 1}–${b.max}`,
    label: STATUS_LABELS_ES[b.status],
  }));

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Metodología: cómo detectamos fallas
      </h1>
      <p className="mt-3 text-ink-muted">
        PulsoVE es una plataforma independiente: no está afiliada a ninguna de las empresas que monitorea y ninguna
        puede pagar para ocultar reportes, cambiar su estado ni borrar incidentes. Esta página explica, con los
        parámetros que usa hoy el sistema, cómo se pasa de reportes ciudadanos a un estado. Cuando algo todavía no
        funciona, lo decimos.
      </p>

      <nav aria-label="En esta página" className="mt-6 rounded-lg border border-border p-4 text-sm">
        <ol className="grid gap-1 sm:grid-cols-2">
          {[
            ['datos', '1. De dónde salen los datos'],
            ['calculo', '2. Cómo se calcula'],
            ['estados', '3. Qué significa cada estado'],
            ['incidentes', '4. Cuándo se abre un incidente'],
            ['privacidad', '5. Privacidad'],
            ['limitaciones', '6. Limitaciones actuales'],
          ].map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Section id="datos" title="1. De dónde salen los datos">
        <p>
          De <strong className="text-ink">reportes ciudadanos anónimos</strong>. Quien reporta indica el tipo de
          problema y el estado del país; puede añadir, si quiere, la ciudad, la operadora de su conexión y un
          comentario breve. No pedimos nombre, cédula, teléfono, dirección ni datos bancarios.
        </p>
        <p>
          Las mediciones técnicas automáticas y las confirmaciones oficiales de los proveedores están previstas, pero{' '}
          <strong className="text-ink">todavía no están activas</strong>. Hoy el resultado depende solo de los
          reportes.
        </p>
      </Section>

      <Section id="calculo" title="2. Cómo se calcula">
        <p>
          Cada {DEFAULT_WINDOW_MINUTES} minutos se cuentan los reportes de cada servicio en esa ventana. No se
          comparan con un umbral fijo, sino con el comportamiento <strong className="text-ink">habitual</strong> de
          ese servicio en ese mismo día de la semana y hora (hora de Caracas): la{' '}
          <strong className="text-ink">línea base</strong>, calculada con la mediana y la desviación absoluta
          mediana de los últimos {BASELINE_LOOKBACK_DAYS} días. Son medidas robustas: un pico aislado no la
          deforma.
        </p>
        <p>Con eso se calculan seis señales, de 0 a 100, que se combinan con estos pesos:</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-border text-ink">
              <tr>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Señal
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Peso
                </th>
                <th scope="col" className="py-2 font-medium">
                  Qué mide
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SIGNALS.map((s) => (
                <tr key={s.name} className="align-top">
                  <td className="py-2 pr-3 text-ink">
                    {s.name}
                    {!s.active && <span className="block text-xs text-ink-muted">(no activa)</span>}
                  </td>
                  <td className="py-2 pr-3 font-mono tabular-nums">{pct(s.weight)}</td>
                  <td className="py-2">{s.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Una señal sin datos <strong className="text-ink">no cuenta como cero</strong>: se excluye y el resto se
          reparte su peso. Un cero diría «todo normal», cuando en realidad significa «sin evidencia».
        </p>
        <p>
          El resultado se multiplica por un <strong className="text-ink">factor de confiabilidad</strong> según
          cuánta historia tiene la línea base de esa franja, porque con pocos datos un desvío «extremo» puede ser solo
          que el sistema es nuevo:
        </p>
        <table className="text-sm">
          <thead className="border-b border-border text-ink">
            <tr>
              <th scope="col" className="py-1.5 pr-6 text-left font-medium">
                Ventanas en la línea base
              </th>
              <th scope="col" className="py-1.5 text-left font-medium">
                Factor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reliabilityRows.map((r) => (
              <tr key={r.range}>
                <td className="py-1.5 pr-6">{r.range}</td>
                <td className="py-1.5 font-mono tabular-nums">{r.factor.toLocaleString('es-VE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Así se obtiene la <strong className="text-ink">confianza</strong> (0–100) que ves en cada servicio.
        </p>
      </Section>

      <Section id="estados" title="3. Qué significa cada estado">
        <table className="text-sm">
          <thead className="border-b border-border text-ink">
            <tr>
              <th scope="col" className="py-1.5 pr-6 text-left font-medium">
                Confianza
              </th>
              <th scope="col" className="py-1.5 text-left font-medium">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bandRows.map((b) => (
              <tr key={b.range}>
                <td className="py-1.5 pr-6 font-mono tabular-nums">{b.range}</td>
                <td className="py-1.5">{b.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Si la línea base de esa franja tiene menos de {MIN_BASELINE_SAMPLES_FOR_STATUS} ventanas, o si el servicio
          aún no tiene reportes, se muestra <strong className="text-ink">«{STATUS_LABELS_ES.insufficient_data}»</strong>{' '}
          — nunca «normal» por defecto. En los listados (inicio, directorio, categorías) el estado solo cambia cuando
          hay un incidente abierto.
        </p>
        <p>
          El lenguaje es prudente a propósito: «posible», «detectada». Una detección estadística no es una
          confirmación del proveedor.
        </p>
      </Section>

      <Section id="incidentes" title="4. Cuándo se abre un incidente">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Se abre cuando la confianza llega a <strong className="text-ink">{INCIDENT_RULES.openConfidence}</strong>{' '}
            o más durante al menos {INCIDENT_RULES.minConsecutiveWindows} ventanas seguidas y con al menos{' '}
            {INCIDENT_RULES.minUniqueReporters} reportantes distintos: un solo dispositivo no puede abrirlo.
          </li>
          <li>
            Empieza como «posible interrupción»; pasa a «detectada» desde {INCIDENT_RULES.detectedFrom} y a «alta
            confianza» desde {INCIDENT_RULES.highConfidenceFrom}.
          </li>
          <li>
            Si la confianza baja de {INCIDENT_RULES.closeConfidence}, queda «en recuperación»; se resuelve cuando se
            mantiene por debajo durante {INCIDENT_RULES.minConsecutiveWindows} ventanas seguidas. El margen entre
            abrir ({INCIDENT_RULES.openConfidence}) y cerrar ({INCIDENT_RULES.closeConfidence}) evita que un incidente
            parpadee.
          </li>
        </ul>
        {isRouteAvailable(ROUTE.incidents) && (
          <p>
            Puedes ver los activos y los resueltos recientes en{' '}
            <Link href={ROUTE.incidents.href} className="underline underline-offset-2 hover:text-ink">
              Incidentes
            </Link>
            .
          </p>
        )}
      </Section>

      <Section id="privacidad" title="5. Privacidad">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            No se guarda ninguna dirección IP completa. Se trunca (a /24 en IPv4 y /48 en IPv6) y solo se conserva un
            hash con clave secreta, que sirve para detectar abusos sin identificar a nadie.
          </li>
          <li>
            Tu dispositivo genera un identificador aleatorio; tampoco se guarda tal cual, solo su hash. Con él se
            limita a {REPORT_RATE_LIMIT.max} reportes cada{' '}
            {REPORT_RATE_LIMIT.windowSeconds % 3600 === 0
              ? `${REPORT_RATE_LIMIT.windowSeconds / 3600} h`
              : `${Math.round(REPORT_RATE_LIMIT.windowSeconds / 60)} min`}{' '}
            por dispositivo.
          </li>
          <li>
            La ubicación es solo el estado (y la ciudad, si la escribes). Nunca coordenadas. Las cifras por región
            se muestran siempre agregadas, nunca como reportes individuales.
          </li>
        </ul>
      </Section>

      <Section id="limitaciones" title="6. Limitaciones actuales">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Los servicios del catálogo están marcados como <strong className="text-ink">datos demostrativos</strong>:
            aún no reflejan incidentes reales.
          </li>
          <li>Las mediciones técnicas y las confirmaciones oficiales no están activas (sección 1).</li>
          <li>
            Los pesos, umbrales y bandas son un punto de partida razonado, todavía no calibrado con tráfico real. Si
            cambian, esta página se actualiza sola: muestra los valores que usa el sistema.
          </li>
          <li>La ubicación no baja de estado: los municipios aún no están cargados.</li>
          <li>La detección de campañas coordinadas de reportes falsos llegará en una etapa posterior.</li>
        </ul>
      </Section>
    </article>
  );
}
