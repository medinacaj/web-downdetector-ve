# Operación de PulsoVE basada en prácticas ITIL

Procedimiento proporcional a un sitio pequeño, relacionado con [los controles del proyecto](ESTANDARES-Y-CONTROLES.md). No acredita certificación ni la implantación completa de ITIL o ISO/IEC 20000-1. Los responsables, horarios y compromisos necesitan asignación y acuerdo antes de atender una beta con usuarios.

## Servicio y configuración

Servicio `SVC-PULSOVE`: recibir señales ciudadanas y presentar el estado estimado de servicios de Venezuela. No promete disponibilidad de los proveedores monitoreados ni confirma una interrupción sin evidencia suficiente.

| Componente | Relación / fuente de configuración | Evidencia por mantener |
| --- | --- | --- |
| CI-WEB | Next.js, API y páginas; versiones en package-lock.json | SHA, release, dominio, hosting/región y responsable |
| CI-DB | PostgreSQL, esquema Drizzle y migraciones | proveedor, versión mayor, versión de esquema, cuentas por rol, backup; nunca credenciales |
| CI-WORKER | scripts/aggregate-scheduled.sh, ventana de 15 minutos, un host | identificador del programador, última ejecución válida, duración y alerta por ausencia |
| CI-REDIS | opcional en desarrollo; compartido para varias instancias | proveedor, capacidad, alertas y política de persistencia |
| CI-TURNSTILE | proveedor externo de verificación | dominio autorizado, responsable y fecha de rotación; nunca claves |
| CI-GITHUB | repositorio y CI | reglas de protección, permisos, ejecuciones y artefactos del SHA publicado |

No se inventan direcciones, servidores ni responsables. El despliegue debe completar este inventario en un registro privado del entorno y relacionar cada cambio con los componentes afectados. `docs/BETA-PRIVADA.md` conserva los pasos técnicos de despliegue.

## Roles y evidencias

| Rol | Responsabilidad | Situación |
| --- | --- | --- |
| Propietario del servicio | alcance, riesgos aceptados, recursos, objetivos y autorización de salida | Persona por confirmar |
| Mantenedor/implementador | cambios, pruebas, documentación y observación posterior | Asignar por RFC/PR |
| Revisor/aprobador | comprobar evidencia y autorizar el cambio según riesgo | Asignar por cambio; buscar revisión distinta del autor cuando sea posible |
| Coordinador del incidente | priorizar, llevar línea de tiempo y coordinar comunicaciones | Asignar al abrir incidente |
| Responsable de datos/DB | acceso, retención, backups y recuperación | Persona por confirmar |

Un agente no se asigna autorizaciones humanas ni asume responsabilidad legal del servicio. Registrar aprobaciones reales y excepciones; no rellenarlas con nombres supuestos.

## Cambios y releases

1. Abrir RFC/Issue con motivo, impacto, componentes y datos afectados, prioridad y criterio de éxito. Usar `.github/ISSUE_TEMPLATE/cambio.yml`.
2. Clasificar: **estándar** solo si existe procedimiento de bajo riesgo previamente autorizado; **normal** requiere evaluación y autorización según riesgo; **emergencia** restaura/contiene un incidente urgente con autoridad identificada y revisión posterior. Urgencia no elimina evidencia ni controles de seguridad.
3. Implementar en rama, asociar PR y RFC, ejecutar controles aplicables y registrar comando, resultado y SHA. Separar hechos, hipótesis y pruebas no ejecutadas.
4. Para cambios de datos: validar migración desde base vacía y versión anterior, duración/bloqueos, backup restaurable y compatibilidad de web/worker; dejar plan de recuperación probado o sus límites explícitos.
5. Antes de desplegar: obtener autorización, verificar destino/ventana, respaldo, criterio de abortar y persona a cargo. No fusionar ni publicar automáticamente por tener tests verdes.
6. Después: comprobar rutas representativas, reporte autorizado de prueba, continuidad del motor y métricas. Registrar resultado y release exacta. Cerrar con evidencia o revertir/corregir según el plan.

Plantilla de PR del repositorio registra estos puntos. Exigir esos controles en GitHub necesita configuración remota: una plantilla no bloquea merges por sí sola.

## Incidentes operativos

Las tablas `incidents` e `incident_regions` representan señales de los **proveedores monitoreados**. Los incidentes del propio PulsoVE se registran en un Issue operativo con `.github/ISSUE_TEMPLATE/incidente-operativo.yml` o en un canal privado si incluyen seguridad o datos sensibles.

Prioridad interna inicial según impacto y urgencia, revisable por el coordinador:

| Prioridad | Criterio de ejemplo | Acción |
| --- | --- | --- |
| P1 | sitio inaccesible de forma general, pérdida de datos o sospecha creíble de exposición | convocar al responsable disponible, contener y preservar evidencia; no esperar un SLA aún inexistente |
| P2 | capacidad principal degradada: reportes rechazados de forma amplia, worker sin procesar ventanas | coordinar restauración prioritaria y comunicar alcance |
| P3 | fallo parcial con alternativa razonable | planificar corrección y seguimiento según impacto |
| P4 | consulta o mejora sin interrupción actual | registrar y priorizar en backlog |

Flujo: registrar detección UTC y evidencia depurada → asignar coordinador → evaluar impacto/urgencia → contener → restaurar → comprobar servicio → comunicar → cerrar. Registrar cada acción y resultado. No borrar logs/filas para ocultar síntomas. Preservar evidencias con acceso restringido y sin copiarlas indiscriminadamente a Issues.

Comunicar qué capacidad afecta, desde cuándo, alcance conocido y próxima actualización acordada; no atribuir causas sin pruebas. No se prometen tiempos de respuesta o cobertura 24/7 sin personas y recursos asignados.

Cierre: rutas y capacidades afectadas verificadas, observación suficiente acordada, impacto documentado y aceptación del responsable. Si la causa no está resuelta, enlazar un problema con dueño y fecha de revisión.

## Problemas y mejora continua

Restaurar servicio puede cerrar un incidente sin conocer la causa definitiva. Abrir registro de problema para recurrencias, incidentes graves o causas desconocidas: incidentes relacionados, evidencia, hipótesis, causa corroborada o aún desconocida, workaround, riesgo residual y RFC de solución. No declarar una causa raíz por intuición.

En cada revisión de release y, cuando haya operación continua, en una revisión periódica acordada: revisar fallos repetidos, tiempo observado de detección/restauración, ejecuciones omitidas del motor, restauraciones, dependencias y excepciones. Elegir mejora medible, responsable y evidencia de cierre. Una lista de tareas sin responsables no es un proceso implantado.

## Respaldo y recuperación

Antes de producción, el propietario y responsable de datos acuerdan **RPO** (pérdida de datos tolerable) y **RTO** (tiempo tolerable de recuperación). No se asignan valores comerciales sin autorización. Diseñar frecuencia, PITR si procede, retención y alertas según esos objetivos.

1. Usar backups cifrados, acceso restringido, separación del fallo de la base principal y credenciales de mínimo privilegio. Definir retención y eliminación de respaldos, sin retener datos personales indefinidamente por defecto.
2. Comprobar éxito y antigüedad de backups; un archivo presente no prueba recuperación.
3. Ensayar restauración en **una base aislada nueva**, con controles de acceso equivalentes. No sobrescribir producción para hacer una prueba.
4. Verificar esquema, versión de migraciones, conteos/consistencia y consultas funcionales. Registrar el punto recuperado y el tiempo real, y compararlos con RPO/RTO acordados.
5. Documentar fallos, mejoras y autorización antes de una recuperación real. Eliminar con control solo el entorno y los archivos de ensayo creados para esa prueba.

La prueba local con datos ficticios demuestra el mecanismo de dump/restore, no el cifrado, disponibilidad, permisos ni objetivos del futuro hosting.

Ensayo de desarrollo verificado el 2026-11-03: `pg_dump` en formato custom desde `pulsove_test`, restauración con `pg_restore --exit-on-error` en una base temporal nueva, conteos coincidentes de todas las tablas de `public` y `drizzle`, y consulta del servicio `movistar` correcta. Se eliminaron exclusivamente la base temporal y los archivos del ensayo. No se modificaron ni restauraron datos de producción. El resultado no acredita un backup programado, PITR ni RPO/RTO de producción.

## Objetivos, alertas y continuidad pendientes

Se implementan dos señales HTTP mínimas, con respuestas genéricas y `Cache-Control: no-store`:

| Ruta | Uso | Alcance |
| --- | --- | --- |
| `/api/health/live` | Vida del proceso: 200 si el handler responde | No contacta DB ni demuestra que reportes/worker funcionen |
| `/api/health` | Disponibilidad mínima de lectura: 200 o 503 | Conexión PostgreSQL y lectura de `services.id`; no devuelve datos, versiones, host ni errores internos |

La comprobación de DB comparte una sola consulta pendiente y cachea el resultado cinco segundos mediante reloj monotónico. Responde con presupuesto de dos segundos; si la consulta no termina, no acumula otras. El pool de salud añade como máximo una conexión por proceso, con límite de conexión de dos segundos y statement timeout de 1.5 segundos. Incorporar esa conexión al presupuesto de réplicas/hosting. No es un límite global entre instancias ni una garantía de latencia bajo saturación del proceso.

Un fallo de DB no debe usarse por sí solo como orden de reinicio del proceso: separar readiness de liveness al configurar el proveedor. Estas señales no comprueban Redis, Turnstile, todas las tablas/migraciones, permisos de escritura, frescura del worker ni el recorrido completo de un reporte. Complementarlas con tasas de error y pruebas funcionales autorizadas. Detrás de una barrera de beta privada, configurar la identidad del monitor sin publicar credenciales ni introducir un bypass general.

Los fallos no manejados de API y worker generan JSON con únicamente `timestamp`, `level`, `event`, `reference` y `category`. La API entrega esa referencia aleatoria en `error.details.reference` para relacionar un 500 con el evento del servidor. No se aceptan referencias externas ni se serializan la excepción, SQL, parámetros, mensajes, URL, cabeceras, IP o cuerpo. Las respuestas de error tampoco se cachean. Son categorías limitadas para triage, no trazas completas ni evidencia de auditoría inmutable.

La captura, protección, retención y alertas sobre esos logs deben configurarse en el hosting. Si falla su destino, la API conserva una respuesta controlada; la referencia no garantiza que el evento haya sido retenido. Este control no sanea automáticamente logs del proveedor de DB, del proxy ni de herramientas CLI de desarrollo. Reproducir fallos en un entorno controlado con fixtures antes de añadir diagnósticos que puedan exponer datos reales.

Ensayo reproducible: ejecutar build y luego `npm run smoke:health` con `DATABASE_URL` local terminada en `_test`, sin parámetros/fragmentos y con permiso para crear bases de fixtures. Crea una base y un servidor temporales, verifica 200→503→200 al retirar/restaurar una tabla, independencia de liveness y errores reales de API/worker sin SQL ni canarios privados en logs. Elimina únicamente sus recursos de ensayo; no modifica la base fuente. CI ejecuta esta prueba tras build; una ejecución local no acredita CI remoto ni monitoreo desplegado.

Definir SLI/SLO antes de publicitar un nivel de servicio: proporción de solicitudes válidas atendidas, latencia, antigüedad de la última ventana procesada y posibilidad de recuperar datos. Distinguir error del producto de token inválido o cuota correctamente aplicada. Evitar métricas que registren identificadores personales.

Configurar alertas por caída web/DB, error del worker, ausencia de ciclos, capacidad y backup fallido/antiguo. Las alertas necesitan destinatario, cobertura y escalamiento confirmados. El worker actual no recupera automáticamente ventanas perdidas ni coordina varios hosts. Falta validar esos controles en el hosting y ensayar recuperación, comunicación y gestión de incidentes con las personas asignadas.
