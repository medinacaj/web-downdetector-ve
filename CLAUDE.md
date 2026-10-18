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
npm run typecheck && npm test         # 85 pruebas; las de API usan Postgres real
npm run db:seed                       # idempotente (ver "Semillas y catálogo")
npm run aggregate:run -- --window=15  # un ciclo del motor (cron externo)
npm run dev:synthetic-traffic         # tráfico sintético; añade -- --cleanup para limpiarlo
npm run build && npm start            # producción; necesita acceso a Google Fonts (verificado el 2026-10-18)
```

Requisitos: Node 22+, PostgreSQL 16+ (Redis opcional). Antes de cada bloque de
comandos con base de datos comprueba que Postgres esté arriba (`pg_isready`;
`service postgresql start`). `npm run lint` **no funciona** (Next 16 eliminó
`next lint` y no hay ESLint configurado): pendiente de la Etapa 10.

## Mapa del código

- `src/app/` — `page.tsx` (inicio), `servicios/` y `servicios/[slug]`, `categorias/[slug]`, `api/` (9
  endpoints públicos), `robots.ts`, `sitemap.ts`, `not-found.tsx`, iconos (`favicon.ico`,
  `icon.svg`, `apple-icon.png`; se regeneran con `node scripts/generate-icons.mjs`) e
  imagen para compartir (`opengraph-image.tsx`, `twitter-image.tsx`). Las páginas de mapa, incidentes, estadísticas y metodología (Etapa 4d)
  no existen: sus enlaces pasan por `src/lib/nav.ts`.
- `src/lib/db/` — `schema.ts` (17 tablas), `client.ts`, `seed-data/` (categorías, tipos
  de problema, estados, servicios). `scripts/seed.ts` las siembra.
- `src/lib/engine/` — agregación, línea base, anomalías, ciclo de vida de incidentes.
- `src/lib/queries/` — lecturas compartidas por API y páginas (`status.ts` deriva el
  estado). `src/lib/api/respond.ts` (sobre de respuesta), `security/`, `privacy.ts`,
  `validation/`, `nav.ts` (registro de rutas), `seo/` (`site.ts`: `SITE_URL` y política
  de indexación; `crawl.ts`: robots y sitemap; `metadata.ts`: `pageMetadata`; `json-ld.ts`; `brand.ts`;
  `share-image.tsx`).
- `src/components/` — `layout/`, `directory/`, `service/`, `ui/`.
- `tests/` — Vitest (9 archivos). `drizzle/` — migraciones 0000 y 0001.
- `docs/` — plan maestro, catálogo de servicios, SEO pendiente, migración a Code.

## Convenciones

- UI en español (es-VE). Hora de negocio `America/Caracas`.
- API: sobre `{ data, meta }` o `{ error: { code, message, details } }`; usa
  `ok()`/`apiError()` y envuelve cada handler con `withErrorHandling`. Un error interno
  jamás filtra el stack ni el SQL.
- Alias `@/*` → `src/*`. Server Components por defecto; cliente solo para interacción
  (`ReportForm`, `ThemeToggle`, `ViewToggle`, `ServiceGrid`).
- En Next 16 `params` y `searchParams` son **Promesas**. Páginas con datos en vivo:
  `export const dynamic = 'force-dynamic'` (obligatorio aunque la página lea `params`;
  `tests/rendering.test.ts` lo exige a toda página que importe `@/lib/queries` o
  `@/lib/db`: sin él, `next build` congeló la portada con las cifras del build). Un `page.tsx`/`layout.tsx` no puede exportar
  nombres extra.
- Indexación: hoy **noindex global** (opción A, decidida el 2026-10-11). La política se
  define solo en el `metadata` de `src/app/layout.tsx` vía `getSiteConfig()`; ninguna
  página pone su propio `robots` (lo comprueba `tests/seo.test.ts`). Se abre con
  `SITE_URL` en https + `SITE_INDEXING="true"`, sin tocar código.
- Metadata: toda página pública exporta la suya con `pageMetadata({ title, description,
  path })` (canonical, Open Graph y Twitter coherentes, imagen incluida); lo exige
  `tests/seo.test.ts`. La metadata de Next se fusiona de forma superficial: no pongas
  `openGraph` suelto en una página.
- JSON-LD solo con datos reales y visibles (`src/lib/seo/json-ld.ts`, `<JsonLd>`). Las
  migas de pan van con `<Breadcrumbs>` (`src/components/layout/`): pinta la visible y su
  `BreadcrumbList` desde la misma lista. Nada de `Rating`, `Service` ni contactos.
- Enlaces a servicios y categorías con `serviceHref(slug)` y `categoryHref(slug)` de
  `src/lib/nav.ts`, no escritos a mano.
- Apuestas y loterías: el aviso legal lo ponen `GamblingNotice` y
  `GAMBLING_META_DISCLAIMER` (`src/components/service/GamblingNotice.tsx`) en la página
  de cada servicio y en la de la categoría, incluida su metadescripción. No lo metas en
  textos editables (descripciones de la semilla o del futuro panel).
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
- `SITE_URL`/`SITE_INDEXING` deben existir también en `npm run build`: la 404 general
  (`/_not-found`) es estática y toma sus valores del build.
- La 404 de un **servicio** inexistente (`notFound()` en página dinámica) sale como
  documento `__next_error__` que pinta el cliente (código 404 correcto). Es de Next 16.3,
  ya pasaba antes; un `not-found.tsx` en el segmento no lo arregla.
- `next build` reescribe `next-env.d.ts` (`.next/types` en vez de `.next/dev/types`) y
  `next dev` lo devuelve: no lo commitees (`git checkout next-env.d.ts`).
- No borres `node_modules` con `next dev` en marcha: deja errores "Can't resolve
  'drizzle-orm'" pegados en la consola del navegador. Reinicia el servidor.
- Para parar el servidor: `fuser 3100/tcp` da el PID y luego `kill <pid>`. En el sandbox de
  Claude Code `lsof` no mostró nada con el servidor en marcha y `ss` no existe; `pkill -f`
  mata tu propio shell si el patrón aparece en el comando.

## Estado y hoja de ruta

Hecho: Etapas 1–3 (datos, API, motor) y 4a–4c (inicio, directorio, servicio con reporte),
catálogo ampliado a 71 servicios, registro de rutas, menú móvil.

SEO base, primer bloque (2026-10-11): política de indexación (opción A, noindex global),
`SITE_URL`/`metadataBase`, `robots.ts` y `sitemap.ts`. Dependencias de producción sin
vulnerabilidades (2026-10-18: `next` 16.3.8, `sharp` 0.35.5, `source-map-js` 1.2.2);
`npm run build` y `npm start` verificados; portada dinámica. SEO base, tercer bloque
(2026-10-18): canonical, Open Graph y Twitter con imagen, favicon e iconos, 404 propia;
páginas de categoría en `/categorias/<slug>` (URL elegida por la persona propietaria);
JSON-LD (`WebSite`, `Organization`, `BreadcrumbList`) y metadescripciones propias por
servicio. **El SEO base está completo en local**; falta lo que depende de terceros.

Pendiente, en orden: **4d** (gráfico histórico con `recharts`, mapa, incidentes,
estadísticas, metodología; al crearlas, activar en `nav.ts`) · **5** Turnstile y
geolocalización aproximada · **6** panel admin y `create-admin` (los slugs no deben poder
editarse sin redirección; `/admin` con noindex y autenticación) · **7** abuso avanzado ·
**8** tiempo real (SSE) · **9** observabilidad · **10** e2e/carga/Docker/CI, ESLint y las 17
vulnerabilidades de herramientas de desarrollo (vitest/vite/esbuild; `npm audit --omit=dev` = 0).

Brechas conocidas: señales técnica y oficial del motor sin fuente real (se excluyen y el
resto se renormaliza); municipios sin sembrar; el directorio hace una consulta de estado
por servicio (N+1; ~0,15 s con 71 servicios en local; también en las páginas de
categoría); no hay índice `/categorias` (404; el directorio cumple esa función); no hay dominio todavía (S3: dominio y redirecciones; S12: rendimiento en producción) y el SEO no se probó contra uno real ni en
Google Search Console (no se usó); revisión legal profesional de apuestas y loterías
pendiente.

## Documentos (léelos por ruta cuando el trabajo los toque)

`docs/00-PLAN-MAESTRO.md` (arquitectura, etapas, registro de cambios) ·
`docs/CATALOGO-SERVICIOS.md` · `docs/SEO-PENDIENTE.md` · `docs/MIGRACION-CLAUDE-CODE.md` ·
`README.md`. Las reglas por área viven en `.claude/rules/` y se cargan al tocar esos
archivos.
