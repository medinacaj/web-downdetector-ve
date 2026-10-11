# PulsoVE

Plataforma independiente de monitoreo ciudadano y técnico del estado de
servicios en Venezuela: telecomunicaciones, banca y pagos, servicios públicos,
plataformas digitales, streaming, videojuegos, delivery y movilidad, y
apuestas y loterías. No es una copia de Downdetector ni de ninguna plataforma
existente: identidad visual, arquitectura, código y metodología propios.

**Estado actual del proyecto: Etapa 4c de 10 — inicio + directorio +
página de servicio con reporte funcional.**
Ver `docs/00-PLAN-MAESTRO.md` para la evaluación completa, la arquitectura y
el plan de etapas. Ya se puede reportar una falla desde la interfaz, de
verdad — no solo vía la API. Falta: mapa, incidentes, estadísticas,
metodología, y el gráfico de la página de servicio.

**Todavía no está listo para publicarse.** Ya hay `robots.txt`, `sitemap.xml`
y política de indexación: **noindex global** mientras los datos sean
demostrativos (decisión del 2026-10-11; se abre con `SITE_INDEXING="true"`).
Faltan el dominio, canonical, Open Graph, favicon y datos estructurados, y
actualizar `next` (vulnerabilidades de producción, ver "Seguridad"). Ver
`docs/SEO-PENDIENTE.md`.

## Qué existe hoy

- Esquema completo de base de datos (17 tablas) en Drizzle ORM, con
  migraciones generadas y verificadas contra PostgreSQL 16 real (incluida
  una segunda migración aditiva: `reports.network_carrier`).
- Datos semilla verificados: 24 estados (códigos ISO 3166-2:VE reales), 8
  categorías, 25 tipos de problema y 71 servicios de demostración: los 16
  de la sección 4.2 del brief, Cashea y el resto del catálogo ampliado
  (más bancos y billeteras, portales públicos, redes, streaming,
  videojuegos, delivery y movilidad, apuestas y loterías), cada uno con
  evidencia pública fechada en `docs/CATALOGO-SERVICIOS.md`. Todo marcado
  `is_demo: true`; ningún dato inventado (URLs oficiales, cobertura,
  estadísticas — ver sección "Datos de demostración" más abajo).
- **API pública real y probada**: 9 endpoints (ver tabla abajo), con
  validación (zod), rate limiting por identidad anónima (Redis opcional /
  memoria), hash de privacidad (identidad anónima + IP truncada), sobre de
  respuesta consistente y manejo de errores que nunca filtra detalles
  internos.
- **Motor de agregación, línea base y detección de anomalías**
  (`npm run aggregate:run`): ventanas configurables, mediana+MAD robusta
  por servicio×estado×día/hora (America/Caracas), puntuación ponderada
  (sección 9.4 del brief) con factor de confiabilidad según cuánta
  historia real existe, y ciclo de vida completo de incidentes
  (abre/escala/recupera/resuelve con persistencia mínima). Verificado de
  extremo a extremo con tráfico sintético — no solo que compila: se
  confirmó un incidente real abriéndose, escalando y resolviéndose, visto
  tanto en la base de datos como a través de la API pública.
- Configuración de proyecto (Next.js 16, Tailwind, TypeScript, Vitest) y
  variables de entorno documentadas con valores por defecto seguros.
- 76 pruebas automatizadas (datos semilla y calidad del catálogo, registro
  de rutas de navegación, configuración SEO e indexación (robots, sitemap), privacidad, bandas de estado, integración real de
  `POST /api/reports`, estadística robusta del motor, combinación ponderada
  de señales).
- **Página de inicio real** (`/`): buscador, panel de "pulso nacional" con
  datos en vivo, incidentes activos, servicios, metodología resumida.
  Header, footer, modo oscuro con selector y tipografía (Space Grotesk +
  Inter + JetBrains Mono) ya están en su lugar para el resto del sitio.
- **Directorio de servicios real** (`/servicios`): búsqueda, filtro por
  categoría y estado, tres órdenes, vista tarjetas/lista — todo vía
  formulario GET, sin depender de JavaScript para funcionar.
- **Página de servicio con reporte funcional** (`/servicios/:slug`):
  estado real, confianza, desglose de problemas, actividad geográfica,
  incidentes recientes — y un formulario de reporte que de verdad
  funciona (sin Turnstile ni geolocalización todavía, eso es la Etapa 5).

## Endpoints disponibles

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/services` | Lista servicios activos (filtros: `category`, `q`; paginación `limit`/`offset`) |
| GET | `/api/services/:slug` | Detalle de un servicio |
| GET | `/api/services/:slug/status` | Estado operativo derivado en vivo de incidentes/ventanas agregadas (sin actividad aún: `insufficient_data`, nunca "normal" por defecto) |
| GET | `/api/services/:slug/reports` | Reportes recientes, solo campos no identificantes |
| GET | `/api/services/:slug/incidents` | Incidentes de ese servicio |
| GET | `/api/incidents` | Incidentes globales (filtros: `service`, `category`, `status`) |
| GET | `/api/map` | Reportes agregados por estado (24 estados, nunca ubicaciones individuales) |
| GET | `/api/statistics` | Métricas realmente calculables hoy; lo que depende del motor se declara en `meta.pendingMetrics`, no se inventa |
| POST | `/api/reports` | Crea un reporte — ver payload abajo |

`POST /api/reports` espera:
```json
{
  "serviceSlug": "cantv",
  "issueTypeSlug": "sin-conexion",
  "stateCode": "VE-A",
  "cityText": "Chacao",
  "networkCarrier": "CANTV ABA",
  "comment": "Sin servicio desde hace 20 minutos",
  "deviceSeed": "identificador-anónimo-generado-por-el-cliente"
}
```
`cityText`, `networkCarrier` y `comment` son opcionales. Límite: 5 reportes
por `deviceSeed` por hora (configurable vía `RATE_LIMIT_REPORTS_*`).

## El motor de anomalías

```bash
npm run aggregate:run -- --window=15 --at=2026-10-01T13:00:00Z
```
Agrega la ventana indicada (todos los servicios activos), recalcula líneas
base, puntúa anomalías y actualiza incidentes. Sin `--at`, usa el momento
actual; sin `--window`, 15 minutos. Pensado para correr periódicamente
(cron externo) — este proyecto no incluye scheduler propio todavía.

Para ver el ciclo completo (línea base → anomalía → incidente → resolución)
sin esperar tráfico real:
```bash
npm run dev:synthetic-traffic              # genera historial + pico contra un servicio de prueba dedicado
npm run aggregate:run -- --at=<ventana>    # correr para cada ventana que indique la salida del comando anterior
npm run dev:synthetic-traffic -- --cleanup # elimina el servicio de prueba y todos sus datos derivados
```
El servicio de prueba (`Servicio de Prueba (Motor)`) nunca es uno del
catálogo real — existe solo para ejercitar el motor (brief, sección 28).

## Qué NO existe todavía

Del frontend: el gráfico principal de la página de servicio (`recharts`
ya instalado, sin usar), mapa nacional (cartograma — los datos
`grid_row`/`grid_col` ya existen desde la Etapa 1), página de incidentes
global, estadísticas, metodología completa. El formulario de reporte
funciona pero sin Turnstile ni geolocalización (Etapa 5).

SEO técnico: dominio (aún no existe), canonical, Open Graph, favicon,
datos estructurados, 404 propia y páginas de categoría
(`docs/SEO-PENDIENTE.md`).

Panel administrativo, autenticación, tiempo real, mediciones técnicas
activas (sección 10 del brief), moderación — Etapas 5 en adelante. Las
carpetas para esto ya están planificadas en `src/app` pero sin
implementar.

## Requisitos

- Node.js 22+ (probado con 22.22.2)
- PostgreSQL 16+ (usa `gen_random_uuid()` nativo; no requiere pgcrypto)
- Redis (opcional — sin él, rate limiting y tiempo real degradan a una
  implementación en memoria válida para una sola instancia)

## Instalación

Atajo (Linux con PostgreSQL 16 instalado): `bash scripts/dev-bootstrap.sh` deja
todo listo desde cero —dependencias, Postgres local, `.env` con secretos
nuevos, rol y base, migraciones y semillas— y es idempotente. Paso a paso:

```bash
npm install
cp .env.example .env
# Edita .env: como mínimo, DATABASE_URL debe apuntar a un Postgres real.

npm run db:generate        # (ya generado; solo necesario si editas schema.ts)
npm run db:migrate:deploy  # aplica drizzle/0000_*.sql y 0001_add_network_carrier.sql
npm run db:seed            # carga categorías, estados, tipos y servicios (idempotente)
npm run typecheck
npm test
```

> **Nota sobre `db:migrate:deploy`:** en el sandbox de desarrollo donde se
> construyó este proyecto, `drizzle-kit migrate` se quedó colgado en su
> spinner interactivo (entorno no-TTY). Ambas migraciones se validaron
> aplicándolas directamente con `psql -f drizzle/000X_*.sql` contra un
> Postgres 16 real. En una terminal normal o en CI, `drizzle-kit migrate`
> debería funcionar sin problema; si no, usa `psql -f` como alternativa
> confiable.

`npm run dev` ya responde de verdad: abre `http://localhost:3000` (inicio,
`/servicios`, `/servicios/:slug`) o prueba `curl http://localhost:3000/api/services`.

## Trabajar con Claude Code

El proyecto está preparado para Claude Code: `CLAUDE.md` (acuerdo de trabajo,
reglas innegociables, comandos, mapa del código, trampas y hoja de ruta; importa
`AGENTS.md`, el aviso de Next 16 que regenera `next dev`) y
`.claude/rules/seo-tecnico.md` (reglas permanentes de SEO técnico e
indexación, que se cargan al tocar `src/app`, `src/components`, `next.config.mjs`
o `public`). Para empezar: `bash scripts/dev-bootstrap.sh` y luego `claude` en
esta carpeta. Cómo llegó aquí el proyecto, qué falta resolver y qué se verificó:
`docs/MIGRACION-CLAUDE-CODE.md`.

## Scripts disponibles

| Script | Qué hace |
|---|---|
| `npm run dev` / `build` / `start` | Next.js (inicio, directorio, página de servicio y API reales). `build` necesita acceso a Google Fonts |
| `bash scripts/dev-bootstrap.sh` | Entorno de desarrollo desde cero (ver "Instalación"); idempotente, nunca toca un `.env` existente |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:watch` | Vitest (76 pruebas; las de integración de reportes requieren Postgres real) |
| `npm run db:generate` | Genera migración SQL a partir de `schema.ts` |
| `npm run db:migrate` | `drizzle-kit push` (sincroniza esquema directo, sin historial — útil en dev) |
| `npm run db:migrate:deploy` | Aplica las migraciones versionadas de `drizzle/` |
| `npm run db:seed` | Carga los datos semilla (idempotente): sincroniza categorías y tipos de problema; inserta los estados y servicios que falten |
| `npm run db:studio` | Explorador visual de la base de datos |
| `npm run create-admin` | **Pendiente de implementar** (Etapa 6 — panel admin) |
| `npm run aggregate:run -- [--window=N] [--at=ISO]` | Un ciclo del motor: agregación + línea base + anomalías + incidentes |
| `npm run dev:synthetic-traffic -- [--cleanup]` | Genera/limpia tráfico sintético para probar el motor (ver sección dedicada) |

## Variables de entorno

Ver `.env.example` — cada variable tiene un comentario explicando su
propósito y, cuando aplica, por qué su valor por defecto es conservador
(`ENABLE_TURNSTILE=false`, `ENABLE_TECHNICAL_CHECKS=false`: no se ejecutan
sondeos ni verificaciones anti-abuso reales contra terceros hasta que se
configuren credenciales explícitamente). Esta etapa añadió
`RATE_LIMIT_REPORTS_MAX` y `RATE_LIMIT_REPORTS_WINDOW_SECONDS`.

`SITE_URL` (origen canónico, sin barra final) y `SITE_INDEXING` (`"false"`
por defecto = noindex global y sitemap vacío; `"true"` solo surte efecto con
un `SITE_URL` público en `https`). Se leen al arrancar el servidor.

## Seguridad — hallazgos de esta etapa

`npm audit` encontró y se corrigieron dos vulnerabilidades de severidad alta
en dependencias de **producción** (Etapa 1):

- `drizzle-orm` < 0.45.2 — inyección SQL vía identificadores mal escapados
  (GHSA-gpj5-g38j-94v9). Corregido → `^0.45.2`.
- `next` 14.2.15 — múltiples CVE (DoS, SSRF, envenenamiento de caché).
  Corregido → `^16.3.0` (junto con `react`/`react-dom` → `^19.2.8`, requerido
  por Next 16).

Esta etapa añadió `ioredis` (dependencia real: `rate-limit.ts` la importaba
dinámicamente pero no estaba instalada) sin introducir vulnerabilidades
nuevas — sigue en 9, todas confinadas a dev-tooling (`vitest`/`vite`/
`esbuild`), documentado en la Etapa 1. También se corrigió que un error
interno (p. ej. Postgres caído) filtraba el stack trace completo, incluida
la consulta SQL, en la respuesta HTTP — ahora todas las rutas devuelven un
`internal_error` genérico y registran el detalle solo en el log del
servidor.

> **Actualización 2026-10-11:** `npm audit` informa hoy **20** vulnerabilidades,
> y **3 están en dependencias de producción**: `next` 16.0.0–16.3.7 (crítica:
> varias ejecuciones remotas de código y envenenamiento de caché), `sharp`
> (alta) y `source-map-js` (alta). Todas tienen arreglo disponible y no se han
> aplicado todavía: hay que actualizar antes de publicar. El párrafo siguiente
> describe la situación de etapas anteriores.

Quedaban 9 vulnerabilidades de severidad moderada/alta/crítica, **todas
confinadas a herramientas de desarrollo** (`vitest`/`vite`/`esbuild` vía la
cadena de `drizzle-kit` y `@vitest/ui`) — no se ejecutan en producción, solo
al correr pruebas o el explorador visual de base de datos en local. Requieren
subir `vitest` de la serie 2.x a la 4.x, un salto mayor que no se hizo aquí
para no introducir cambios de configuración de pruebas sin poder verificarlos
contra una suite más amplia. Recomendado para la Etapa 10 (pruebas/CI), no
bloqueante hoy.

## Datos de demostración

Todo servicio sembrado tiene `is_demo = true` y `official_url = null`. El
brief prohíbe explícitamente inventar URLs oficiales, cobertura,
disponibilidad o estadísticas de las empresas listadas — así que aunque
varias tienen dominios públicos bien conocidos, este proyecto no los afirma
como verificados hasta que alguien los confirme contra la fuente oficial
antes de cualquier despliegue con datos reales (sección 4.2 del brief).

## Limitaciones documentadas

- El cartograma de Venezuela usa una cuadrícula esquemática
  (`states.grid_row` / `grid_col`), no geometría real. Es una primera
  aproximación por adyacencia relativa — conviene ajustarla visualmente al
  construir el mapa (Etapa 4), no tratarla como definitiva.
- Los municipios (`municipalities`) no están sembrados: Venezuela tiene
  ~335, y poblar esa lista de memoria arriesgaba justo lo que el brief pide
  evitar (datos no verificados). Requiere una fuente oficial verificada
  (ver sección 4.2) antes de cargarse.
- Los pesos del motor de anomalías (sección 9.4 del brief) viven en
  variables de entorno (`WEIGHT_*` en `.env.example`), no en una tabla
  editable desde el panel admin. Es una decisión ya tomada en una sesión
  anterior de este proyecto; el brief también quería que el admin pudiera
  "modificar parámetros del motor de detección" desde la UI (sección 8), lo
  que una variable de entorno no permite sin redeploy. Es una tensión real,
  no resuelta aquí — ver docs/00-PLAN-MAESTRO.md.
- El rate limiting en memoria (sin `REDIS_URL`) vive en el proceso: se
  reinicia si el servidor se reinicia, y no se comparte entre varias
  instancias. Válido para desarrollo o una sola instancia en producción;
  configura `REDIS_URL` antes de escalar horizontalmente.
- Las pruebas de integración de `POST /api/reports` corren contra la misma
  base de datos de desarrollo, no una base de datos de prueba aislada —
  insertan filas reales. Una BD de prueba dedicada (con su propio ciclo de
  migración) es trabajo de la Etapa 10 (CI).
- Los umbrales del motor (bandas de z-score, ventanas mínimas de
  persistencia, `INCIDENT_OPEN_CONFIDENCE`/`CLOSE_CONFIDENCE`) son puntos
  de partida razonables, verificados con tráfico sintético — no calibrados
  contra tráfico real. Ajustarlos con datos reales es trabajo continuo, no
  un "hecho una vez" de esta etapa.
- El componente técnico (10%) y de confirmación oficial (5%) del score de
  anomalía siempre se excluyen hoy (sin fuente de datos real para
  mediciones técnicas ni comunicados verificados) — el motor renormaliza
  el resto de las señales en vez de contar esto como "normal confirmado".
  Deja de ser cierto en cuanto existan mediciones técnicas reales (sección
  10 del brief, sin implementar) o el panel admin (Etapa 6) cargue
  comunicados oficiales.
- El Postgres de este sandbox de desarrollo resultó inestable durante la
  sesión (se detuvo por sí solo más de una vez, incluso a mitad de una
  corrida de pruebas) — no es un problema de PulsoVE ni algo que deba
  reproducirse en un entorno real, pero explica por qué el README insiste
  en comprobar `service postgresql status` antes de cada bloque de
  comandos.
- `next/font/google` (Space Grotesk, Inter, JetBrains Mono) necesita
  alcanzar `fonts.googleapis.com`/`fonts.gstatic.com` en build time. En un
  entorno con egreso de red restringido (como el sandbox donde se
  construyó esto), `npm run build` falla con "Failed to fetch ... from
  Google Fonts"; `npm run dev` en cambio degrada con una fuente de
  respaldo sin romperse. En Vercel, GitHub Actions o cualquier máquina con
  acceso normal a internet, `npm run build` compila sin cambios — se
  verificó aislando el problema (build limpio sin next/font) para
  confirmar que no hay ningún otro error oculto detrás.

## Documentación

- `docs/00-PLAN-MAESTRO.md` — evaluación, arquitectura, plan de etapas,
  estructura del repositorio, registro de cambios por etapa.
- `docs/CATALOGO-SERVICIOS.md` — qué servicios monitorea PulsoVE, criterio de
  inclusión, fuente y fecha de cada uno, exclusiones, cautelas (apuestas y
  loterías, bloqueos de plataformas) y cómo añadir o retirar servicios.
- `docs/SEO-PENDIENTE.md` — auditoría de SEO técnico e indexación, problemas
  detectados por prioridad, decisión de indexación pendiente y pasos de Google
  Search Console para la persona propietaria.
- `docs/MIGRACION-CLAUDE-CODE.md` — migración del chat a este repositorio, cómo
  abrirlo en Claude Code, pregunta abierta sobre una versión más avanzada y qué
  se verificó.
- `CLAUDE.md` y `.claude/rules/` — instrucciones para Claude Code.
