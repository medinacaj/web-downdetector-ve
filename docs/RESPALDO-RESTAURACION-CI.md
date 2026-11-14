# PulsoVE: ensayo de restauración sintética en CI

Este control usa PostgreSQL 16 efímero de GitHub Actions. No se conecta al hosting ni a cuentas externas: aplica las migraciones versionadas de `drizzle/`, importa catálogo demostrativo, genera reportes sintéticos mediante pruebas API, crea un `pg_dump` custom, restaura a **otra base de datos temporal** y compara tablas, cantidades y huellas de contenido (incluido el historial de Drizzle).

- La ejecución requiere `CI=true`, `ALLOW_SYNTHETIC_RESTORE_TEST=1`, usuario `ci`, nombre `pulsove_ci`, hostname local y el ID del contenedor de PostgreSQL que levanta la propia acción.
- El archivo de respaldo permanece dentro del contenedor de CI; no se publica como artefacto y se elimina junto con la base restaurada.
- No se imprimen filas, identificadores de visitantes, comentarios ni credenciales.
- El flujo se activa en PRs que cambian esquema, migraciones o su contrato de pruebas y también manualmente mediante `workflow_dispatch`.
- Si la prueba falla, el despliegue sigue siendo decisión externa: **el script no modifica producción**.

**Límites:** no se prueba tráfico simultáneo, recuperación de un servidor real, backups externos cifrados, política de retención, PITR, fallo de región ni RPO/RTO. Esta es una barrera de CI, no una estrategia de desastre completa. El despliegue posterior debe establecer respaldo externo, cifrado, custodia de claves y pruebas periódicas de restauración autorizadas. Véase [Issue #100](https://github.com/medinacaj/web-pulso-ve/issues/100).
