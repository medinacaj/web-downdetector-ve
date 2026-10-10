# PulsoVE — Plan maestro

> Documento vivo. Se actualiza al cierre de cada etapa (ver "Registro de
> cambios" al final). No repite decisiones ya tomadas en etapas anteriores;
> las referencia.

## Parte 1 — Evaluación del proyecto

### Interpretación

PulsoVE es una plataforma independiente (identidad, arquitectura y código
propios — no una réplica de Downdetector ni de ninguna otra plataforma) de
monitoreo ciudadano y técnico para 8 categorías de servicios en Venezuela
(telecomunicaciones, banca y pagos, servicios públicos, plataformas
digitales y, añadidas después, streaming, videojuegos, delivery y movilidad,
apuestas y loterías; ver `docs/CATALOGO-SERVICIOS.md`). Combina reportes ciudadanos anónimos, mediciones técnicas
automáticas y un motor estadístico explicable (no una caja negra ni un
LLM) para responder, con lenguaje prudente y nunca categórico, si un
servicio presenta una falla general, regional o limitada al usuario.

### Alcance confirmado

El MVP obligatorio es la lista de 20 puntos de la sección 25 del brief. Las
fases 2–4 (RIPE Atlas, app móvil, clasificación con IA, predicción) quedan
explícitamente fuera de alcance ahora.

### Riesgos identificados

- **Volumen**: el brief completo equivale a varias semanas de un equipo
  senior. No es honesto simular una entrega íntegra con calidad real en una
  sola sesión — se ejecuta por etapas, como el propio brief autoriza en su
  cierre ("puede... dividirse por etapas").
- **Entorno con estado real, no vacío**: este chat corre sobre un
  contenedor que en teoría se reinicia entre tareas, pero en la práctica
  esta sesión encontró un proyecto de 5 días de antigüedad ya en curso.
  Cualquier etapa futura debe volver a auditar el estado real
  (`find`, lectura de archivos) antes de escribir, en vez de asumir un
  punto de partida — exactamente el principio que este proyecto ya se
  había fijado y que esta sesión estuvo a punto de saltarse.
- **Sin tráfico real**, la línea base y el motor de anomalías (Etapa 3)
  operarán sobre datos sintéticos al principio — cualquier "detección" en
  el entorno demo es ilustrativa, no una medición real de la red
  venezolana.
- **Geografía**: el cartograma usa una cuadrícula esquemática, no
  geometría real (ver limitación documentada en README). Migrar a
  MapLibre + GeoJSON real es una mejora de fase posterior, no un bloqueo.
- **Calibración anti-abuso** (sección 11) requiere tráfico real; los
  umbrales iniciales serán valores de partida razonables, no óptimos.
- **Cumplimiento legal** (retención de datos, privacidad) requiere revisión
  profesional en la jurisdicción aplicable — no se afirma cumplimiento
  legal absoluto en ningún documento de este proyecto.

### Supuestos

- Se mantienen las decisiones de arquitectura ya tomadas en la sesión
  anterior de este proyecto (no se re-litigan): Drizzle ORM (no Prisma),
  Next.js API Routes (no NestJS), cartograma de cuadrícula propio (no
  MapLibre por ahora), autenticación admin propia con JWT + bcrypt (no
  NextAuth/Clerk), Redis opcional con fallback en memoria, pesos del motor
  vía variables de entorno.
- Los servicios semilla (17: los 16 originales de la sección 4.2 más
  Cashea, agregada después y verificada antes de incluirla) y los 24
  estados son datos estructurales verificables (nombres/códigos ISO
  3166-2:VE) — se cargan con confianza. URLs oficiales, logotipos y
  estadísticas de estos servicios NO se cargan sin verificación humana
  contra la fuente oficial.

### Decisiones (ambigüedades resueltas esta etapa)

1. **`checkTypeEnum` ampliado** con `https`, `traceroute`, `api` — el
   esquema existente solo tenía `http/dns/ping/tls`; la sección 10 del
   brief pide explícitamente los tres que faltaban.
2. **Índice `(status, started_at)` en `incidents`** añadido — el único
   índice existente antepone `service_id`, lo que no sirve bien a
   `GET /api/incidents` (todos los servicios, filtrado por estado).
3. **Referencia residual a `@prisma/client`** eliminada de
   `next.config.mjs` (`serverComponentsExternalPackages`) — Prisma no es
   dependencia del proyecto desde el cambio a Drizzle; era un remanente sin
   efecto salvo confundir a quien lea el archivo.
4. **`drizzle.config.ts` creado** — no existía. Sin él, ninguno de los
   scripts `db:generate` / `db:migrate` / `db:migrate:deploy` / `db:studio`
   ya definidos en `package.json` podía ejecutarse.
5. **`db:seed` reapuntado** de `prisma/seed.ts` (nunca existió; residuo de
   antes del cambio a Drizzle) a `scripts/seed.ts` (creado), consistente
   con la convención ya establecida de que `scripts/` aloja operaciones
   puntuales (`create-admin.ts`, `aggregate-cron.ts`, ambos aún
   pendientes). Se eliminó la carpeta `prisma/` (vacía, sin más
   referencias).
6. **`?schema=public` eliminado de `DATABASE_URL`** en `.env` y
   `.env.example` — es una convención de Prisma que `postgres.js` (el
   driver que usa el adaptador `drizzle-orm/postgres-js`) no reconoce y que
   Postgres rechaza como parámetro de sesión inválido. Bug real,
   descubierto al ejecutar el seed por primera vez, no al leer el código.
7. **Dependencias con CVE de severidad alta actualizadas**: `drizzle-orm`
   (inyección SQL, GHSA-gpj5-g38j-94v9) y `next` + `react`/`react-dom`
   (múltiples CVE). Ver detalle en README → Seguridad. Se hizo ahora porque
   `src/app` está vacío: es el punto más barato del proyecto para absorber
   un salto de versión mayor.

## Parte 2 — Arquitectura

### Componentes

Web pública · API (Next.js Route Handlers) · Autenticación admin/moderador
(JWT + bcrypt, cookie de sesión) · Reportes · Servicios/Categorías ·
Incidentes · Motor de análisis (baseline + anomalías) · Mediciones técnicas
· Mapa · Notificaciones (Fase 2) · Moderación · Administración · Auditoría
· Estadísticas · Tareas programadas · Seguridad (transversal).

### Flujo principal

```
Usuario (anónimo o registrado)
   │
   ▼
Frontend Next.js (App Router)
   │
   ▼
API Routes (/api/reports, /api/services, ...)
   │
   ├─► Turnstile (si ENABLE_TURNSTILE=true) + rate limit (Redis o memoria)
   │   + validación zod + sanitización
   │
   ▼
Puntuación inicial de confianza (heurística, sección 11.2 del brief)
   │
   ▼
PostgreSQL (Drizzle) — tabla reports
   │
   ▼
Worker de agregación (aggregate:run — pendiente, Etapa 3)
   │   ventanas: 5m / 15m / 30m / 60m / 6h / 24h, huso America/Caracas
   ▼
aggregated_windows ──► Motor de anomalías (mediana robusta + MAD/z-score)
   │
   ▼
Motor de incidentes (apertura/cierre con persistencia mínima)
   │
   ▼
incidents + incident_regions + services.status (a añadir: Etapa 3)
   │
   ├─► API pública de lectura (cache-control + Redis opcional)
   ├─► Canal tiempo real: SSE (Etapa 8)
   └─► Notificaciones (Fase 2, fuera del MVP obligatorio)
```

### Stack — tabla de reconciliación

| Componente | Sugerido en el brief | Decisión (ya tomada, se mantiene) | Motivo |
|---|---|---|---|
| Backend | Next.js API o NestJS | Next.js API Routes | Un solo despliegue, menor superficie operativa para el volumen del MVP |
| ORM | Prisma | Drizzle ORM | Prisma requiere binario nativo incompatible con las restricciones de sandbox de desarrollo; Drizzle es SQL-first, sin binario, migraciones como SQL plano auditable |
| Mapas | MapLibre + GeoJSON real | Cuadrícula esquemática propia (`grid_row`/`grid_col`) | Evita dependencia de fuente de tiles/licenciamiento mientras se valida la fuente geográfica oficial; `geometry` (jsonb) queda reservado para GeoJSON real sin requerir migración futura |
| Auth admin | No especificado | JWT + bcrypt, cookie httpOnly | Ya implementado en las dependencias existentes; sin dependencia de proveedor externo |
| Tiempo real | WebSockets / SSE / Supabase Realtime | SSE | Unidireccional servidor→cliente basta para este caso de uso; más simple de operar sobre HTTP estándar, con reconexión nativa del navegador |
| Rate limit / caché | Redis | Redis opcional, fallback en memoria | Permite arrancar sin infraestructura adicional; documentado como válido solo para una instancia — reevaluar antes de escalar horizontalmente |

### Datos

Ver Parte 6 (en el propio `schema.ts`, que ya es la fuente de verdad) —
17 tablas, descritas con su propósito en los comentarios del archivo.

### Seguridad

CSP y demás cabeceras: pendiente (Etapa 2, capa API). CSRF: pendiente
(mismo). Sanitización de input: pendiente. Hashing de identidad anónima:
`ANONYMIZATION_SALT` ya reservado en `.env`, implementación en
`lib/privacy.ts` pendiente (Etapa 2/3). Principio de mínimo privilegio por
rol: `user_role` enum ya existe (`admin/moderator/user`). Secretos: todos
en variables de entorno, ninguno en el repositorio (ver `.gitignore`).

### Escalabilidad

Índices compuestos ya definidos para las consultas de mayor volumen
(reportes por servicio+fecha, ventanas por servicio+inicio, incidentes por
estado+inicio). Particionamiento de `reports`/`technical_checks`/
`audit_logs` por rango de fecha: evaluar solo si el volumen real lo exige,
no prematuramente. `postgres.js` con pool de hasta 10 conexiones en
producción — si se despliega en serverless/edge con alta concurrencia,
reevaluar `@neondatabase/serverless` o un pool externo (PgBouncer).

## Parte 3 — Plan de implementación

| Etapa | Contenido | Depende de | Estado |
|---|---|---|---|
| 1 | Fundación de datos: esquema, migración, seeds, config, pruebas de integridad de datos | — | **Completada** |
| 2 | API pública de lectura + `POST /api/reports` con validación/rate limiting básico | 1 | **Completada esta sesión** |
| 3 | Motor de agregación y anomalías (`aggregate:run`), apertura/cierre de incidentes | 2 | **Completada** |
| 4 | Frontend público: inicio, directorio, página de servicio, mapa, incidentes, estadísticas, metodología | 2, 3 | **En curso — 4a (layout + inicio), 4b (directorio) y 4c (página de servicio con reporte) completadas; 4d (gráfico histórico, mapa, incidentes, estadísticas, metodología) pendiente** |
| SEO | SEO técnico e indexación: dominio y `metadataBase`, `robots.ts`, `sitemap.ts`, canonical, Open Graph, favicon, datos estructurados y decisión de indexación. Regla permanente de la persona propietaria: forma parte de cada entrega web | 4a–4c | **Pendiente — ver `docs/SEO-PENDIENTE.md`** |
| 5 | Formulario de reporte conectado de extremo a extremo (UI + API + Turnstile + geolocalización aproximada) | 2, 4 | Pendiente |
| 6 | Panel administrativo (auth, CRUD servicios/categorías, incidentes, moderación, auditoría, `create-admin`) | 1–3 | Pendiente |
| 7 | Prevención de abuso avanzada: puntuación de confianza, detección de campañas coordinadas | 2, 3 | Pendiente |
| 8 | Tiempo real (SSE) con reconexión y degradación a polling | 2, 3 | Pendiente |
| 9 | Observabilidad: logs estructurados, página de salud del sistema | 2–8 | Pendiente |
| 10 | Pruebas de integración/e2e/carga, Docker, CI/CD, guías de seguridad/privacidad/despliegue, cierre de vulnerabilidades de dev-tooling | Todas | Pendiente |

## Parte 4 — Estructura del repositorio

Estado real a 2026-10-10 (repositorio `medinacaj/web-downdetector-ve`; la
plataforma se llama PulsoVE):

```
web-downdetector-ve/
├── AGENTS.md                     # aviso de Next 16; lo regenera `next dev`, no se edita a mano
├── CLAUDE.md                     # instrucciones para Claude Code (importa AGENTS.md)
├── README.md
├── .claude/
│   └── rules/
│       └── seo-tecnico.md        # reglas permanentes de SEO técnico e indexación (por rutas)
├── docs/
│   ├── 00-PLAN-MAESTRO.md
│   ├── CATALOGO-SERVICIOS.md     # criterio, fuentes y exclusiones del catálogo
│   ├── MIGRACION-CLAUDE-CODE.md
│   └── SEO-PENDIENTE.md
├── drizzle/                      # migraciones SQL versionadas
│   ├── 0000_jazzy_alex_power.sql
│   ├── 0001_add_network_carrier.sql
│   └── meta/                     # snapshots y _journal.json
├── scripts/
│   ├── aggregate-cron.ts         # npm run aggregate:run
│   ├── dev-bootstrap.sh          # entorno desde cero: deps, Postgres, .env, migraciones, semillas
│   ├── dev-synthetic-traffic.ts  # tráfico sintético para probar el motor
│   └── seed.ts                   # npm run db:seed
├── src/
│   ├── app/
│   │   ├── api/                  # 9 endpoints públicos
│   │   │   ├── incidents/route.ts
│   │   │   ├── map/route.ts
│   │   │   ├── reports/route.ts
│   │   │   ├── statistics/route.ts
│   │   │   └── services/
│   │   │       ├── route.ts
│   │   │       └── [slug]/       # route.ts + status/, reports/ e incidents/ (cada uno con route.ts)
│   │   ├── servicios/
│   │   │   ├── page.tsx          # directorio
│   │   │   └── [slug]/page.tsx   # página de servicio + formulario de reporte
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx              # inicio
│   ├── components/
│   │   ├── directory/            # ServiceGrid, ViewToggle
│   │   ├── layout/               # Header, Footer
│   │   ├── service/              # ReportForm
│   │   └── ui/                   # StatusBadge, ThemeToggle
│   └── lib/
│       ├── api/respond.ts        # sobre de respuesta { data, meta } / { error }
│       ├── db/                   # client.ts, schema.ts (17 tablas), seed-data/ (categorías, tipos de problema, estados, servicios)
│       ├── engine/               # aggregate, anomaly, baseline, incident-lifecycle, robust-stats, status-bands, time-bucket
│       ├── nav.ts                # registro de rutas: enlaces solo a páginas que existen
│       ├── privacy.ts
│       ├── queries/              # directory, home, service-detail, services, status
│       ├── security/             # rate-limit, sanitize
│       └── validation/reports.ts
├── tests/                        # 7 archivos de prueba + setup.ts; 66 pruebas
├── .env.example                  # .env no se versiona
├── .gitignore
├── drizzle.config.ts
├── next-env.d.ts
├── next.config.mjs
├── package.json / package-lock.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

Todavía no existen: contenido en `public/` (ni en `src/types/`; son carpetas
vacías que git no versiona), `src/app/{robots,sitemap,not-found}`, favicon e
imagen Open Graph (ver `docs/SEO-PENDIENTE.md`); las páginas de mapa,
incidentes, estadísticas y metodología (Etapa 4d); `src/app/admin` (Etapa 6).

---

## Registro de cambios

### Etapa 1 — 2026-08-15

**Contexto de la sesión**: se asumió inicialmente un sandbox vacío; un
`find` de rutina antes de escribir el primer archivo reveló un proyecto de
5 días de antigüedad ya en curso. Se detuvo la creación de archivos nuevos
y se auditó todo (`package.json`, `.env`, `schema.ts` de 352 líneas,
configuración de Tailwind/TypeScript/Vitest) antes de continuar — ver
Parte 1, "Riesgos".

**Entregado**:
- Esquema (`schema.ts`, preexistente) revisado por completo; 2 ajustes
  quirúrgicos (enum de tipos de chequeo, índice de incidentes) en vez de
  reescritura.
- `drizzle.config.ts` y `src/lib/db/client.ts` creados (faltaban).
- Migración generada (`drizzle-kit generate`) y **aplicada y verificada
  contra PostgreSQL 16 real** (17 tablas, FKs e índices confirmados con
  `\dt` y un JOIN real).
- Datos semilla (24 estados con códigos ISO 3166-2:VE verificados por
  fuente externa, 4 categorías, 13 tipos de problema, 16 servicios) creados
  y **cargados de verdad** contra esa base de datos; idempotencia
  confirmada ejecutando el seed dos veces.
- 9 pruebas automatizadas sobre la integridad de los datos semilla, todas
  pasando.
- 2 bugs reales encontrados y corregidos solo al ejecutar (no al leer
  código): `?schema=public` residual de Prisma rompía la conexión;
  arrays `as const` no tipaban contra `.values()` de Drizzle.
- 2 CVE de severidad alta en dependencias de producción corregidos
  (`drizzle-orm`, `next`/`react`/`react-dom`); 9 vulnerabilidades restantes
  documentadas como confinadas a dev-tooling, no bloqueantes.
- Limpieza: carpeta `prisma/` vacía eliminada, `db:seed` reapuntado,
  referencia residual a `@prisma/client` eliminada de `next.config.mjs`.
- `README.md` creado (no existía).

**Pendiente real** (sección 30, "no omitir"): todo lo que no está en "Qué
existe hoy" del README. Nada de eso se simuló ni se dejó como placeholder
— simplemente no se abordó todavía, y queda explícito en la Parte 3.

### Etapa 2 — 2026-08-16

**Contexto**: continuación directa de la Etapa 1 en el mismo proyecto.
Auditoría inicial reveló que `src/app` tenía un esqueleto de *carpetas* más
completo de lo documentado en la Etapa 1 (esa auditoría solo había
verificado ausencia de *archivos*) — no cambió nada de lo hecho, pero las
rutas de esta etapa se ubicaron respetando esa estructura ya planeada en
vez de inventar nombres propios.

**Entregado**:
- 9 endpoints públicos reales y probados contra un servidor `next dev` en
  vivo, no solo compilados: `GET /api/services`, `GET /api/services/:slug`,
  `GET /api/services/:slug/status`, `GET /api/services/:slug/reports`,
  `GET /api/services/:slug/incidents`, `GET /api/incidents`, `GET /api/map`,
  `GET /api/statistics`, `POST /api/reports`.
- `services.status` no existe como columna — no la inventé; `/status` la
  deriva en vivo de incidentes abiertos y, si existieran, de
  `aggregated_windows`. Hoy, sin motor (Etapa 3), responde honestamente
  `insufficient_data` para los 16 servicios.
- Columna `reports.network_carrier` añadida (migración `0001`, aplicada y
  verificada) — el formulario del brief (sección 8, campo 5) la pedía y no
  existía en el esquema.
- `lib/privacy.ts` (hash de identidad anónima + prefijo de IP truncado,
  referenciado desde `.env.example` desde la Etapa 1 pero nunca
  implementado), `lib/security/rate-limit.ts` (Redis opcional / memoria),
  `lib/security/sanitize.ts`, `lib/api/respond.ts` (sobre de respuesta
  consistente + manejo de errores).
- Puntuación básica de confianza por reporte (sección 11.2): detecta
  duplicado inmediato (mismo hash+servicio+problema en 60s) y pondera
  historial simple del hash. La versión completa (diversidad de
  dispositivos/redes, campañas coordinadas) es la Etapa 7 — esto no lo
  simula, lo deja explícitamente pendiente.
- 25 pruebas nuevas (34 en total): unitarias de privacidad y bandas de
  estado, e integración real de `POST /api/reports` contra Postgres
  (crear, validar, marcar duplicado, bloquear por límite de tasa).

**Bugs reales encontrados solo al ejecutar**:
- El límite de tasa "no funcionaba" en una primera prueba — en realidad
  cada llamada de la herramienta bash de este entorno arranca un proceso
  `next dev` nuevo, y el rate limit en memoria vive en el proceso: se
  reiniciaba entre pruebas partidas en distintas llamadas. No es un bug de
  PulsoVE; quedó documentado como limitación operativa real de la
  implementación en memoria (README).
- Un error de conexión a Postgres dejaba escapar el stack trace completo
  (incluida la consulta SQL) en la respuesta HTTP en vez de un error
  controlado — visto en vivo al apagar Postgres a mitad de prueba.
  Corregido con `withErrorHandling` en las 9 rutas; reverificado apagando
  Postgres a propósito y confirmando una respuesta `internal_error` limpia.
- Postgres se detuvo varias veces entre llamadas de herramienta a lo largo
  de la sesión (mismo comportamiento que en la Etapa 1) — se volvió
  costumbre reconfirmar `service postgresql status` al inicio de cada
  bloque de comandos, no solo una vez.

**Pendiente real**: autenticación (Etapa 6), CSP y demás cabeceras de
seguridad transversales, moderación de comentarios, el resto de la
prevención de abuso (sección 11.2/11.3 completas), base de datos de prueba
separada para las pruebas de integración (hoy corren contra la BD de
desarrollo).

### Etapa 3 — 2026-09-30/10-01

**Contexto crítico de la sesión**: a mitad de la verificación de esta
etapa, **el sandbox de desarrollo se reinició por completo** —
`/home/claude` desapareció, Postgres quedó desinstalado. Todo el código del
motor escrito hasta ese momento se perdió porque todavía no se había
empaquetado. Se reconstruyó reinstalando Postgres, restaurando el proyecto
desde `pulsove-etapa2.zip` (que sí sobrevivió, en un mount distinto y
persistente) y recreando los archivos de esta etapa con el contenido ya
verificado anteriormente en la misma sesión — no fue trabajo de diseño
perdido, fue re-ejecución. Lección aplicada: empaquetar y entregar tan
pronto una pieza quede verificada, no acumular trabajo sin respaldar.

**Entregado**:
- `lib/engine/robust-stats.ts` (mediana, MAD, z-score robusto — sección
  9.5), `time-bucket.ts` (bucketing día/hora en America/Caracas vía Intl,
  sin asumir el offset UTC-4 a mano), `aggregate.ts` (agregación por
  ventana, service-wide + por estado), `baseline.ts` (mediana+MAD por
  servicio×estado×día×hora), `anomaly.ts` (puntuación ponderada con
  renormalización cuando una señal no tiene datos, factor de confiabilidad
  según tamaño de muestra de la línea base), `incident-lifecycle.ts`
  (apertura/escalado/recuperación/resolución con persistencia mínima de
  ventanas consecutivas).
- `scripts/aggregate-cron.ts` (el script que `package.json` ya
  referenciaba desde la Etapa 1 pero nunca existía).
- `scripts/dev-synthetic-traffic.ts`: generador de tráfico sintético para
  ejercitar el motor (brief, sección 28 — explícitamente sancionado durante
  desarrollo), contra un servicio de prueba dedicado y obviamente falso,
  nunca contra los 16 servicios reales.
- **Ciclo completo verificado de extremo a extremo con datos reales en
  Postgres**, no solo compilación: abierto (confianza 87.1) → escalado
  (92.9) → recuperando (0.0) → resuelto (2.3), con fechas de inicio/pico/fin
  exactas, confirmado tanto por consulta directa a la BD como a través de
  la API pública de la Etapa 2 (`/status`, `/api/incidents`) — probando que
  ambas etapas se integran correctamente sin haber tocado el código de la
  Etapa 2.
- 21 pruebas unitarias nuevas (55 en total): estadística robusta,
  combinación ponderada de señales con renormalización, factor de
  confiabilidad.

**Bugs reales encontrados solo al ejecutar**:
- `onConflictDoUpdate` apuntado a un índice que no era UNIQUE en
  `aggregated_windows` (y que aunque lo fuera, `state_id` nullable rompería
  la deduplicación — NULL != NULL en Postgres). Corregido a un patrón
  borrar-e-insertar por ventana, antes de que este código llegara a
  ejecutarse contra una BD real.
- Dos fallos de diseño en el propio escenario de prueba sintético (no en
  el motor): primero, generar historial en días *consecutivos* nunca
  repite el día de la semana de "hoy" — la línea base agrupa por día×hora,
  así que el bucket del pico se quedaba sin muestra. Segundo, ubicar el
  pico como "las 3 ventanas terminando ahora" puede partirlo entre dos
  horas distintas si el reloj cae justo en una hora exacta. Ambos
  corregidos antes de confiar en el resultado de la prueba.
- Un bug de scripting propio (no de PulsoVE): un primer intento de correr
  el ciclo en lote asumió éxito sin comprobar código de salida, y reportó
  "4 ventanas agregadas" por semana cuando en realidad el comando había
  fallado (`cd` a un directorio que ya no existía, justo cuando el sandbox
  se reinició). Se detectó porque el resultado no cuadraba, no porque se
  revisara cada línea — recordatorio de verificar códigos de salida
  explícitamente, no inferir éxito de la ausencia de error visible.

**Decisiones**:
- Confianza (`aggregated_windows.confidence` / `incidents.confidence`) =
  `anomaly_score × reliabilityFactor(sampleSize de la línea base)` — no es
  el mismo número que el score ponderado crudo. Con 1-2 ventanas
  históricas, un desvío "extremo" puede ser simplemente que el sistema es
  nuevo; la banda de confianza lo reconoce reduciendo el valor final en
  vez de aparentar certeza que no existe.
- Señales sin fuente de datos (técnico, confirmación oficial — ambas
  siempre vacías hoy) se excluyen del promedio ponderado y se renormaliza
  el resto, en vez de contar como 0 (que afirmaría "confirmado normal" sin
  evidencia).

**Pendiente real**: calibrar los umbrales (bandas de z-score, ventanas
mínimas de persistencia) con tráfico real — los valores actuales son
puntos de partida razonables, no calibrados. El motor de mediciones
técnicas (sección 10) sigue sin fuente de datos real. Los pesos siguen en
`.env`, no en tabla editable desde el panel admin (tensión ya anotada en
la Etapa 2).

### Etapa 4a — 2026-10-01 (frontend: cimientos + inicio)

Primer corte de la Etapa 4, entregado por separado dado su tamaño —
sección 7 del brief completa de una sola vez habría significado acumular
mucho trabajo sin empaquetar, justo el riesgo que ya se materializó en la
Etapa 3.

**Entregado**:
- Tokens semánticos de color (`bg`/`surface`/`ink`/`border`, claro y
  oscuro) sobre la paleta brand/pulse/status ya existente desde la
  Etapa 1 — no se inventó paleta nueva.
- Tipografía: Space Grotesk (display) + Inter (texto — legibilidad en
  gama baja, sección 6.1 del brief) + JetBrains Mono (solo para datos
  numéricos reales, nunca decorativo) vía `next/font/google`.
- `Header`, `Footer`, `ThemeToggle` (con script anti-flash) y
  `StatusBadge`/`StatusDot` — color + ícono + texto siempre juntos
  (sección 6.3: "el estado nunca debe depender únicamente del color").
- Página de inicio con datos reales (consulta directa a la BD desde
  Server Components, no HTTP a la propia API): hero con buscador +
  panel de "pulso nacional", incidentes activos, servicios, problemas
  más reportados, metodología resumida (secuencia numerada — es la única
  sección del sitio que es genuinamente una secuencia, sección "writing"
  de la guía de diseño). Estados vacíos honestos: con 0 reportes/
  incidentes hoy, el texto lo dice explícitamente en vez de simular
  actividad.

**Verificado, no solo compilado**: servidor real respondiendo 200,
contenido real confirmado en el HTML servido (título, panel de pulso,
nombres reales de servicios), 55 pruebas sin tocar, `npm run build` con
`/` prerenderizada estática y las 9 rutas de API dinámicas.

**Bug real encontrado solo al ejecutar**: un `Date` crudo interpolado
dentro de una plantilla `sql\`...\`` de Drizzle (a diferencia de pasarlo a
`gte()`, que sí lo serializa) rompía la consulta de la página de inicio
con un 500 — "Received an instance of Date" en vez del string esperado.
Corregido pasando `.toISOString()` explícito.

**Limitación real del sandbox, no del código**: `next/font/google` no
puede alcanzar Google Fonts en este entorno de verificación (no está en
la lista de dominios permitidos) — `npm run dev` degrada con una fuente
de respaldo (comportamiento esperado de next/font), pero `npm run build`
falla duro ante el mismo bloqueo. Se aisló quitando temporalmente
`next/font` del layout: el build completo (incluida la página de inicio
prerenderizada) es limpio sin ese problema — confirma que no hay ningún
otro error de build escondido. En Vercel, GitHub Actions o la máquina del
usuario, con acceso normal a internet, esto compila sin cambios.

**Pendiente real**: mapa nacional (el cartograma ya tiene los datos de
`grid_row`/`grid_col` desde la Etapa 1, falta construir el componente
visual), página de incidentes global, estadísticas, metodología completa,
y el gráfico principal de la página de servicio (recharts, con línea base
e incidentes superpuestos — ver Etapa 4c).

### Etapa 4b — 2026-10-01 (directorio de servicios)

**Entregado**: `/servicios` — búsqueda, filtro por categoría y por
estado, tres órdenes (alfabético/actividad/estabilidad), vista
tarjetas/lista (brief, sección 7.2 completa). Filtros vía formulario GET
(funciona sin JavaScript, acorde a la sección 6.1: "optimizada para
conexiones lentas"), no un filtro cliente-pesado. `statusForService` se
extrajo de `home.ts` a `lib/queries/status.ts` compartido en vez de
duplicarlo.

**Verificado con servidor real**: 200 en `/servicios` sin filtros (16
servicios), con `?category=banca-y-pagos` (exactamente Banco de
Venezuela/Banesco/Mercantil, ningún otro), con `?q=whats` (exactamente
WhatsApp) — confirmado leyendo el HTML/payload real servido, no solo el
código de estado. 55 pruebas sin tocar.

### Etapa 4c — 2026-10-02 (página de servicio + formulario de reporte funcional)

**Decisión**: en vez de dejar el botón "Reportar" como una promesa vacía
hasta la Etapa 5 (Turnstile + geolocalización), se construyó un
formulario de reporte básico pero genuinamente funcional ahora —
`POST /api/reports` ya existía y funcionaba desde la Etapa 2; lo que
faltaba era la interfaz. La Etapa 5 añade Turnstile y geolocalización
aproximada sobre esta base, no la reemplaza.

**Entregado**:
- `lib/queries/status.ts` ampliado con `getServiceStatusDetail` —
  extraída del endpoint `/api/services/:slug/status` (antes 91 líneas,
  ahora 14) para que la API y la página de servicio usen exactamente la
  misma fuente de verdad, no dos copias de la misma lógica.
- `/servicios/:slug`: cabecera (estado real, confianza, última
  actualización, confirmación oficial, insignia "Datos demostrativos"),
  formulario de reporte funcional (`ReportForm`, componente cliente:
  genera y persiste un `deviceSeed` anónimo en `localStorage`, envía a
  `POST /api/reports`, maneja éxito/429/error), desglose de tipos de
  problema, actividad geográfica agregada por estado, incidentes
  recientes. Metadata dinámica por servicio (brief, sección 20: "Estado
  de CANTV en Venezuela | PulsoVE").
- No incluye todavía: el gráfico principal con línea base e incidentes
  superpuestos (`recharts`, rango seleccionable 1h/6h/24h/7d/30d) —
  deliberadamente diferido a un corte propio (Etapa 4d) dada su
  complejidad.

**Verificado de extremo a extremo, no solo cada pieza por separado**: se
envió un reporte real contra `POST /api/reports` (el mismo camino que usa
`ReportForm`) y se confirmó que `/servicios/cantv` lo reflejó de
inmediato — apareció la sección "Tipos de problema reportados" con "Sin
conexión" y "Actividad geográfica" con "Distrito Capital". 404 real
confirmado para un slug inexistente. Build aislado sin next/font: limpio,
con `/servicios` y `/servicios/[slug]` correctamente dinámicas.

### Servicio agregado — 2026-10-02 (Cashea)

A pedido explícito. Verificada por búsqueda antes de describirla (no
asumida de memoria): es la fintech BNPL ("compra ahora, paga después")
más grande de Venezuela — categoría `banca-y-pagos`, mismo patrón que el
resto (`official_url: null`, `is_demo: true`). 17 servicios en total
desde ahora. Confirmado con servidor real: aparece en `/servicios`, en el
filtro `?category=banca-y-pagos` junto a los tres bancos, en
`/servicios/cashea` con metadata propia, y en `GET /api/services`. Prueba
`seed-data.test.ts` actualizada para esperar 17 servicios en vez de 16.

### Catálogo ampliado — 2026-10-10

A pedido de la persona propietaria ("streaming, juegos, plataformas,
apuestas, etc."). El catálogo pasó de 17 servicios en 4 categorías a **71
servicios en 8 categorías** y de 13 a **25 tipos de problema**:

- Categorías nuevas: `streaming`, `videojuegos`, `delivery-y-movilidad`,
  `apuestas-y-loterias`, cada una con 3 tipos de problema propios (sin ellos el
  formulario de reporte solo habría ofrecido "Otro").
- Servicios nuevos (54): más bancos (BBVA Provincial, BNC, Banco Digital de los
  Trabajadores, Bancamiga, Banco del Tesoro, Bancaribe, Banplus), billeteras y
  plataformas de pago (Ubii, Zinli, Reserve, Binance, Creska, Mony, Wally),
  telecomunicaciones (Simple TV, Supercable, Airtek, G-Network), portales
  públicos (Hidroven, SENIAT, SAIME, BCV), redes y plataformas (Facebook,
  Messenger, X, TikTok, Telegram, LinkedIn, Mercado Libre), streaming,
  videojuegos, delivery y movilidad, y apuestas y loterías.
- **Criterio de inclusión: evidencia pública y fechada** de uso o disponibilidad
  en Venezuela, anotada servicio por servicio en `docs/CATALOGO-SERVICIOS.md`,
  junto con lo que quedó fuera y por qué. Descripciones neutras, sin cifras ni
  afirmaciones de cobertura o legalidad; `official_url: null` e
  `is_demo: true` como en el resto.
- `scripts/seed.ts` ahora **sincroniza** categorías y tipos de problema con
  upsert por `slug` (antes `onConflictDoNothing`, que habría dejado intactas las
  descripciones ya sembradas); estados y servicios siguen siendo
  "insertar si falta". Dos corridas seguidas: 54 servicios nuevos y luego 0.
- Apuestas y loterías: las fuentes sobre su situación legal se contradicen
  (FocusGN 2023 vs. Altenar 2025), así que PulsoVE no toma posición. Las páginas
  de esos servicios muestran un aviso ("solo informa disponibilidad técnica; no es
  una promoción ni confirma que esté autorizado"). **La revisión legal
  profesional sigue pendiente.**
- `tests/seed-data.test.ts`: la prueba que exigía el conjunto exacto de 17
  servicios pasó a "los 17 originales siguen presentes", y se añadieron pruebas de
  calidad (formato y longitud de slugs, nombres únicos, descripciones sin enlaces,
  ningún `officialUrl`, cada categoría con servicios y con al menos dos tipos de
  problema propios). 55 → **63 pruebas**.
- Verificado contra Postgres 16 y servidor real: `typecheck` limpio, 63 pruebas en
  verde, `db:seed` idempotente, `/servicios?category=<slug>` devuelve exactamente
  los servicios de cada categoría, el formulario de cada servicio ofrece los tipos
  de su categoría, un `POST /api/reports` real sobre un servicio nuevo respondió
  201 y el estado siguió en "Sin datos suficientes". `/servicios` con 71 servicios
  responde en ~0,15 s con la base local (el directorio sigue haciendo una consulta
  de estado por servicio; no es un problema a esta escala, pero sigue siendo una
  brecha conocida).
- **No verificado:** `npm run build` (en este entorno `fonts.googleapis.com` está
  bloqueado); no todas las fuentes se contrastaron con una segunda; varios
  artículos solo se leyeron como titular (ver sección 7 del catálogo).

### Arreglos de navegación y metadatos — 2026-10-10

Detectados al revisar el sitio con un navegador real después de ampliar el
catálogo:

- **Enlaces internos rotos.** El encabezado, el pie, la portada y el formulario
  de reporte enlazaban a `/mapa`, `/incidentes`, `/estadisticas` y
  `/metodologia`, que aún no existen (Etapa 4d): 404 desde todas las páginas del
  sitio. Se creó `src/lib/nav.ts` (registro `ROUTE` + `isRouteAvailable`) y todos
  esos enlaces pasan por él; al crear una página se activa allí con
  `available: true`. `tests/nav.test.ts` (3 pruebas) falla si `available` no
  coincide con la existencia de `src/app/<ruta>/page.tsx` o si alguien escribe a
  mano la ruta de una página no disponible (se comprobó que ambas guardas
  fallan al romper la regla).
- **Menú móvil.** El menú principal estaba `hidden md:flex`: en móvil no había
  navegación. Ahora se muestra siempre y se desplaza en horizontal si algún día
  hay más enlaces de los que caben. Comprobado a 390 px sin desbordamiento.
- **Meta descripciones** de la portada y del directorio, que seguían nombrando 4
  categorías.
- Pruebas: 63 → **66**.

### Migración a Claude Code — 2026-10-10

A pedido de la persona propietaria ("quiero mover el proyecto del chat al
Code"), el proyecto vive ahora en el repositorio público
`medinacaj/web-downdetector-ve`; su primer commit es la Etapa 4c del chat más
Cashea.

- `CLAUDE.md` (importa `AGENTS.md`, el aviso de Next 16 que genera `next dev`):
  acuerdo de trabajo, reglas innegociables, comandos, mapa del código,
  convenciones, trampas conocidas y hoja de ruta.
- `.claude/rules/seo-tecnico.md`: las instrucciones permanentes de SEO técnico e
  indexación de la persona propietaria, condensadas; se cargan al tocar
  `src/app`, `src/components`, `src/lib/seo`, `next.config.mjs` o `public`.
- `scripts/dev-bootstrap.sh`: entorno desde cero (dependencias, Postgres local,
  `.env` con secretos nuevos, rol y base, migraciones y semillas), idempotente.
  Probado desde un estado en blanco (~30 s) y repetido sin cambios.
- `docs/SEO-PENDIENTE.md`: auditoría de SEO técnico en local. **El sitio aún no
  está listo para publicarse**: sin `robots.txt`, `sitemap.xml`, canonical, Open
  Graph, favicon, datos estructurados ni dominio. Incluye la decisión de
  indexación pendiente (todo es demostrativo) y los pasos de Google Search
  Console que corresponden a la persona propietaria; no se usó Search Console ni
  se simuló.
- `docs/MIGRACION-CLAUDE-CODE.md`: qué se movió, cómo abrirlo en Code y la
  pregunta abierta sobre una versión más avanzada (según su `CLAUDE.md`: SEO
  base, 159 pruebas, 60 servicios) que no está en este repositorio.
- `.gitignore`: `CLAUDE.local.md` y `.claude/settings.local.json`.
- **No verificado:** `npm run build` (Google Fonts bloqueado en el entorno); el
  bootstrap fuera de Linux; nada del SEO contra un dominio real.
