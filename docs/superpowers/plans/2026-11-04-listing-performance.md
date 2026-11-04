# Rendimiento de listados: plan de implementación

**Objetivo autorizado:** perfilar las consultas del directorio/inicio, optimizar las lecturas repetidas y repetir el protocolo de carga con resistencia de 600 s, según la indicación «Hazlo».

**Diseño:** conservar PostgreSQL/Drizzle y las agregaciones actuales; obtener los estados de todos los servicios del listado en una consulta. Mantener `insufficient_data` cuando no exista incidente abierto. Ante varios incidentes abiertos, utilizar el más reciente por `startedAt`, como en el detalle; desempatar por ID descendente. No añadir caché, dependencias, migraciones ni cambios de cuotas. Las alternativas de caché y aumentar el pool ocultan las lecturas repetidas y añaden invalidación o presión sobre DB.

## Task 1: Diagnóstico y regresión

- [x] Crear una base temporal nueva, migrada, con 71 servicios activos y casos de reportes/estados conocidos. Inyectar únicamente una conexión Drizzle real con contador de consultas, sin sustituir las consultas de producción.
- [x] Ejecutar los listados actuales y registrar consultas reales: directorio <=2 e inicio <=7 son los presupuestos esperados después de agrupar. Ver fallar estos presupuestos antes de modificar producción.
- [x] Cubrir filtros, orden, conteos sin multiplicación por incidentes, servicio sin incidente, resueltos, inactivos y múltiples abiertos; limpiar exclusivamente la base creada.

## Task 2: Consulta por lote

- [x] En `src/lib/queries/status.ts`, implementar `statusesForServices(serviceIds: string[]): Promise<Map<string, OperationalStatus>>`, una consulta para entradas no vacías, ninguna para vacías. Usar el mismo mapeo de estado que el detalle.
- [x] Sustituir las lecturas por servicio en `directory.ts` y `home.ts`; conservar sus contratos públicos y ordenamientos.
- [x] Ejecutar tests de regresión, suite completa, check:standards, typecheck y build. Registrar antes/después del conteo SQL. Commit de la mejora.

## Task 3: Comparación HTTP y revisión

- [ ] Repetir `perf:local` con autocannon 8.0.0, 20.000 reportes iniciales, mismas fases y resistencia de 600 s; sin otras cargas durante el ensayo.
- [ ] Conservar evidencia original, medir errores/latencia/RPS, salida de worker y limpieza. Calificar la comparación: dataset crece y la máquina es compartida; los resultados no garantizan capacidad de hosting.
- [ ] Documentar comparación con la corrida `f45a0a2d1ecd6876`, revisar diff y evidencia de forma independiente y resolver defectos demostrables. Commit local, sin despliegue ni fusión.

## Riesgos a revisar

- Una consulta de incidentes no debe perder servicios sin incidente ni incluir resueltos/inactivos.
- Varios incidentes no deben multiplicar el conteo de reportes.
- El filtro de estado debe aplicarse antes del total devuelto; los ordenamientos se conservan.
- Empates temporales requieren selección determinista consistente con el detalle.
- Menos consultas no garantiza por sí solo menos latencia; decidir con la repetición medida.

## Evidencia previa al ensayo HTTP

Perfil PostgreSQL real (71 activos): directorio 72 → 2 consultas; inicio 77 → 7. Tests nuevos: tres fallos esperados antes de producción (dos presupuestos y selección de incidente), cinco aprobados después. Suite: 22 archivos / 161 tests aprobados. check:standards, typecheck y build de producción aprobados. Logs locales: `.cloud-setup/listing-red.log`, `listing-green.log`, `listing-suite.log`, `listing-build.log`, fuera del repositorio.
