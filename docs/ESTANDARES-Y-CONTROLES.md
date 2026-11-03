# Estándares y controles de PulsoVE

Perfil elegido por la persona propietaria: buenas prácticas verificables para operar el sitio. Este documento define una línea base del proyecto, no una certificación ni una declaración de conformidad total con ITIL, ISO, OWASP o WCAG. Una norma formal requiere fijar edición, alcance, requisitos, responsables y evidencia propios de esa evaluación.

## Alcance y referencias

Comprende código, esquema de datos y procedimientos de operación de PulsoVE. Los incidentes detectados sobre proveedores son datos del producto; no sustituyen la gestión de incidentes del propio sitio.

Referencias de orientación, sin afirmar cobertura completa de sus requisitos:

- [ITIL / PeopleCert](https://www.peoplecert.org/ITIL): prácticas de incidentes, problemas, habilitación de cambios, configuración y mejora continua.
- [ISO/IEC 20000-1](https://www.iso.org/standard/70636.html): referencia de gestión de servicios; no se ha implantado ni auditado un sistema de gestión conforme a esta norma.
- [ISO/IEC 27001](https://www.iso.org/standard/27001): referencia de gestión de riesgos y seguridad; no hay certificación de un SGSI.
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/): referencia para preparar una futura matriz de verificación de seguridad de la aplicación.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): objetivo propuesto AA para la interfaz; requiere evaluación manual y automatizada antes de afirmarlo.

Jurisdicción del producto: Venezuela y países donde efectivamente operen infraestructura y terceros. Hosting, región, responsable de datos y base jurídica siguen por definir. No se infieren a partir del entorno local.

## Nomenclatura

| Elemento | Convención | Control actual |
| --- | --- | --- |
| Componentes, tipos, interfaces | PascalCase: `ReportForm`, `CreateReportInput` | ESLint: tipos y nombres de variables/funciones permitidos |
| Variables y funciones ordinarias | camelCase: `verifyTurnstile` | ESLint permite camelCase, PascalCase y UPPER_CASE para admitir componentes/constantes; revisión verifica el uso semántico |
| Constantes y variables de entorno | UPPER_SNAKE_CASE: `DATABASE_URL` | Revisión; no todas las propiedades externas se renombran |
| Archivos de componentes | PascalCase.tsx | Revisión; no se aplica renombrado masivo |
| Módulos ordinarios | kebab-case.ts | Revisión; convenciones especiales de Next.js (`page.tsx`, `route.ts`, `[slug]`) se conservan |
| Tablas y columnas SQL | inglés, snake_case, ASCII, máximo 63 bytes | `npm run check:schema` |
| Relaciones ordinarias | `<entidad_singular>_id`, FK explícita | Control de columnas `_id`, con excepciones enumeradas abajo |
| Tiempos | instantes PostgreSQL con zona; evidencia operativa ISO 8601 UTC | Control de timestamps del esquema; horario de negocio America/Caracas se conserva |
| Migraciones | `NNNN_descripcion_en_snake_case.sql` | Journal secuencial + checksum SHA-256 |
| Cambios y versiones | rama específica, PR, commit identificable y etiqueta de release revisada | Plantilla de PR; protecciones remotas aún no verificadas |

No se cambian nombres de APIs externas ni migraciones ya aplicadas por uniformidad estética. Los índices históricos con abreviaturas (`aw_`, `tc_`) se conservan; para nuevos índices usar `<tabla>_<columnas>_idx`, y para restricciones nombres descriptivos dentro del límite de PostgreSQL.

## Puertas de calidad

```sh
npm ci
npm run check:standards
npm run typecheck
# DATABASE_URL debe señalar exclusivamente una base de pruebas aislada:
npm test
npm run build
```

`check:standards` ejecuta ESLint sin advertencias admitidas, validación de esquema de código, integridad del historial de migraciones y concordancia del diccionario con el esquema. Ninguno de esos comandos inspecciona por sí mismo el estado de una base de producción. Los tests de esquema y migraciones incluyen entradas defectuosas para comprobar que los controles pueden fallar.

CI ejecuta esas puertas salvo build, que sigue siendo una comprobación local de release por su acceso a fuentes externas. Su configuración no demuestra que una ejecución remota o una protección de rama estén activas. Para proteger la rama remota se debe exigir PR, revisión y el estado CI del SHA de la entrega, limitar bypass y verificar permisos desde GitHub.

### Migraciones

1. Crear migración nueva y descripción del cambio; no usar `db:migrate`/push en producción.
2. Revisar SQL, journal y snapshot, incluyendo SQL generado automáticamente; no basta con que Drizzle termine sin error.
3. Añadir **solo la entrada nueva** a `drizzle/meta/checksums.json` usando el SHA-256 del SQL revisado. Ejemplo: `sha256sum drizzle/0002_descripcion.sql`. Conservar intactos los hashes previos.
4. Probar instalación desde cero y actualización desde la versión anterior con datos ficticios; evaluar bloqueos y compatibilidad con la versión web/worker aún activa.
5. Antes de producción: backup recuperable probado, autorización RFC, ventana y criterio de detenerse. Revertir código no revierte automáticamente cambios de datos; puede requerirse corrección hacia adelante o restauración.

El manifest no es una firma: editar SQL y su hash a la vez puede superar el control local. La revisión del diff contra la rama base y las protecciones de rama son necesarias. No se reescribe automáticamente la línea base para hacer pasar CI.

## Datos y seguridad

Inventario estructural: [DICCIONARIO-DATOS.md](DICCIONARIO-DATOS.md), generado con `npm run docs:data` y comprobado con `npm run check:docs`.

| Grupo | Clasificación inicial | Uso y tratamiento |
| --- | --- | --- |
| estados, municipios, categorías, servicios, tipos de problema | catálogo interno; parte publicada | Publicar solo los campos autorizados y distinguir demostración de verificación |
| reports | seudónimos + ubicación aproximada + texto libre | No tratar como anonimato garantizado; moderar texto, limitar acceso, definir retención y eliminación |
| users, subscriptions | personal y autenticación | Hash de contraseña y correo nunca en API pública/logs; acceso por rol y finalidad |
| audit_logs, moderation_actions | evidencia sensible | `before`/`after` pueden copiar datos personales: redacción y minimización antes de instrumentar escritura real |
| baselines, aggregated_windows, incidents, incident_regions | derivado/operativo | Evitar reidentificación en grupos pequeños; validar integridad y separación entre hechos y señales |
| endpoints, technical_checks, official_updates | configuración y evidencia de terceros | No incorporar secretos en URL/metadata ni mostrar resultados no corroborados como confirmación oficial |

En producción separar identidad de migraciones de la cuenta de aplicación, con privilegios mínimos; restringir conexiones y exigir TLS según el proveedor. No asumir que el rol de desarrollo es apropiado para producción. Guardar secretos en el almacén del hosting, revisarlos y rotarlos con un procedimiento. Mantener bases de pruebas separadas y con datos ficticios.

## Matriz de control y estado

| ID | Control | Evidencia disponible | Estado / responsable necesario |
| --- | --- | --- | --- |
| COD-01 | análisis estático y nomenclatura | `eslint.config.mjs`, check:standards | Automatizado local/CI configurado; revisión de uso semántico a cargo del mantenedor |
| DB-01 | PK, nombres, timestamps y referencias nuevas | scripts/check-schema.ts y tests | Automatizado sobre código, excepciones explícitas |
| DB-02 | historial de migraciones íntegro | checksums + journal + tests | Automatizado local; exige revisión de hashes previos |
| DB-03 | documentación de datos actualizada | generador + check:docs | Automatizado sobre código, no prueba drift de producción |
| DB-04 | rangos, unicidad y borrados del dominio | esquema revisado | Pendiente: faltan CHECK numéricos y revisión de `baselines` con estado NULL; no se alteró el esquema en esta entrega |
| DB-05 | recuperación real y cuentas mínimas | procedimiento de operación y ensayo local dump/restore | Ensayo local aprobado con datos ficticios; política, RPO/RTO, cuentas mínimas y prueba en hosting por asignar |
| SEC-01 | recepción de reportes protegida | validación, límites y Turnstile | Tests locales; claves/proxy/despliegue reales aún no verificados |
| SEC-02 | evaluación completa de seguridad y accesos | referencia ASVS | Pendiente de matriz por requisito, pruebas y roles del panel |
| UX-01 | accesibilidad AA | objetivo WCAG 2.2 | Pendiente de auditoría: ESLint no acredita conformidad |
| OPS-01 | cambios, incidentes y problemas | OPERACION-ITIL.md y plantillas | Procedimiento definido; personas, canal y ejercicios por asignar |
| OPS-02 | monitoreo, capacidad y disponibilidad | web, PostgreSQL y worker identificados | SLO, alertas y guardia no configurados en hosting |
| GOV-01 | evidencia y revisión independiente | PR/RFC y política de excepciones | Depende de adopción y controles remotos; no se presume implantado |

## Excepciones y deuda controlada

Cada excepción necesita motivo, riesgo, control compensatorio, persona que la acepta y fecha de revisión. La lista técnica no constituye aceptación de riesgo por el propietario. Revisar las abiertas antes de activar una beta con usuarios.

| ID | Excepción / deuda | Motivo y control | Cierre requerido |
| --- | --- | --- | --- |
| EXC-LINT-001 | lectura única del tema en efecto de montaje | Mantiene la hidratación y el tema aplicado por el layout; supresión local de una regla, no global | Revisar con cambios de tema/hidratación; mantenedor |
| EXC-TOOL-001 | ESLint 9 señalado como fuera de soporte por npm | El plugin React utilizado declara compatibilidad hasta 9; no se fuerza una combinación incompatible con 10 | Actualización compatible o alternativa revisada; no afirmar toolchain plenamente vigente |
| EXC-DB-001 | `incidents.created_by` y `official_updates.verified_by` sin FK | Existentes; permitidas de forma puntual por el control | Definir semántica de eliminación y migración con preflight de huérfanos |
| EXC-DB-002 | `moderation_actions.target_id`, `audit_logs.entity_id` polimórficos | Una FK simple no representa múltiples destinos | Validación de destino en servidor al implementar administración/auditoría |
| EXC-DB-003 | unicidad de baseline con estado NULL; rangos sin CHECK | Las escrituras actuales dependen de lógica de aplicación y ejecución serial | Migración revisada, análisis de duplicados/rangos y pruebas antes de concurrencia/distribución |

Prioridad siguiente: resolver DB-04 con migraciones y pruebas de dominio; después configurar y ensayar DB-05/OPS-02 en el hosting elegido. Panel administrativo, política de retención y evaluación de privacidad siguen pendientes. Estos puntos impiden afirmar cumplimiento integral.
