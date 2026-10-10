---
paths:
  - "src/app/**"
  - "src/components/**"
  - "src/lib/seo/**"
  - "next.config.mjs"
  - "public/**"
---

# SEO técnico e indexación (instrucciones permanentes de la persona propietaria)

Valen para todo proyecto web suyo. **Desarrollo + publicación + SEO técnico +
indexación son una sola entrega**: un proyecto no está terminado porque compile,
se vea bien, tenga dominio o esté publicado. Debe poder ser descubierto,
rastreado, interpretado e indexado por Google.

## Principios

- Integra el SEO técnico mientras desarrollas, no como tarea posterior.
- Evita configuraciones que bloqueen rastreo o indexación. Prioriza las páginas
  estratégicas y comerciales.
- Comprueba el comportamiento real en producción, no solo en desarrollo.
- Documenta lo que dependa de la persona propietaria o de accesos externos.
- **Si no tienes acceso a Google Search Console u otra herramienta externa, no
  simules que la usaste**: deja los pasos exactos para la persona propietaria.
- **Nunca asumas que una web está indexada solo porque está publicada.**
- **Nunca elimines ni cambies una URL posicionada sin evaluar antes una
  redirección permanente** (301/308).
- Tras cambios relevantes de URLs, dominio, arquitectura, navegación, framework,
  rutas o contenido estratégico, vuelve a revisar sitemap, robots, canonical,
  redirecciones, enlaces internos, titles, metadata e indexabilidad.

## Rastreo e indexación

- `robots.txt`: no bloquear el sitio completo, páginas importantes ni recursos
  necesarios para renderizar; reglas apropiadas para producción; incluir
  `Sitemap: https://dominio/sitemap.xml`. Al pasar de staging a producción,
  quitar todo bloqueo temporal. Nunca listar ahí URLs administrativas sensibles.
- `sitemap.xml`: solo URLs públicas e indexables, absolutas y canónicas; sin
  `noindex`, privadas, administrativas, temporales ni irrelevantes; accesible con
  respuesta 200; generado automáticamente cuando el proyecto lo permita y
  actualizado al crear o eliminar páginas importantes.
- Indexabilidad: las páginas públicas importantes permiten `index, follow`. Antes
  de publicar revisa `<meta name="robots">`, `X-Robots-Tag`, configuración del
  framework y del hosting, middleware, headers HTTP, reglas de CDN y herencias de
  staging.

## Metadatos

- `<title>` único, descriptivo y ligado a la intención de búsqueda; sin keyword
  stuffing ni genéricos ("Inicio", "Página", "Welcome", "Untitled", solo el nombre
  del sitio).
- Meta description específica por página importante; sin duplicados ni textos
  genéricos automáticos cuando pueda escribirse una mejor.
- `<link rel="canonical">` coherente en cada página indexable. Evita duplicados
  por parámetros, URLs alternativas, HTTP/HTTPS, `www`/sin `www`, trailing slash y
  mayúsculas; consolida con redirecciones permanentes.
- Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) y Twitter/X
  Cards en las páginas importantes.
- Datos estructurados Schema.org solo si el tipo de sitio lo justifica y
  corresponden al contenido **visible** (Organization, LocalBusiness, Product,
  Article, BreadcrumbList, FAQ, Event).

## URLs, enlaces y arquitectura

- HTTPS. `200` en páginas válidas; `301`/`308` en redirecciones permanentes;
  `404` real en lo inexistente; sin cadenas de redirecciones, sin soft 404 y sin
  enlaces internos que terminen en error.
- Toda página importante tiene enlaces internos HTML rastreables, no queda
  aislada y sigue una jerarquía lógica. No depender solo de JavaScript complejo,
  búsquedas internas o parámetros para llegar a ella.
- Evita varias URLs con el mismo contenido; no indexes filtros ni parámetros sin
  valor SEO.
- Apps JavaScript (React, Next, Vue…): el contenido importante debe poder
  descubrirse y procesarse; prefiere SSR/SSG/prerenderizado y metadata generada en
  el servidor. Que se vea bien en el navegador no basta.
- Rendimiento y móvil (Core Web Vitals): sin imágenes excesivas, JS innecesario,
  recursos que bloqueen la carga ni saltos de layout. La versión móvil no pierde
  contenido, navegación, enlaces ni metadata respecto al escritorio.

## Prioridad de indexación

1. Home. 2. Páginas principales de servicios o productos. 3. Landing pages
estratégicas. 4. Categorías importantes. 5. Contenido para tráfico orgánico.
6. Páginas comerciales relevantes. Para ellas revisa titles, descriptions,
contenido, canonical, enlaces internos, sitemap e indexabilidad.

## Google Search Console

Deja el sitio listo para añadirse y verificarse: facilita la verificación,
comprueba que Google pueda acceder, prepara y valida el sitemap, identifica las
páginas a indexar y detecta bloqueos. Cuando haya acceso, después de publicar:
añadir o verificar la propiedad, enviar `sitemap.xml`, confirmar que Google lo lee,
inspeccionar las URLs prioritarias, solicitar indexación si hace falta y revisar
páginas indexadas y no indexadas, errores de rastreo, canonicalización, sitemap y
datos estructurados. Sin acceso: documentar los pasos, no simularlos.

## Checklist antes de publicar

- [ ] HTTPS funcionando y dominio definitivo configurado.
- [ ] Redirecciones correctas (http→https, www, trailing slash).
- [ ] `sitemap.xml` y `robots.txt` correctos y accesibles.
- [ ] `noindex` de staging eliminado de producción.
- [ ] Canonicals correctos; titles únicos; meta descriptions configuradas.
- [ ] Páginas importantes enlazadas internamente, sin enlaces rotos importantes y
      sin bloqueos.
- [ ] URLs importantes responden `200`; sin duplicados evidentes.
- [ ] Sitio usable en móvil; metadata social configurada cuando corresponda.

No marques el proyecto como finalizado si quedan problemas críticos de rastreo,
indexación o accesibilidad técnica. Termina cada entrega web con un resumen breve:
**comprobaciones realizadas, problemas detectados, corregidos, tareas pendientes y
acciones necesarias en Google Search Console**.

## En este repositorio

- Convenciones de Next 16 para esto (léelas antes de escribir código; AGENTS.md lo
  exige): `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md`,
  `.../sitemap.md`, `.../opengraph-image.md`,
  `.../04-functions/generate-metadata.md` y `01-app/02-guides/json-ld.md`.
- Estado real y tareas pendientes: sección "Brechas conocidas" de `CLAUDE.md` y
  `docs/SEO-PENDIENTE.md`.
