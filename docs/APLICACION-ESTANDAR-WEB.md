# Aplicación del estándar web integral

Fuente: [estándar del usuario, versión reforzada 03-11-2026](ESTANDAR-WEB-INTEGRAL.md), conservado íntegro. Esta matriz complementa [los controles del proyecto](ESTANDARES-Y-CONTROLES.md) y [la operación basada en ITIL](OPERACION-ITIL.md). No constituye una auditoría completa ni una certificación.

## Contexto y límites

PulsoVE es una aplicación Next.js con API pública, reportes ciudadanos seudónimos, PostgreSQL detrás del servidor y motor periódico. No hay un panel administrativo ni inicio de sesión operativo; las tablas de usuarios previstas no equivalen a autenticación implementada. No procesa pagos ni archivos subidos. Catálogo y pruebas usan datos demostrativos. Hosting, dominio, responsables y jurisdicción de infraestructura siguen sin fijarse.

Flujo relevante: navegador → API de reportes → validación/tamaño/Turnstile/cuotas → PostgreSQL → worker de agregación → vistas públicas. Cloudflare es un tercero de verificación cuando se habilita; el cliente no consulta PostgreSQL directamente. Las lecturas públicas seleccionan campos explícitos; no hay una garantía de anonimato derivada del hashing o la ausencia de login.

Amenazas priorizadas: inserción de registros inválidos o duplicados, agotamiento de recursos mediante cuerpos grandes/lentos, abuso del envío público, filtración de datos libres en reportes, dependencias vulnerables y fallos de operación. Se conservan separación de entornos, pruebas ficticias y ejecución serial del motor. No se contrataron servicios ni se alteraron DNS, producción o datos reales.

## Aplicabilidad por área del estándar

| Área | Aplicación y estado |
| --- | --- |
| 0. Contexto y proporcionalidad | Aplicado: se conserva el stack y se priorizan controles concretos; no se imponen proveedores. |
| 1. Arquitectura y código | Controles de lint, tipos, esquema y migraciones existentes; se añadió lector JSON acotado y migración de integridad. Verificación local, no prueba de escalabilidad distribuida. |
| 2. UI/UX y ergonomía | Tokens de estado adaptados a ambos temas, mensajes de envío/error/éxito anunciables y texto de privacidad corregido. Contraste sometido a comprobación automatizada. No se rediseñó el sitio por estética. |
| 3. Responsive y compatibilidad | Verificadas siete rutas en Chromium a 320/1280 px y en claro/oscuro (28 escenarios), sin desbordamiento de página; no se presume compatibilidad Safari/Firefox/Edge ni todos los dispositivos. |
| 4. Accesibilidad | Objetivo WCAG 2.2 AA: un único main, salto de contenido y anuncios de estado. Análisis automatizado no sustituye lector de pantalla ni evaluación manual completa. |
| 5. Rendimiento | Pendiente de medición específica. LCP ≤2.5s, INP ≤200ms y CLS ≤0.1 son objetivos del estándar, no resultados medidos. No hay datos suficientes de visitas reales/p75. |
| 6. Seguridad | Migración con preflight, límites de bytes/tiempo, allowlist de campos, cabeceras y actualización de dependencias; puerta detallada abajo. No hay protección absoluta ni ASVS completo acreditado. |
| 7. Cloudflare/CDN | Turnstile implementado, validación real pendiente de claves/dominio. WAF, DNS, origen/CDN y TLS del hosting están bloqueados por falta de configuración/acceso, no son servicios que se exija contratar. |
| 8. SEO | Se conservan robots/sitemap/metadata y el bloqueo de indexación por defecto para demos. Dominio, redirecciones, Search Console y estrategia editorial pendientes de despliegue. |
| 9. SEO local y mapas | LocalBusiness/NAP/rutas a un local: no aplicables sin negocio con sede verificable. El mapa nacional de reportes sí aporta contexto; no se añadieron geolocalización precisa ni datos inventados. |
| 10. CRO y confianza | Recorrido principal: consultar y reportar. Se mejora feedback y transparencia; no se añadieron testimonios ni métricas inventadas. Experimentación A/B no justificada con el tráfico actual. |
| 11. Privacidad y legal | Se aclara seudonimización y se advierte contra introducir datos personales. Responsable, contacto, retención, eliminación y textos legales finales siguen pendientes de definición y revisión apropiada. |
| 12. Analítica y observabilidad | No se agregan trackers ni banners decorativos. Métricas de operación/alertas siguen pendientes del hosting y de sus destinatarios; no hay resultados de analítica comercial. |
| 13. QA | Suite funcional, pruebas de PostgreSQL, instalación limpia, rechazo por datos incompatibles y comprobaciones de navegador. Evidencia abajo; no equivalen a pentest ni prueba de carga. |
| 14. DevOps/SRE/ITIL | Se amplía CI con ensayo de migraciones local. Procedimientos y roles definidos como funciones; personas, SLO, alertas y backup del hosting pendientes. |
| 15. Priorización | P1: rangos/duplicados y límites de payload; avisos críticos/altos de dependencias atendidos prioritariamente sin afirmar explotación. P1 accesibilidad: contrastes detectados por herramienta. |
| 16. Ejecución | Cambios aislados en rama, fixtures revertidas, sin reparación destructiva automática. Datos incompatibles bloquean la migración y exigen revisión. |
| 17–18. Aceptación y evidencia | Se distinguen verificado local, implementado sin verificar en producción, pendiente y no aplicable. La entrega no se considera publicada por compilar o guardar un commit. |
| 19–20. Principios y continuidad | Estándar enlazado desde AGENTS.md para próximas tareas; mejorar según riesgo y evidencia sin servicios o arquitectura innecesarios. |

## Puerta de seguridad de lanzamiento

| # | Control | Estado y alcance |
| --- | --- | --- |
| 1 | Secretos fuera del frontend | Pendiente de examen completo de bundle y configuración final del hosting; solo la site key pública se entrega intencionalmente al cliente. |
| 2 | Git y filtraciones de secretos | `.gitignore` implementado; escaneo completo de historial, push protection y permisos remotos pendientes. No se afirma ausencia de secretos históricos. |
| 3 | Claves públicas sin privilegios | Verificado en tests: el servidor exige resultado Turnstile para hostname/acción esperados; claves reales pendientes. |
| 4 | RLS cuando corresponda | No requerido para el diseño actual de acceso exclusivo por servidor. Revaluar si se permite acceso directo a DB, multi-tenancy o clientes con cuentas. |
| 5 | Cifrado y claves | TLS público/cifrado de respaldos y reposo pendientes de infraestructura; el dump local ficticio no acredita estos controles. |
| 6 | Autenticación confiable | No aplicable a reportes públicos sin login; obligatorio y pendiente para futuro panel privado. La beta aún necesita una barrera de acceso del hosting. |
| 7 | Titular/rol/operación | No hay recursos privados operativos de usuarios ni endpoints de administración que probar con dos cuentas. Pruebas cruzadas obligatorias cuando existan. |
| 8 | Campos protegidos | Verificado en integración: intentar enviar confidence/role/source de administrador no modifica confianza ni fuente decididas por el servidor. |
| 9 | Cookies y sesiones | No aplicable al login aún inexistente; implementación y pruebas pendientes antes de habilitarlo. |
| 10 | Hash adaptativo de contraseñas | No hay flujo de contraseñas operativo. La columna password_hash no demuestra hashing ni seguridad del futuro panel. |
| 11 | Límites y coste | Verificación local de cuotas existentes y nuevos límites de cuerpo (16 KiB, 5s). Hace falta comprobarlos detrás del proxy y limitar conexiones/solicitudes al nivel del hosting. |
| 12 | Antiabuso | Turnstile y cuotas con tests locales; claves reales, tráfico distribuido y tolerancia de redes compartidas pendientes. |
| 13 | Consultas parametrizadas | Uso de Drizzle/postgres y parámetros; la migración usa solo SQL revisado sin entradas del cliente. No se declara auditoría exhaustiva de toda consulta. |
| 14 | Validación confiable | Verificada en tests de API; la DB ahora añade CHECK y unicidad nacional. Campos fuera de allowlist se ignoran. |
| 15 | Salidas por contexto | React renderiza texto y hay sanitización existente; el script de tema es constante. Auditoría exhaustiva de todos los contextos XSS pendiente. |
| 16 | Archivos | No aplicable: no hay subida de archivos en el producto. |
| 17 | Exposición API | Selecciones explícitas existentes; revisión completa de retención, texto libre, agregados pequeños y moderación pendiente. |
| 18 | Cabeceras | Implementadas para HTML/API: nosniff, política de referencia, permisos, DENY y CSP parcial. No se restringen aún script-src/connect-src; no se presume una defensa XSS completa. |
| 19 | HTTPS/HSTS | HTTPS real pendiente del dominio/hosting. HSTS/preload no se activan antes de comprobar su impacto. |
| 20 | Dependencias y suministro | Next/eslint-config-next 16.4.4, Zod 4.6.7, Vitest/UI 5.1.0 y Drizzle Kit 0.31.11 verificados. Auditoría de producción: cero avisos; árbol completo: cero críticos/altos y 21 moderados de herramientas de desarrollo. Siguen bajo seguimiento; npm audit no es un pentest. |

## Migración 0002 y recuperación

La migración añade nueve CHECK para rangos de confianza, conteos, estadísticas y orden temporal, y UNIQUE NULLS NOT DISTINCT en buckets de baseline y ventanas. No añade cascadas de borrado ni corrige automáticamente datos existentes. Exige PostgreSQL compatible (el requisito del proyecto sigue siendo 16+).

En el flujo soportado `db:migrate:deploy`, Drizzle ejecuta los statements en transacción. Se adquieren bloqueos de escritura acotados por `lock_timeout=5s`; se verifica compatibilidad de filas y duplicados antes de cambiar índices/restricciones. Una incompatibilidad produce un mensaje genérico sin imprimir filas y revierte el cambio. Cada sentencia tiene límite de 60s; el tamaño de producción puede exigir una estrategia de migración por fases evaluada antes de aplicar.

Se conservan SQL y hashes históricos. El manifiesto se trasladó de `drizzle/meta/checksums.json` a `drizzle/checksums.json`: Drizzle interpretaba cualquier JSON del directorio meta como snapshot y no podía generar migraciones. El traslado no cambia los hashes anteriores.

El worker sigue requiriendo ejecución serial: la unicidad evita duplicados, pero no hace atómico ni distribuido el ciclo completo borrar/reinsertar. La migración no resuelve todavía semántica de borrado/retención, referencias administrativas ni recuperación automática de ventanas omitidas.

Ensayo reproducible: `DATABASE_URL` debe apuntar a una base local ficticia terminada en `_test`, con privilegio para crear bases, y después ejecutar `npm run smoke:migrations`. El script crea nombres aleatorios, prueba instalación limpia y rechazo de duplicados, comprueba conservación de filas/historial y elimina solo sus bases y archivos temporales. No utilizarlo para producción ni credenciales de aplicación restringidas.

El selector rechaza parámetros y fragmentos de URL antes de crear cualquier cliente, para impedir que opciones de conexión cambien la base de destino. La limpieza intenta cada recurso de forma independiente aunque una eliminación falle y conserva el error principal. Ambas propiedades tienen pruebas de regresión. El script no conecta a la base fuente para migrarla: solo usa bases nuevas de nombres aleatorios.

## Verificación local de esta entrega

- `npm run check:standards`, tipos, 145 pruebas y build completados. Sin cambios en SQL ni snapshots históricos 0000/0001.
- Migración aplicada a bases locales de desarrollo/pruebas. Instalación vacía, actualización y rechazo transaccional de duplicados verificados; las filas incompatibles del ensayo permanecieron intactas hasta eliminar su base temporal.
- Cabeceras comprobadas en HTTP para HTML/API y cuerpo grande rechazado con 413. La suite comprueba límites reales de bytes y timeout, y manipulación de campos protegidos.
- `npm run smoke:accessibility`: siete rutas × dos temas × dos anchos, cero hallazgos automáticos en las reglas WCAG seleccionadas y salto de contenido por teclado verificado. Revisión visual de servicio en móvil claro y escritorio oscuro. No acredita WCAG completa.
- Se retiraron promesas no medidas de tiempo y anonimato. Sin incidente abierto, se usa únicamente la ventana nacional: vacía, incompleta/futura, con más de 30 minutos o confianza cero muestra datos insuficientes. Ese umbral es una precaución de dos ciclos del worker, no un SLO comercial.
- Revisión independiente de migración, API y herramientas; los dos hallazgos de seguridad/limpieza del smoke se corrigieron y verificaron. CI está configurado, no se ejecutó en GitHub ni se publicó el sitio.

CI añade `npm run audit:dependencies`, que evalúa también dependencias de desarrollo y falla ante avisos altos/críticos o errores del análisis. Los 21 moderados pendientes no quedan declarados solucionados ni se fuerza su actualización incompatible. `npm run audit:production` permite comprobar separadamente el árbol desplegable.

Para repetir la prueba de navegador, iniciar la aplicación con datos ficticios. Se necesitan Chromium y los paquetes opcionales `playwright-core` y `@axe-core/playwright`, instalados fuera de la aplicación (en este entorno, `NODE_PATH=/workspace/.cloud-setup/browser/node_modules`). Ejecutar `npm run smoke:accessibility`; `SMOKE_BASE_URL` permite seleccionar el servidor de pruebas y `CHROMIUM_PATH` el navegador. El reporte se guarda en `.runtime/accessibility-results.json`, ignorado por Git.

Vitest 5 requiere Node 22.12+ de la serie 22 o una versión compatible de las series 24/26+. CI usa Node 22 actualizado y el entorno local usa 24.19.0. El config se expresa como ESM en `vitest.config.mts`. No se usaron `--force`, `--legacy-peer-deps`, verificaciones TLS deshabilitadas ni assertions omitidas para resolver compatibilidad.

## Evidencia y siguientes pasos

Registrar resultados de la ejecución en la entrega y conservar los scripts de prueba. Pendientes de publicación: integrar/revisar cambios en GitHub, elegir hosting/dominio, permisos mínimos, claves reales, acceso de beta, backup cifrado y recuperación en ese entorno, responsables y política de privacidad/retención. Pendientes de evaluación: navegadores adicionales, lector de pantalla, carga, Core Web Vitals reales y revisión de seguridad/secretos completa. No se autorizó ni ejecutó publicación.
