# Private beta foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** proteger reportes y preparar ejecución periódica del motor.
**Architecture:** validación Turnstile del lado servidor, widget explícito del lado cliente y cron Linux con bloqueo de un solo host.
**Tech Stack:** Next.js, TypeScript, Vitest, PostgreSQL, Bash/flock.
**Spec:** docs/superpowers/specs/2026-10-26-private-beta-design.md

## Global Constraints

Sin dependencias nuevas, secretos en Git, despliegues ni uso de producción. Mantener modo local deshabilitado. API comprueba action=report y hostname=SITE_URL. Cron procesa ventanas completas de 15 minutos en un único host.

## Review Focus

Token ausente; proveedor inaccesible; action/hostname incorrectos; expiración/reintento del widget; límite exacto de una ventana UTC.

### Task 1: Turnstile

Files: src/lib/security/turnstile.ts; src/components/service/TurnstileChallenge.tsx; ReportForm.tsx; API reports; validation reports; página del servicio; .env.example; tests/turnstile.test.ts; tests/api-reports.test.ts.

Interface: verifyTurnstile(token: string | undefined): Promise<'verified' | 'rejected' | 'unavailable'>. Configuración desde variables de entorno; resultados públicos sin secretos.

- [x] Escribir y ejecutar pruebas RED de éxito, rechazo, errores y configuración incompleta.
- [x] Implementar verificador y conectarlo antes de las consultas/escrituras de reportes; widget explícito con limpieza y reintento.
- [x] Probar la API contra la base de pruebas y verificar que los rechazos no insertan filas.

### Task 2: Motor programable

Files: src/lib/engine/run-options.ts; scripts/aggregate-cron.ts; scripts/aggregate-scheduled.sh; deploy/aggregate.cron.example; tests/engine-run-options.test.ts; docs/BETA-PRIVADA.md.

Interface: parseRunOptions(args: string[], now?: Date) devuelve windowMinutes, at, windowStart; --completed selecciona la ventana completa anterior y es incompatible con --at.

- [x] Pruebas RED para ventana completa, límite UTC, argumentos inválidos y compatibilidad manual.
- [x] Implementar parser y runner con flock; documentar cron y límites operativos.
- [x] Ejecutar motor en pulsove_test y comprobar filas de la ventana esperada.

### Task 3: Verificación y entrega

- [x] Ejecutar suite completa contra pulsove_test, typecheck y build; revisar diff y secretos.
- [x] Documentar resultados y bloqueos reales de publicación; conservar cambios en rama específica.

## Evidencia de esta ejecución

103 pruebas en 12 archivos aprobadas contra pulsove_test; typecheck y build aprobados. Motor ejecutado con 71 servicios en una ventana completa. Navegador Chromium: consentimiento, token obligatorio, expiración, reintento, fallo de API y segundo reporte aprobados con proveedor/API simulados. Petición HTTP directa sin token: 422. Revisión independiente: sin hallazgos bloqueantes. CI modificado pero no ejecutado en GitHub; API GitHub devuelve Forbidden, por lo que no se creó Issue/PR. Publicación bloqueada por elección/acceso de hosting, dominio y credenciales reales.
