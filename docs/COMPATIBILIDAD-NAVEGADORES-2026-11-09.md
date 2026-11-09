# Compatibilidad y recorridos de navegador — 09-11-2026

**Chromium aprobó los escenarios definidos; Firefox y WebKit no se ejecutaron.** La matriz de tres motores permanece `incomplete` y el proceso de navegador devuelve **1** porque faltan dos binarios. El proxy rechazó con HTTP 403 la descarga oficial de Playwright. No se declara compatibilidad con motores no ejecutados.

## Evidencia y alcance

- Ejecución final `b7eb2225175d556c`; inicio 09-11-2026 09:10:38; fin 09-11-2026 09:11:05, hora de Santiago. Instantes UTC en JSON.
- Código de aplicación sobre base `2c487d9e4c020cfaf49ff6e7fb9d636afd7ec450`; herramienta nueva en `29f4025`, SHA-256 `abe2dbebbeeaca4bd76834279306a42923f9723228e2f2bfdd0fd4837b510e0b`. No cambió el código funcional ni el esquema.
- Playwright 1.64.1, Chromium 154.0.8037.57, Linux headless. Anchos 320/1280 px, altura 900 px y temas claro/oscuro. Son perfiles de viewport, no teléfonos Android/iOS reales.
- Build de producción standalone de Next.js 16.4.4 en copia temporal y base nueva migrada/sembrada con catálogo ficticio. Se adaptó el driver de fixtures del ensayo de canarios, conservando aislamiento y limpieza. Snapshot de 163 archivos, hash `87cf664b4c26c491e5fa4efa500ada31733a2a545ffa4bb4987366cfac87e1d6`.
- Turnstile deshabilitado exclusivamente en ese fixture; no se contactaron Cloudflare ni proveedores del catálogo. Los POST de la interfaz se interceptaron y simularon; cero reportes al terminar. No prueba registro real, cuotas reales ni verificación del proveedor.

| Motor | Casos de página | Rondas de interacción | Estado |
| --- | ---: | ---: | --- |
| Chromium | 28 | 4 | Aprobado para los escenarios descritos |
| Firefox | 0 | 0 | Binario ausente; descarga bloqueada |
| WebKit | 0 | 0 | Binario ausente; descarga bloqueada |

## Comprobaciones en Chromium

Las siete páginas son inicio, directorio, Movistar, mapa, incidentes, estadísticas y metodología. En cada combinación de tema y ancho se comprobaron HTTP 200, un único main, ausencia de desbordamiento de página, tema aplicado y reglas axe seleccionadas (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`). Resultado: **cero hallazgos automáticos, errores JavaScript no controlados o errores de hidratación** registrados. No acredita WCAG completa ni sustituye lector de pantalla.

Cada una de las cuatro rondas verificó:

1. Salto al contenido con Tab y Enter.
2. Cambio de tema y persistencia tras recargar.
3. Navegación desde el menú y búsqueda de Movistar con filtro de telecomunicaciones.
4. Consentimiento obligatorio antes de enviar y los mensajes accesibles de éxito 201, cuota 429 y fallo de conexión, con respuestas simuladas.

Se interceptaron **12 POST** y no hubo escrituras inesperadas, redirecciones imprevistas ni errores de routing durante contextos activos. Tampoco se intentaron peticiones externas en la corrida final. Las lecturas pasan por `route.fetch` sin seguir redirecciones y después se entregan al navegador: este ensayo no mide rendimiento ni caché de red.

Capturas de revisión: [móvil claro](evidencias/navegador-movil-claro-2026-11-09.png) y [escritorio oscuro](evidencias/navegador-escritorio-oscuro-2026-11-09.png). Las cuatro capturas originales y el resultado por caso permanecen en `.runtime/browser-checks/b7eb2225175d556c/`. [JSON portable](evidencias/navegadores-2026-11-09.json).

## Seguridad del ensayo y regresión corregida

El destino se limita a un origen HTTP loopback sin usuario/contraseña, ruta extra, query ni fragmento. La selección de motores rechaza listas vacías y nombres desconocidos. Se bloquean service workers y escrituras distintas de los mocks, y los recursos de otro origen se rechazan.

La revisión independiente encontró un P2 en la primera implementación: `route.continue()` permite seguir una redirección sin repetir el guardia de origen. Se reprodujo con dos servidores locales: una petición alcanzó el segundo origen. Después se cambió el reenvío a `route.fetch({ maxRedirects: 0 })`, rechazando los estados de redirección antes de entregar la respuesta. La regresión real pasó: **cero peticiones al segundo origen y una redirección bloqueada**. No se usó Internet ni una credencial real en ese control.

Al repetir la matriz surgió una cancelación de prefetch mientras se cerraba el contexto. Se mantuvieron los handlers instalados hasta el cierre y se capturaron sus cancelaciones; un error de routing mientras el contexto está activo impide aprobar el motor. La corrida intermedia fallida se conserva, no se cuenta como aprobación. La repetición final aprobó Chromium completo con cero errores de routing.

La revisión no identificó otros defectos. Diez pruebas de guardias pasaron después de observarlas fallar frente al esqueleto. Suite final: **177 pruebas / 24 archivos**, estándares y tipos aprobados. El control real de redirecciones queda en `npm run smoke:browser-isolation`.

## Limpieza

El driver de fixtures terminó con salida 0: servidor detenido, base temporal ausente, copia temporal eliminada y cero errores de limpieza. Su salida no significa aprobación de la matriz completa: registró expresamente `browserExitCode=1`, estado `incomplete` y cero reportes escritos. Sus artefactos están en `.runtime/browser-fixtures/f383cd75f0fa2166/`; el driver local reproducible está en `.runtime/browser-fixture-driver.cjs`. La herramienta de navegador no inicia ni elimina un servidor suministrado por el usuario.

## Repetición

Se requieren Playwright Core 1.64.1, axe para Playwright y binarios compatibles fuera de las dependencias de la aplicación, como en el ensayo de accesibilidad existente. Con una instancia local ya iniciada, datos ficticios y Turnstile deshabilitado solo para ese fixture:

```sh
NODE_PATH=/workspace/.cloud-setup/browser/node_modules \
SMOKE_BASE_URL=http://127.0.0.1:3010 \
npm run smoke:browsers
```

Por defecto pide los tres motores. `BROWSER_ENGINES=chromium` limita el alcance y queda registrado. `CHROMIUM_PATH`, `FIREFOX_PATH` y `WEBKIT_PATH` permiten seleccionar binarios. El control aislado de redirecciones requiere Chromium en `/usr/bin/chromium` y el mismo NODE_PATH:

```sh
NODE_PATH=/workspace/.cloud-setup/browser/node_modules npm run smoke:browser-isolation
```

No se añadió una ejecución de navegador a CI ni se ejecutó GitHub Actions. Las pruebas unitarias de los guardias sí están incluidas en `npm test`.

## Desbloqueo de Firefox y WebKit

La prueba de descarga recibió HTTP 403 de CONNECT para `cdn.playwright.dev`. No se intentó evadir el proxy ni usar un mirror alternativo. Se guardó un borrador que añade exclusivamente `cdn.playwright.dev` y `playwright.download.prss.microsoft.com`, conservando `fonts.googleapis.com` y `fonts.gstatic.com` y los presets existentes. El estado de la herramienta fue `saved` con `requires_publish=true`; **guardar ese borrador no aplica el acceso**.

Para completar ambos motores hay que revisar, guardar y publicar la configuración del entorno, comprobar la política efectiva y descargar los binarios oficiales. Los cambios locales del proyecto deben conservarse antes de publicar: la restauración automática de commits locales del entorno no está verificada. Se preparó un respaldo Git verificable fuera del checkout; no contiene `.env`, dependencias ni archivos ignorados. La restauración de ese bundle se comprueba localmente, sin afirmar restauración de una futura tarea en la nube.

Después del acceso aprobado, la descarga puede instalarse bajo `/workspace/.cloud-setup/pw-browsers` mediante `PLAYWRIGHT_BROWSERS_PATH` y el CLI oficial de Playwright; usar la misma variable al ejecutar el runner. Se deben repetir los tres motores y conservar sus resultados. WebKit de Playwright no equivale a probar Safari o iOS reales; Edge, dispositivos físicos, lector de pantalla, TLS/CDN y hosting siguen pendientes.
