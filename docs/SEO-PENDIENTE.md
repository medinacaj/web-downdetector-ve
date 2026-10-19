# SEO técnico e indexación — estado y pendientes

> **Estado al 18 de octubre de 2026:** el SEO técnico base está **implementado y
> verificado en local** (S1, S2, S4–S11 y S13; política de indexación A). Lo que falta
> depende de terceros: el **dominio** y sus redirecciones (S3), medir rendimiento en
> producción (S12) y Search Console (sección 6). Hoy el sitio sale en `noindex` a
> propósito. Ver la sección 9.
>
> Actualización del 11 de octubre de 2026: decidida la política de indexación
> (opción A, sección 5) e implementados S1, S2 y la parte de S3 que no depende del
> dominio.
>
> Auditoría del **10 de octubre de 2026** sobre el código de este repositorio
> ejecutándose en local (`next dev`, PostgreSQL 16, 71 servicios). **No hay sitio
> publicado, ni dominio, ni acceso a Google Search Console**: nada de esto se midió
> contra Google ni contra un dominio real, y no se simuló ninguna herramienta
> externa. Las reglas permanentes de la persona propietaria están en
> `.claude/rules/seo-tecnico.md`.

## 1. Resumen

**El sitio no está listo para publicarse desde el punto de vista del SEO técnico.**
Lo que existe está bien hecho (HTML renderizado en servidor, un `title` y una
descripción por página, 404 reales, enlaces internos rastreables, móvil sin
desbordes), pero falta la capa que permite a Google descubrirlo e interpretarlo:
`robots.txt`, `sitemap.xml`, canonical, dominio, Open Graph, favicon y datos
estructurados. Hoy no se bloquea nada por accidente (no hay `noindex` en páginas
públicas, ni `X-Robots-Tag`, ni middleware); simplemente aún no se ha construido.

No se implementó aquí a propósito: el `CLAUDE.md` que la persona propietaria subió en
su día describe una versión **más avanzada** que ya incluye esa capa (ver
`docs/MIGRACION-CLAUDE-CODE.md`). Reimplementarla en paralelo crearía conflictos al
importarla. Si esa versión no va a importarse, esta lista es el plan (sección 5).

## 2. Cómo se comprobó (reproducible)

Con el servidor en marcha (`PORT=3100 npm run dev`):

```bash
# Códigos HTTP
for u in / /servicios /servicios/netflix /servicios/no-existe /robots.txt /sitemap.xml /favicon.ico; do
  printf "%-22s " "$u"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3100$u"
done
# Metadata de una página: title, description, robots, canonical, Open Graph, JSON-LD
curl -s http://localhost:3100/servicios/netflix \
  | grep -oE '<title>[^<]*</title>|<meta name="(description|robots)"[^>]*>|<link rel="canonical"[^>]*>|property="og:[a-z:]+"|application/ld\+json'
# Cabecera X-Robots-Tag (no debería salir nada en páginas públicas)
curl -sI http://localhost:3100/servicios | grep -i x-robots-tag
```

El móvil se revisó con Chromium sin interfaz a 390 px de ancho (portada, directorio y
dos páginas de servicio). Los enlaces internos se siguieron desde páginas de muestra.
Después de cada cambio relevante hay que repetir esto **y** hacerlo contra el dominio
real (sección 6).

## 3. Lo que funciona (verificado en local)

| Elemento | Resultado |
|---|---|
| Códigos HTTP | `/`, `/servicios`, `/servicios/<slug>` → 200. Un slug inexistente → **404 real** (no soft 404). `/servicios/` → 308 a `/servicios`. `/servicios/NETFLIX` → 404 (no hay URLs duplicadas por mayúsculas). |
| Renderizado | Páginas `force-dynamic` renderizadas en el servidor: el HTML ya trae contenido y metadata; no dependen de JavaScript del cliente. |
| `title` / `description` | Portada: "PulsoVE — Estado de servicios en Venezuela". Directorio: "Servicios \| PulsoVE". Servicios: "Estado de {nombre} en Venezuela \| PulsoVE" (único por construcción: los nombres son únicos y lo comprueba una prueba). La descripción del directorio nombra las 8 categorías; la de la portada las resume. |
| Indexabilidad | Sin `noindex` en páginas públicas, sin `X-Robots-Tag`, sin middleware. El 404 de un servicio inexistente lleva `noindex` (correcto). `<html lang="es">`. |
| Enlazado interno | `/servicios` enlaza con `<a href>` a las 71 páginas de servicio; la portada enlaza a `/servicios` y a una muestra de servicios. Se siguieron 73 enlaces internos únicos desde páginas de muestra y todos respondieron 200. Los enlaces a páginas aún inexistentes (mapa, incidentes, estadísticas, metodología) están ocultos por `src/lib/nav.ts`: no hay enlaces rotos conocidos. |
| Móvil | Sin desbordamiento horizontal a 390 px; el menú principal se muestra también en móvil. |

## 4. Problemas detectados

Prioridad: **P0** bloquea la publicación · **P1** hacerlo antes de pedir indexación ·
**P2** mejora que conviene no olvidar.

| # | Pri. | Hallazgo (verificado) | Qué hacer |
|---|---|---|---|
| S1 | P0 | ✅ **Resuelto 2026-10-11** (`src/app/robots.ts`, `src/lib/seo/crawl.ts`): `Allow: /`, `Disallow: /api/`, y la línea `Sitemap:` solo con la indexación abierta. No se usa `Disallow: /` ni con el sitio en noindex: Google necesita rastrear para leer la etiqueta. Dinámico (lee la configuración del servidor, no la del build). Antes: `/robots.txt` → **404**. | `src/app/robots.ts`. En producción: `allow: /`, `disallow: /api/` (JSON sin valor de búsqueda; hoy solo el envío del formulario usa la API, no el renderizado) y `sitemap: <SITE_URL>/sitemap.xml`. En cualquier otro entorno: `disallow: /`. Decidir por una variable explícita, no por suposición, y **quitar el bloqueo al pasar a producción**. No listar nunca rutas administrativas (se protegen con autenticación y `noindex`). Se cachea por defecto: comprobar el resultado tras `next build`. |
| S2 | P0 | ✅ **Resuelto 2026-10-11** (`src/app/sitemap.ts`): vacío (`<urlset>` sin URLs, 200) mientras rija el noindex; con la indexación abierta lista `/`, `/servicios` y los servicios activos, absolutas, sin duplicados ni parámetros y sin `lastModified` (no hay fecha de edición real). Dinámico. Probado en local con un dominio ficticio: 73 URLs. Antes: `/sitemap.xml` → **404**. | `src/app/sitemap.ts`: `/`, `/servicios` y `/servicios/<slug>` de los servicios `active = true` (la página de un servicio inactivo ya responde 404). Solo rutas disponibles según `nav.ts`; URLs absolutas con el dominio canónico; sin filtros ni parámetros. Lee la base de datos, así que debe ser dinámico o revalidarse (si no, queda congelado en el build). `lastModified` solo si es real: `services.updated_at` sirve únicamente si se actualiza al editar; no poner `new Date()` en todo. Una prueba debe fallar si aparece una ruta no disponible, una URL relativa o un duplicado. |
| S3 | P0 | **Parcial 2026-10-11:** `SITE_URL` en `.env.example` y `metadataBase` en el layout (`src/lib/seo/site.ts` valida que sea solo un origen). **Falta el dominio** (la persona propietaria aún no tiene) y las redirecciones `www`/`https`, que dependen del hosting. Antes: no había dominio ni `metadataBase`; `src/app/layout.tsx` no lo define (con una ruta relativa en canonical u Open Graph, el build falla). | Variable de entorno con el dominio canónico (p. ej. `SITE_URL`, añadida a `.env.example` con valor de ejemplo), usada en `metadataBase`, `robots` y `sitemap`. Elegir `www` o sin `www` y redirigir la otra variante con 301/308, igual que `http` → `https`. |
| S4 | P1 | ✅ **Resuelto 2026-10-18:** `alternates.canonical` absoluta en portada, directorio y servicios (`src/lib/seo/metadata.ts`, `pageMetadata`; una prueba exige que toda página la use). En los servicios sale del slug de la base, no de la URL pedida. Antes: Ninguna página tiene `<link rel="canonical">`. | `alternates.canonical` en la portada, en `/servicios` y en `/servicios/[slug]` (en las dinámicas, dentro de `generateMetadata`). |
| S5 | P1 | ✅ **Resuelto 2026-10-18:** `/servicios?…` declara como canónica `/servicios`, sin parámetros (verificado). Antes: `/servicios?category=…&q=…&sort=…&status=…&view=…` devuelve 200 con el mismo `title` y `description` que `/servicios`, sin canonical: variantes duplicadas. Los filtros son un formulario GET (los buscadores no suelen enviarlos), pero cualquier enlace externo las haría indexables. | Canonical de `/servicios` siempre sin parámetros. Si algún día se quiere indexar categorías, hacerlo con páginas propias (S8), no con parámetros. |
| S6 | P1 | ✅ **Resuelto 2026-10-18:** `og:title/description/url/site_name/locale es_VE/type/image` y Twitter `summary_large_image` en las tres páginas; imagen 1200×630 generada (`src/app/opengraph-image.tsx`, `twitter-image.tsx`, `src/lib/seo/share-image.tsx`) solo con la marca propia. La imagen se declara también en `pageMetadata` porque la de archivo no llega a las páginas con `openGraph` propio (verificado). Antes: Sin Open Graph ni Twitter Cards, ni imagen para compartir. | `openGraph` y `twitter` en la metadata (`og:locale` `es_VE`) y `opengraph-image` (archivo en `src/app/` o generado). Que la imagen no use logos ni marcas de terceros. |
| S7 | P1 | ✅ **Resuelto 2026-10-18:** `favicon.ico` (16 y 32 px), `icon.svg` y `apple-icon.png` (180 px) con el trazo de pulso; se regeneran con `node scripts/generate-icons.mjs`. Ya no hay errores de consola por el favicon. Antes: `/favicon.ico` → **404** (también aparece como error de consola en cada página). | `src/app/favicon.ico` o `icon.svg`/`icon.png`. El trazo de pulso (`#00c2a8`) ya está dibujado en `Header.tsx` y se puede reutilizar. |
| S8 | P1 | ✅ **Resuelto 2026-10-18:** `/categorias/<slug>` (URL elegida por la persona propietaria), una por categoría con servicios activos: title y metadescripción propios (de la descripción de la semilla), introducción, miga de pan visible, sus servicios con estado, enlaces a las demás categorías, canonical y Open Graph. 404 para slugs inexistentes o sin servicios. Enlazadas desde el directorio (enlaces HTML, no solo el `<select>`) y desde cada servicio; en el sitemap cuando la indexación esté abierta (81 URL en total). No hay índice `/categorias` (el directorio cumple esa función; da 404). Antes: No hay páginas de categoría indexables: solo el filtro `?category=` (la regla de la persona propietaria pone las categorías importantes en cuarto lugar de prioridad). | Páginas propias (p. ej. `/categorias/<slug>`) con `title`, descripción e introducción únicos y enlaces a sus servicios; añadirlas al sitemap. **Decidir la URL antes**: cambiarla después exige redirección permanente. |
| S9 | P1 | ✅ **Resuelto 2026-10-18:** `src/lib/seo/json-ld.ts`. Portada: `WebSite` + `Organization` (nombre, URL, logo `apple-icon.png` 180×180; nada más). Categorías y servicios: `BreadcrumbList` generado desde la misma lista que la miga de pan **visible** (`src/components/layout/Breadcrumbs.tsx`), añadida también a los servicios (Servicios / Categoría / Servicio). `<` escapado. Sin `SearchAction` (Google retiró ese cuadro de búsqueda), ni `Rating`/`Service`/`Product`. Pendiente de pasar por la prueba de resultados enriquecidos de Google con una URL pública. Antes: Sin datos estructurados. | `WebSite` y `Organization` en la portada, solo con datos reales (nombre, URL; sin teléfonos ni direcciones inventados). `BreadcrumbList` en los servicios **solo si** se añade una miga de pan visible (hoy no hay). No usar `Review`, `AggregateRating`, `Service` ni `Product` con datos demostrativos. Escapar `<` en el JSON como indica `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`. |
| S10 | P2 | ✅ **Resuelto 2026-10-18:** metadescripción = descripción propia del servicio (semilla) + "Consulta reportes ciudadanos, incidentes y el estado actual de {nombre} en Venezuela."; en apuestas, con la frase legal fija. 71 distintas (98–212 caracteres, media 135; lo esencial va al principio porque Google recorta hacia los 155–160). Antes: La descripción de las páginas de servicio es una plantilla ("Consulta reportes ciudadanos, incidentes y estado actual de {nombre} ({categoría}) en Venezuela."). La regla pide evitar textos automáticos cuando pueda escribirse uno mejor. | Incorporar `services.description` (neutra y con evidencia) en `generateMetadata`. |
| S11 | P2 | ✅ **Resuelto 2026-10-18, con una limitación de Next:** `src/app/not-found.tsx` con buscador y enlaces a Inicio y Servicios, dentro del layout (`lang="es"`, cabecera y pie). Para una URL inexistente sale en el HTML; para un **servicio** inexistente (`notFound()` en una página dinámica) Next 16.3 responde 404 con un documento de error (`__next_error__`, sin contenido en el HTML) que la pinta en el cliente: ya pasaba con la 404 por defecto (comprobado construyendo el commit anterior); un `not-found.tsx` en el segmento no lo cambia. Código 404 y `noindex` correctos en ambos casos. Arreglo posible a futuro: comprobar el slug en `proxy`, antes de renderizar. La doble etiqueta robots sigue (inofensiva). Antes: No hay `not-found.tsx` propio: la 404 por defecto no lleva `lang` ni enlaces a Inicio o Servicios. El código HTTP sí es correcto. Desde el 2026-10-11 la 404 lleva **dos** `<meta name="robots">`: el `noindex` que Next inyecta en toda respuesta 404 y la política global del layout (`noindex, follow` hoy; `index, follow` con la indexación abierta). Inofensivo (el código 404 ya impide indexar y Google aplica la regla más restrictiva), pero conviene limpiarlo al hacer la 404 propia. | `src/app/not-found.tsx` con navegación y enlace a `/servicios`. |
| S12 | P2 | **Parcial 2026-10-18:** `recharts` se carga de forma diferida y solo cuando una página de servicio pinta su gráfico (medido en producción: 0 KB en portada, directorio, mapa, estadísticas y servicios sin reportes; 406 KB sin comprimir donde hay gráfico). Sigue sin medirse con Lighthouse/PageSpeed (necesita dominio). Antes: Rendimiento sin medir (no hay dominio donde correr Lighthouse o PageSpeed). Todo se renderiza por petición (`force-dynamic`) y el directorio hace una consulta de estado por servicio (~0,15 s en local con 71). `recharts` está instalado y sin usar. | Medir en producción. Cachear o revalidar el directorio. Al usar `recharts`, cargarlo solo en la página de servicio (import dinámico). Los Core Web Vitals reales solo aparecen en Search Console con tráfico real. |
| S13 | P0 | ✅ **Resuelto 2026-10-18:** `npm run build` y `npm start` verificados. En producción local, `/robots.txt` y `/sitemap.xml` salen dinámicos (ƒ) y como en desarrollo; `noindex, follow` en las páginas; 404 real y 308 de la barra final. El build destapó que la portada se prerenderizaba con las cifras del build: corregido (`force-dynamic` + `tests/rendering.test.ts`). Antes: `npm run build` **no se pudo verificar** (bloqueaba `fonts.googleapis.com`). | Ejecutarlo en una máquina con internet antes de publicar y comprobar que `robots` y `sitemap` salen como se espera. |

## 5. Decisión de indexación mientras todo sea demostrativo

> **Decidido el 2026-10-11 por la persona propietaria: opción A (noindex global).**
> Implementación: `src/lib/seo/site.ts`. Todas las páginas llevan
> `<meta name="robots" content="noindex, follow">` (definido solo en el layout raíz;
> una prueba falla si una página define su propio `robots`), `robots.txt` permite el
> rastreo y el sitemap queda vacío. **Para abrir la indexación** el día que haya datos
> reales: `SITE_URL="https://<dominio>"` y `SITE_INDEXING="true"` en el entorno del
> servidor y reiniciarlo; sin cambios de código. Si se pide indexar con un dominio
> inválido, local o sin `https`, el sitio **sigue en noindex** y el servidor lo
> registra (`[seo] Indexación desactivada: …`). Ese día, repetir la sección 6 y
> comprobar que la etiqueta pasó a `index, follow` y que el sitemap trae las URL.

Contexto de la decisión:

Hoy los 71 servicios son `is_demo = true` y sin datos suficientes: cada página muestra
"Datos demostrativos" y el estado "Sin datos suficientes". Para Google serían páginas
casi idénticas entre sí y con poco contenido propio. La regla permanente dice que las
páginas públicas importantes deben permitir `index, follow` **salvo razón específica**;
esta podría serlo, pero la decisión es de negocio:

- **A. Publicar con `noindex` global** (robots y metadata) hasta tener datos reales, y
  abrir la indexación ese día. Más prudente; no se pierde nada porque aún no hay
  tráfico real que posicionar.
- **B. Indexar solo portada, directorio y categorías** (S8) y mantener las páginas de
  servicio en `noindex` hasta que tengan datos reales.
- **C. Indexar todo desde el primer día.** Cumple la regla al pie de la letra, con el
  riesgo de que Google trate las páginas de servicio como contenido delgado.

Recomendación de Claude: A o B. Elegida: **A**.

> **Ojo al desplegar:** `SITE_URL` y `SITE_INDEXING` tienen que estar definidas
> **también durante `npm run build`**, no solo al arrancar. Las páginas dinámicas las
> leen al servir, pero la 404 general (`/_not-found`) se genera en el build con los
> valores de ese momento (comprobado: con `SITE_URL` solo en el arranque, su
> `og:image` apuntaba a `localhost`).

## 6. Orden de trabajo y pasos para la persona propietaria

**Implementación** (un commit por bloque; cada uno termina con el resumen de la
sección 8):

1. S3 → dominio, `SITE_URL`, `metadataBase`, redirecciones. **Hecho salvo el dominio y
   las redirecciones** (2026-10-11).
2. S1 + S2 → `robots.ts` y `sitemap.ts`, con pruebas. **Hecho** (2026-10-11).
3. S4 + S5 + S6 + S7 + S11 → canonical, Open Graph, favicon, 404 propia. **Hecho** (2026-10-18).
4. S8 + S9 + S10 → categorías indexables, datos estructurados, descripciones de servicio. **Hecho** (2026-10-18). Para S9: las páginas de categoría ya tienen miga de pan visible, así que admiten `BreadcrumbList`.
5. S13 + S12 → build real y medición. **S13 hecho** (2026-10-18); S12 necesita dominio.

**Google Search Console — lo hace la persona propietaria** (Claude no tiene acceso y no
lo simula):

1. Tener el dominio definitivo con HTTPS y redirecciones `http` → `https` y `www` ↔ sin
   `www` (301/308) funcionando.
2. En Search Console: **Añadir propiedad** → tipo **Dominio** (verificación con un
   registro TXT en el DNS; cubre `http`, `https` y `www`). Alternativa: "Prefijo de
   URL" con la metaetiqueta HTML (`verification.google` en la metadata de Next, con el
   token que da Google).
3. **Sitemaps** → enviar `https://<dominio>/sitemap.xml`. Esperar el estado "Correcto" y
   comparar las URLs descubiertas con las esperadas (portada + directorio + 71
   servicios + categorías, según la decisión de la sección 5).
4. **Inspección de URLs** → la portada, `/servicios` y 3–5 páginas de servicio. Usar
   "Probar URL publicada" y, si Google puede acceder, **Solicitar indexación**
   (la cuota es limitada: solo las prioritarias).
5. **Páginas** (indexación) → revisar las "No indexadas" y su motivo (canónica
   alternativa, rastreada sin indexar, noindex…). **Configuración → Estadísticas de
   rastreo** para errores de rastreo; **Experiencia → Core Web Vitals** y **Mejoras**
   (datos estructurados) cuando haya datos.
6. Repetir a los 3–7 días, a las 2 semanas y al mes, y anotar el resultado en la
   sección 9. **Estar publicada no significa estar indexada**; `site:dominio` en
   Google es solo un indicio.

## 7. Checklist antes de publicar (estado actual)

- [ ] HTTPS funcionando — depende del hosting; no verificable en local.
- [ ] Dominio definitivo configurado — pendiente (S3).
- [ ] Redirecciones correctas — `/servicios/` → 308 verificado; `http` → `https` y `www` pendientes.
- [x] `sitemap.xml` funcionando — 200; vacío a propósito mientras rija el noindex (S2). Revisar al abrir la indexación.
- [x] `robots.txt` correcto — 200, sin bloquear el sitio (S1).
- [ ] `noindex` fuera de producción — **hoy el noindex es intencionado** (opción A). Al abrir la indexación: `SITE_INDEXING="true"` y comprobar `index, follow` en producción.
- [x] Canonicals correctos — absolutos y sin parámetros (S4, S5); toman el dominio de `SITE_URL`.
- [x] Titles únicos — portada, directorio y servicios.
- [x] Meta descriptions configuradas — mejorables en servicios (S10).
- [x] Páginas importantes enlazadas internamente — sí.
- [x] Sin enlaces rotos importantes — ninguno conocido.
- [x] Sin páginas importantes bloqueadas — no hay bloqueos.
- [x] URLs importantes responden `200` — en local.
- [x] Sin duplicados evidentes — las variantes con parámetros apuntan a `/servicios` (S5).
- [x] Sitio usable en móvil — 390 px sin desbordes.
- [x] Metadata social configurada — Open Graph y Twitter con imagen (S6).

**El proyecto no puede darse por técnicamente finalizado mientras haya P0 abiertos.**

## 8. Resumen de la auditoría del 2026-10-10

- **Comprobaciones realizadas:** códigos HTTP de las URLs clave, `title`/`description`/
  `robots`/canonical/Open Graph/JSON-LD de portada, directorio y servicios, cabeceras,
  variantes de URL (barra final, mayúsculas, parámetros), enlazado interno, móvil a 390 px.
- **Problemas detectados:** S1–S13 (sección 4).
- **Problemas corregidos:** enlaces internos rotos a páginas inexistentes (`src/lib/nav.ts`
  y su prueba), menú ausente en móvil, descripciones de portada y directorio
  desactualizadas.
- **Tareas pendientes:** S1–S13 y la decisión de la sección 5.
- **Acciones en Google Search Console:** las de la sección 6; ninguna se ha ejecutado.

## 9. Registro de revisiones

| Fecha | Quién | Qué se revisó | Resultado |
|---|---|---|---|
| 2026-10-10 | Claude (local, sin dominio) | Código en `next dev` | Este documento. Sin acceso a Search Console. |
| 2026-10-19 | Claude (local, preparación del despliegue) | Preparado Vercel + Neon (`docs/DESPLIEGUE-VERCEL.md`); `npm run build` + `npm start` con `/api/cron/engine` nuevo | `robots.txt` sin cambios (`/api/` sigue excluido, también el endpoint del motor); la política sigue en noindex. Primer sitio público será `https://<proyecto>.vercel.app` con `SITE_URL` apuntando a él (S3 avanza, sin dominio propio). Cuando haya dominio: `SITE_URL` al dominio y redirección 308 de `*.vercel.app` al dominio para no duplicar. **No desplegado:** nada verificado en Vercel ni en Search Console. |
| 2026-10-19 | Claude (local, sin dominio) | Panel `/admin` (Etapa 6a) | `noindex, nofollow` por meta y `X-Robots-Tag`; sin sesión, 307 a `/admin/acceso`; ausente de sitemap, de robots.txt y del enlazado público. |
| 2026-10-18 | Claude (local, sin dominio) | Gráfico histórico (Etapa 4d) en `npm run build` + `npm start` | JS descargado medido con Chromium: portada 454 KB y servicio sin reportes 463 KB, sin `recharts`; servicio con gráfico 870 KB (406 KB de `recharts`). Title y canonical de servicio sin cambios. |
| 2026-10-18 | Claude (local, sin dominio) | `/mapa` y `/estadisticas` (Etapa 4d) en `npm run build` + `npm start` | 200, title propio, canonical sin parámetros también con filtros (`/mapa?periodo=7d&servicio=…` → `/mapa`); sitemap con 85 URL con la indexación abierta. |
| 2026-10-18 | Claude (local, sin dominio) | `/incidentes` y `/metodologia` (Etapa 4d) en `npm run build` + `npm start` | 200, title propio, canonical absoluta, `pageMetadata`; en menú, pie y sitemap al activarse en `nav.ts` (83 URL con la indexación abierta); `/mapa` y `/estadisticas` siguen en 404 y fuera del sitemap. |
| 2026-10-18 | Claude (local, sin dominio) | S9 y S10 en `next dev` y `npm run build` + `npm start` (dominio ficticio) | JSON-LD extraído del HTML real y parseado: portada `WebSite` + `Organization`; categoría y servicios `BreadcrumbList` idéntico a la miga visible; URL absolutas con `SITE_URL`; 404 sin JSON-LD. 71 metadescripciones de servicio distintas. Chromium a 390 px sin desbordes ni errores. No pasado por la prueba de resultados enriquecidos de Google (necesita URL pública). |
| 2026-10-18 | Claude (local, sin dominio) | S8, páginas de categoría, en `next dev` y `npm run build` + `npm start` (dominio ficticio) | 8 categorías → 200; slug inexistente o en mayúsculas → 404; metadescripciones distintas; servicios enlazados = servicios activos de la base en las 8; directorio enlaza las 8; cada servicio enlaza su categoría; con `SITE_INDEXING=true`, `index, follow` y sitemap de 81 URL. Chromium a 390 y 1280 px sin desbordes ni errores. Sin dominio real ni Search Console. |
| 2026-10-18 | Claude (local, sin dominio) | Bloque 3 (S4–S7, S11) en `next dev` y en `npm run build` + `npm start`, con `SITE_URL=https://pulsove.example` (ficticio) y sin él | Canonical, `og:url`, `og:image` y `twitter:image` absolutas con el dominio configurado en portada, directorio (también con `?category=…`) y servicios; iconos y las dos imágenes 200; 404 propia con `lang="es"` vista en Chromium a 390 px (también la de servicio, tras cargar). La 404 general es estática: toma `SITE_URL` del **build**. Sin dominio real ni Search Console. |
| 2026-10-18 | Claude (local, sin dominio) | `npm run build` + `npm start` tras subir `next` a 16.3.8 | Rutas: `/`, `/servicios`, `/servicios/netflix` 200; `/servicios/no-existe` y `/servicios/NETFLIX` 404; `/servicios/` 308; `robots.txt` y `sitemap.xml` 200 (vacío); `noindex, follow`; `Cache-Control: private, no-store` en páginas; sin `X-Robots-Tag`. Portada dinámica comprobada (borrar reportes cambia la cifra sin reiniciar). `/favicon.ico` sigue en 404 (S7). |
| 2026-10-11 | Claude (local, sin dominio) | Opción A + S1, S2, S3 parcial, en `next dev` con tres configuraciones: por defecto (noindex), `SITE_URL=https://pulsove.example` + `SITE_INDEXING=true` (dominio ficticio, solo para probar) y `http://` + `true` (mal configurado) | Por defecto: `noindex, follow` en `/`, `/servicios`, `/servicios?category=…` y `/servicios/netflix`; `robots.txt` 200 sin `Sitemap:`; `sitemap.xml` 200 vacío; sin `X-Robots-Tag`; 404 real intacto. Indexable: `index, follow`, línea `Sitemap:` y 73 URL. Mal configurado: vuelve a noindex y lo registra. Sin dominio real ni Search Console. |
