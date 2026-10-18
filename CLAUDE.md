@AGENTS.md

# PulsoVE — instrucciones para Claude

Plataforma independiente, en español, de monitoreo ciudadano y técnico de servicios
en Venezuela (telecomunicaciones, banca y pagos, servicios públicos, plataformas,
streaming, videojuegos, delivery y movilidad, apuestas y loterías). Next.js 16
(App Router) + React 19 + TypeScript + Tailwind v3 + Drizzle ORM + PostgreSQL 16 +
Vitest. **Responde siempre en español.** La persona propietaria escribe mensajes muy
cortos ("Continúa", "¿Cuál es el siguiente paso?"): trabaja por etapas, sin pedir
confirmación en decisiones menores y sin dejar nada a medias.

> **Origen de este repositorio.** Es la versión del proyecto que vivía en un chat de
> claude.ai (Etapa 4c) más el catálogo ampliado. El `CLAUDE.md` que la persona
> propietaria subió en su día describe una versión **más avanzada** (SEO técnico base,
> 159 pruebas, 60 servicios): si existe en Cowork o en su computadora, no la
> reimplementes aquí en paralelo; pregunta antes. Ver `docs/MIGRACION-CLAUDE-CODE.md`.

## Acuerdo de trabajo

- Entrega etapas **completas y verificadas**: nada de placeholders ni "aquí iría el
  código". Lo que declaras funcional debe haberse ejecutado de verdad.
- Antes de decir "listo": `npm run typecheck` y `npm test` en verde, y probar el cambio
  con el servidor real (`npm run dev`), no solo compilar.
- Sé honesto sobre lo **no** verificado (qué probaste, qué no, qué depende de terceros).
  Distingue "preparado" de "hecho" y de "indexado/publicado".
- Al cerrar cada etapa actualiza `README.md` y `docs/00-PLAN-MAESTRO.md` (conteos,
  estado, registro de cambios). Nada de cifras obsoletas.
- Cada entrega web termina con un resumen breve: comprobaciones realizadas, problemas
  detectados, corregidos, tareas pendientes y acciones del propietario en Google Search
  Console (ver `.claude/rules/seo-tecnico.md`).
- Next 16 difiere de lo que sabes: antes de escribir código de Next lee la guía en
  `node_modules/next/dist/docs/` (lo exige `AGENTS.md`).

## Reglas innegociables

- **No inventar**: URLs oficiales, contactos, cobertura, disponibilidad, incidentes
  reales, cuota de mercado ni estadísticas históricas. Sin fuente real conectada se
  muestra "Datos demostrativos". `services.official_url` es `null` hasta que una
  persona lo verifique.
- **Privacidad**: no pedir cédula, dirección exacta, teléfono, contraseña, datos
  bancarios, capturas con información sensible ni coordenadas permanentes. La identidad
  anónima y la IP solo existen como hashes HMAC (`ANONYMIZATION_SALT`); ninguna IP
  completa se guarda.
- **Secretos fuera del repositorio**: `.env` nunca se commitea ni se empaqueta; no
  exponer tokens, claves, credenciales, variables privadas ni URLs administrativas
  sensibles (tampoco en `robots.txt`). El repositorio es **público**.
- **Integridad**: ninguna empresa puede pagar para ocultar reportes, alterar su estado
  ni borrar incidentes legítimos.
- **Motor explicable**: la IA no reemplaza al motor estadístico. Lenguaje prudente
  ("posible", "detectada"); sin datos suficientes se dice "Sin datos suficientes",
  nunca "normal" por defecto.
- **No afirmar cumplimiento legal absoluto** sin revisión profesional en la jurisdicción
  aplicable. Apuestas y loterías tienen esa revisión pendiente: PulsoVE no las promueve
  ni confirma que estén autorizadas (aviso en sus páginas).
- **SEO técnico e indexación forman parte de cada entrega web**: robots, sitemap,
  canonical, titles, metadescripciones, indexabilidad, códigos HTTP, enlazado interno,
  móvil. No simular el uso de Google Search Console ni asumir que una URL está indexada
  por estar publicada.

## Comandos

```bash
bash scripts/dev-bootstrap.sh         # entorno desde cero: deps, Postgres, .env, migraciones, semillas
npm run dev                           # http://localhost:3000 (PORT=3100 npm run dev para otro puerto)
npm run typecheck && npm test         # 66 pruebas; las de API usan Postgres real
npm run db:seed                       # idempotente (ver "Semillas y catálogo")
npm run aggregate:run -- --window=15  # un ciclo del motor (cron externo)
npm run dev:synthetic-traffic         # tráfico sintético; añade -- --cleanup para limpiarlo
npm run build                         # necesita internet (next/font/google); no verificado en el sandbox
```

Requisitos: Node 22+, PostgreSQL 16+ (Redis opcional). Antes de cada bloque de
comandos con base de datos comprueba que Postgres esté arriba (`pg_isready`;
`service postgresql start`). `npm run lint` **no funciona** (Next 16 eliminó
`next lint` y no hay ESLint configurado): pendiente de la Etapa 10.

## Mapa del código

- `src/app/` — `page.tsx` (inicio), `servicios/` y `servicios/[slug]`, `api/` (9
  endpoints públicos). **No hay** `robots`, `sitemap`, `not-found`, favicon ni imagen
  OG todavía. Las páginas de mapa, incidentes, estadísticas y metodología (Etapa 4d)
  no existen: sus enlaces pasan por `src/lib/nav.ts`.
- `src/lib/db/` — `schema.ts` (17 tablas), `client.ts`, `seed-data/` (categorías, tipos
  de problema, estados, servicios). `scripts/seed.ts` las siembra.
- `src/lib/engine/` — agregación, línea base, anomalías, ciclo de vida de incidentes.
- `src/lib/queries/` — lecturas compartidas por API y páginas (`status.ts` deriva el
  estado). `src/lib/api/respond.ts` (sobre de respuesta), `security/`, `privacy.ts`,
  `validation/`, `nav.ts` (registro de rutas).
- `src/components/` — `layout/`, `directory/`, `service/`, `ui/`.
- `tests/` — Vitest (7 archivos). `drizzle/` — migraciones 0000 y 0001.
- `docs/` — plan maestro, catálogo de servicios, SEO pendiente, migración a Code.

## Convenciones

- UI en español (es-VE). Hora de negocio `America/Caracas`.
- API: sobre `{ data, meta }` o `{ error: { code, message, details } }`; usa
  `ok()`/`apiError()` y envuelve cada handler con `withErrorHandling`. Un error interno
  jamás filtra el stack ni el SQL.
- Alias `@/*` → `src/*`. Server Components por defecto; cliente solo para interacción
  (`ReportForm`, `ThemeToggle`, `ViewToggle`, `ServiceGrid`).
- En Next 16 `params` y `searchParams` son **Promesas**. Páginas con datos en vivo:
  `export const dynamic = 'force-dynamic'`. Un `page.tsx`/`layout.tsx` no puede exportar
  nombres extra.
- Todo enlace a una página que puede no existir usa `ROUTE` + `isRouteAvailable` de
  `src/lib/nav.ts`; una página nueva se activa allí (`available: true`). `tests/nav.test.ts`
  falla si `available` no coincide con el archivo o si alguien escribe la ruta a mano.
- Estilos con los tokens de `tailwind.config.ts` / `globals.css` (`bg`, `surface`, `ink`,
  `border`, `brand`, `pulse`, `status`); no colores sueltos. Móvil primero.

## Semillas y catálogo

71 servicios en 8 categorías, 25 tipos de problema. `db:seed` **sincroniza** categorías y
tipos de problema (upsert por `slug`) y solo **inserta** los estados y servicios que falten
(un servicio pudo editarse después). Todos son `is_demo: true`, sin `official_url`. Para
añadir o retirar servicios o categorías sigue `docs/CATALOGO-SERVICIOS.md` (criterio de
evidencia pública fechada, fuentes, exclusiones). Cada categoría necesita al menos 2 tipos
de problema propios o su formulario solo ofrecería "Otro" (lo comprueba una prueba).

## Trampas conocidas

- `DATABASE_URL` no debe llevar `?schema=public` (postgres.js lo rechaza).
- `drizzle-kit migrate` pudo colgarse sin TTY en otro sandbox (aquí funcionó); si pasa:
  `psql -f drizzle/000X_*.sql`.
- Los arrays `as const` de las semillas hay que expandirlos (`[...arr]`) al insertar.
- Un `Date` crudo dentro de una plantilla `sql` de Drizzle necesita `.toISOString()`.
- `aggregated_windows` no tiene índice UNIQUE: se hace delete-then-insert por ventana.
- Las pruebas de API **insertan filas reales** (8) en la base de desarrollo: límpialas
  (`delete from reports; delete from aggregated_windows; delete from baselines;`) o la
  portada mostrará cifras de prueba.
- El rate limit en memoria (sin `REDIS_URL`) se reinicia con el proceso.
- `next dev` regenera el bloque de `AGENTS.md`: no lo edites a mano; la primera línea de
  este archivo debe seguir siendo `@AGENTS.md`.
- Con red restringida, `next build` falla en `next/font/google`; `next dev` degrada.
- No borres `node_modules` con `next dev` en marcha: deja errores "Can't resolve
  'drizzle-orm'" pegados en la consola del navegador. Reinicia el servidor.
- Para parar el servidor: `fuser 3100/tcp` da el PID y luego `kill <pid>`. En el sandbox de
  Claude Code `lsof` no mostró nada con el servidor en marcha y `ss` no existe; `pkill -f`
  mata tu propio shell si el patrón aparece en el comando.

## Estado y hoja de ruta

Hecho: Etapas 1–3 (datos, API, motor) y 4a–4c (inicio, directorio, servicio con reporte),
catálogo ampliado a 71 servicios, registro de rutas, menú móvil.

Pendiente, en orden: **SEO técnico base antes de publicar nada** (robots, sitemap,
canonical, Open Graph, JSON-LD, favicon, dominio y regla de indexación; ver
`docs/SEO-PENDIENTE.md`) · **4d** (gráfico histórico con `recharts`, mapa, incidentes,
estadísticas, metodología; al crearlas, activar en `nav.ts`) · **5** Turnstile y
geolocalización aproximada · **6** panel admin y `create-admin` (los slugs no deben poder
editarse sin redirección; `/admin` con noindex y autenticación) · **7** abuso avanzado ·
**8** tiempo real (SSE) · **9** observabilidad · **10** e2e/carga/Docker/CI, ESLint y 9
vulnerabilidades solo de herramientas de desarrollo (vitest/vite/esbuild).

Brechas conocidas: señales técnica y oficial del motor sin fuente real (se excluyen y el
resto se renormaliza); municipios sin sembrar; el directorio hace una consulta de estado
por servicio (N+1; ~0,15 s con 71 servicios en local); sin páginas de categoría
indexables (solo el filtro `?category=`); el SEO no se probó contra un dominio real ni en
Google Search Console (no se usó); revisión legal profesional de apuestas y loterías
pendiente; `npm run build` sin verificar en el sandbox.

## Documentos (léelos por ruta cuando el trabajo los toque)

`docs/00-PLAN-MAESTRO.md` (arquitectura, etapas, registro de cambios) ·
`docs/CATALOGO-SERVICIOS.md` · `docs/SEO-PENDIENTE.md` · `docs/MIGRACION-CLAUDE-CODE.md` ·
`README.md`. Las reglas por área viven en `.claude/rules/` y se cargan al tocar esos
archivos.

## Marco legal-tecnológico
Leer `docs/ASESOR_LEGAL_TECNOLOGICO.md` en tareas con implicaciones legales, datos, IA, derechos de contenido, seguridad, proveedores, contratos o continuidad. Aplicar solo los controles pertinentes y distinguir requisitos jurídicos verificados de buenas prácticas; registrar evidencia, jurisdicción, riesgo y validación pendiente. Coordinar con `AGENTS.md`.
