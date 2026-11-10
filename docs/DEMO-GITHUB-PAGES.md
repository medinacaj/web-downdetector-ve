# Demo visual de PulsoVE en GitHub Pages

Objetivo: revisar diseño y navegación desde el navegador, sin Docker en el equipo del visitante. La demo usa fixtures públicas y deterministas, no una base real. Los formularios no envían ni guardan datos, y su confirmación solo indica que terminó una prueba visual. El aviso de demostración aparece en todas las páginas. Los proveedores reales no reciben actividad ficticia ni estados de caída inventados.

## Construcción y comprobación

Desde la rama fuente `feat/github-pages-demo`:

```sh
npm ci
npm run build:demo
npm run check:standards
npm run test:unit
# Chromium y playwright-core deben estar disponibles para esta prueba:
NODE_PATH=/ruta/al/node_modules/de/playwright-core npm run smoke:demo
```

El sitio exportado queda en `.runtime/pages-demo/out`. La construcción toma una lista explícita de archivos fuente, excluye `.env` y las rutas API, superpone adaptadores de fixtures y ejecuta `next build` con `output: export`. No conecta a PostgreSQL. Los componentes y consultas de producción permanecen sin cambios. El catálogo, categorías, regiones y tipos de problema provienen de las semillas públicas.

Se configura `basePath: /web-downdetector-ve`, `trailingSlash: true`, etiquetas `noindex` y `robots.txt` con `Disallow: /`. Se publica `.nojekyll` para conservar `_next`. No cambiar el nombre del repositorio o prefijo sin reconstruir y probar otra vez.

La prueba Chromium sirve únicamente archivos estáticos bajo ese prefijo. Verifica navegación, recarga directa de fichas, búsqueda desde portada, filtros y Atrás, estado vacío, tema, formulario sin escrituras HTTP ni falsa confirmación de guardado, móvil, noindex y ausencia de errores o recursos 404. Las capturas y resultado se guardan en `.runtime/pages-evidence`. No acredita una evaluación WCAG completa ni pruebas en otros navegadores.

## Activación de GitHub Pages

La rama `gh-pages` debe contener únicamente la exportación estática, en la raíz. No copiar la carpeta de staging completa, fuentes, `.env`, bases, archivos `.next/server` ni `node_modules`.

En GitHub, abrir **Settings → Pages** del repositorio y seleccionar:

- **Source:** Deploy from a branch.
- **Branch:** `gh-pages`.
- **Folder:** `/ (root)`.
- Guardar y esperar a que GitHub indique que el sitio se publicó.

La dirección esperada es `https://medinacaj.github.io/web-downdetector-ve/`. La presencia de una rama no prueba que Pages esté habilitado ni que el sitio esté accesible. Si ya existe un sitio o una fuente de publicación distinta, revisar esa configuración antes de cambiarla.

Esta publicación fue solicitada por el propietario para evaluar el proyecto. No requiere credenciales de aplicación ni nuevos proveedores de datos. GitHub entrega la página y sus recursos; los campos de la demo no se transmiten al servidor. El tema se conserva localmente en el navegador. La ubicación y condiciones de la infraestructura de una futura producción siguen pendientes; esta vista previa no acredita cumplimiento legal, ITIL, ISO o disponibilidad de producción.

Para retirar la vista previa, el propietario puede deshabilitar Pages desde la misma configuración. No se necesitan cambios en la base de datos ni en `main`.
