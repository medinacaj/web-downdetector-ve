# SEO técnico e indexación — estado y pendientes

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
| S1 | P0 | `/robots.txt` → **404**. | `src/app/robots.ts`. En producción: `allow: /`, `disallow: /api/` (JSON sin valor de búsqueda; hoy solo el envío del formulario usa la API, no el renderizado) y `sitemap: <SITE_URL>/sitemap.xml`. En cualquier otro entorno: `disallow: /`. Decidir por una variable explícita, no por suposición, y **quitar el bloqueo al pasar a producción**. No listar nunca rutas administrativas (se protegen con autenticación y `noindex`). Se cachea por defecto: comprobar el resultado tras `next build`. |
| S2 | P0 | `/sitemap.xml` → **404**. | `src/app/sitemap.ts`: `/`, `/servicios` y `/servicios/<slug>` de los servicios `active = true` (la página de un servicio inactivo ya responde 404). Solo rutas disponibles según `nav.ts`; URLs absolutas con el dominio canónico; sin filtros ni parámetros. Lee la base de datos, así que debe ser dinámico o revalidarse (si no, queda congelado en el build). `lastModified` solo si es real: `services.updated_at` sirve únicamente si se actualiza al editar; no poner `new Date()` en todo. Una prueba debe fallar si aparece una ruta no disponible, una URL relativa o un duplicado. |
| S3 | P0 | No hay dominio ni `metadataBase`; `src/app/layout.tsx` no lo define (con una ruta relativa en canonical u Open Graph, el build falla). | Variable de entorno con el dominio canónico (p. ej. `SITE_URL`, añadida a `.env.example` con valor de ejemplo), usada en `metadataBase`, `robots` y `sitemap`. Elegir `www` o sin `www` y redirigir la otra variante con 301/308, igual que `http` → `https`. |
| S4 | P1 | Ninguna página tiene `<link rel="canonical">`. | `alternates.canonical` en la portada, en `/servicios` y en `/servicios/[slug]` (en las dinámicas, dentro de `generateMetadata`). |
| S5 | P1 | `/servicios?category=…&q=…&sort=…&status=…&view=…` devuelve 200 con el mismo `title` y `description` que `/servicios`, sin canonical: variantes duplicadas. Los filtros son un formulario GET (los buscadores no suelen enviarlos), pero cualquier enlace externo las haría indexables. | Canonical de `/servicios` siempre sin parámetros. Si algún día se quiere indexar categorías, hacerlo con páginas propias (S8), no con parámetros. |
| S6 | P1 | Sin Open Graph ni Twitter Cards, ni imagen para compartir. | `openGraph` y `twitter` en la metadata (`og:locale` `es_VE`) y `opengraph-image` (archivo en `src/app/` o generado). Que la imagen no use logos ni marcas de terceros. |
| S7 | P1 | `/favicon.ico` → **404** (también aparece como error de consola en cada página). | `src/app/favicon.ico` o `icon.svg`/`icon.png`. El trazo de pulso (`#00c2a8`) ya está dibujado en `Header.tsx` y se puede reutilizar. |
| S8 | P1 | No hay páginas de categoría indexables: solo el filtro `?category=` (la regla de la persona propietaria pone las categorías importantes en cuarto lugar de prioridad). | Páginas propias (p. ej. `/categorias/<slug>`) con `title`, descripción e introducción únicos y enlaces a sus servicios; añadirlas al sitemap. **Decidir la URL antes**: cambiarla después exige redirección permanente. |
| S9 | P1 | Sin datos estructurados. | `WebSite` y `Organization` en la portada, solo con datos reales (nombre, URL; sin teléfonos ni direcciones inventados). `BreadcrumbList` en los servicios **solo si** se añade una miga de pan visible (hoy no hay). No usar `Review`, `AggregateRating`, `Service` ni `Product` con datos demostrativos. Escapar `<` en el JSON como indica `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`. |
| S10 | P2 | La descripción de las páginas de servicio es una plantilla ("Consulta reportes ciudadanos, incidentes y estado actual de {nombre} ({categoría}) en Venezuela."). La regla pide evitar textos automáticos cuando pueda escribirse uno mejor. | Incorporar `services.description` (neutra y con evidencia) en `generateMetadata`. |
| S11 | P2 | No hay `not-found.tsx` propio: la 404 por defecto no lleva `lang` ni enlaces a Inicio o Servicios. El código HTTP sí es correcto. | `src/app/not-found.tsx` con navegación y enlace a `/servicios`. |
| S12 | P2 | Rendimiento sin medir (no hay dominio donde correr Lighthouse o PageSpeed). Todo se renderiza por petición (`force-dynamic`) y el directorio hace una consulta de estado por servicio (~0,15 s en local con 71). `recharts` está instalado y sin usar. | Medir en producción. Cachear o revalidar el directorio. Al usar `recharts`, cargarlo solo en la página de servicio (import dinámico). Los Core Web Vitals reales solo aparecen en Search Console con tráfico real. |
| S13 | P0 | `npm run build` **no se pudo verificar** en este entorno (bloquea `fonts.googleapis.com`). | Ejecutarlo en una máquina con internet antes de publicar y comprobar que `robots` y `sitemap` salen como se espera. |

## 5. Decisión pendiente de la persona propietaria: ¿indexar mientras todo sea demostrativo?

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

Mi recomendación es **A o B**. Sea cual sea la elección, hay que escribirla aquí y
acordarla con `robots.ts`, la metadata y el sitemap (una URL con `noindex` no va en el
sitemap). No hay una opción neutral: sin decidir, el valor por defecto sería C.

## 6. Orden de trabajo y pasos para la persona propietaria

**Implementación** (un commit por bloque; cada uno termina con el resumen de la
sección 8):

1. S3 → dominio, `SITE_URL`, `metadataBase`, redirecciones.
2. S1 + S2 → `robots.ts` y `sitemap.ts`, con pruebas.
3. S4 + S5 + S6 + S7 + S11 → canonical, Open Graph, favicon, 404 propia.
4. S8 + S9 + S10 → categorías indexables, datos estructurados, descripciones de servicio.
5. S13 + S12 → build real y medición.

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
- [ ] `sitemap.xml` funcionando — **404** (S2).
- [ ] `robots.txt` correcto — **404** (S1).
- [x] `noindex` de staging fuera de producción — no hay `noindex` en páginas públicas; al crear `robots.ts` hay que cuidar que no bloquee producción.
- [ ] Canonicals correctos — ninguno (S4, S5).
- [x] Titles únicos — portada, directorio y servicios.
- [x] Meta descriptions configuradas — mejorables en servicios (S10).
- [x] Páginas importantes enlazadas internamente — sí.
- [x] Sin enlaces rotos importantes — ninguno conocido.
- [x] Sin páginas importantes bloqueadas — no hay bloqueos.
- [x] URLs importantes responden `200` — en local.
- [ ] Sin duplicados evidentes — variantes con parámetros sin canonical (S5).
- [x] Sitio usable en móvil — 390 px sin desbordes.
- [ ] Metadata social configurada — ninguna (S6).

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
