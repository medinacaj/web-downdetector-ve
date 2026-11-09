# Revisión local de secretos — 09-11-2026

Gitleaks 8.30.1 no detectó coincidencias en los **19 commits alcanzables localmente** hasta `60a068add41d28cfcc2ebcca15cd1dd15f93587f`, ni en los **155 archivos** del snapshot del índice `020cc3be72dce8a576c53f8aab935bc2631b52ef` (incluye los cambios de protección y workflow de esta entrega). No significa ausencia garantizada de secretos ni aprobación de producción.

## Control aplicado

- `.gitignore` excluye `.env*`; solo `.env.example` permanece versionable. Se comprobó `git check-ignore --no-index` para `.env`, `.env.local`, `.env.production`, `.env.production.local`, `.env.test` y `.env.preview`, y el resultado contrario para la plantilla. No elimina archivos ya versionados ni revoca credenciales.
- `npm run check:secrets` analiza el historial disponible de todas las referencias locales. Requiere Gitleaks instalado; no añade dependencias a la aplicación.
- `.github/workflows/secrets.yml` configura un job con historial completo (`fetch-depth: 0`), permisos `contents: read` y credenciales de checkout no persistentes. Analiza historial y un snapshot de todos los archivos del commit, incluyendo la plantilla `.env.example`.
- El binario se descarga de la [release oficial v8.30.1](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1) y se comprueba su SHA-256 fijado antes de ejecutarlo: `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`. Se verificó localmente frente al checksum publicado. No hay actualización automática de versión ni checksum.
- Se usan las reglas predeterminadas de la herramienta, sin baseline o excepciones locales. `--ignore-gitleaks-allow` impide omitir hallazgos mediante comentarios inline. Los resultados se redactan al 100%; no se suben reportes como artefactos de CI.

El workflow está **configurado, no ejecutado en GitHub**. Exigir su estado antes de fusionar requiere configurar y verificar la protección de rama remota; este archivo no la activa.

## Pruebas reales

| Caso | Salida | Resultado |
| --- | ---: | --- |
| Historial local, clon no superficial | 0 | 0 coincidencias |
| Snapshot de archivos versionados | 0 | 0 coincidencias |
| Archivo temporal con identificador AWS ficticio válido para la regla | 1 | 1 coincidencia `aws-access-token` |
| Mismo identificador en un commit anterior, ya borrado del último commit | 1 | 1 coincidencia histórica `aws-access-token` |

Los controles positivos usan un identificador sintético generado solo para el ensayo, nunca una credencial real ni una validación contra AWS. Se comprobó que el valor crudo no apareciera en logs/JSON redactados y se eliminaron los repositorios temporales. Así se verifica la capacidad de fallar, incluso cuando el archivo ya desapareció del último commit.

YAML parseado y sintaxis de todos los pasos Bash comprobada con `bash -n`; `npm run check:standards` aprobado. No se cambió código funcional ni esquema, por lo que no se repitieron carga o pruebas de DB para esta configuración.

[Resumen portable sin valores de credenciales](evidencias/secretos-2026-11-09.json). Resultados redactados de cada ensayo en `.runtime/security/`, ignorado por Git. Las identidades de los árboles y commits describen el alcance exacto de esa ejecución, anterior al commit documental.

## Repetición y tratamiento de hallazgos

Con Gitleaks 8.30.1 en PATH:

```sh
gitleaks version
npm run check:secrets
```

Para revisar archivos del commit, seguir el paso de snapshot del workflow; este comando npm cubre el historial, no archivos nuevos sin commit. No analizar todo el workspace con dependencias, credenciales locales o datos reales por conveniencia.

Ante una coincidencia, no pegar su valor en Issues, PR ni chats. Confirmar en un canal restringido si es credencial real, revocarla/rotarla y evaluar el alcance según [OPERACION-ITIL.md](OPERACION-ITIL.md). Quitar una línea del último commit no sanea el historial. Cambiar historia, aceptar excepciones o cerrar un incidente exige una decisión explícita y evidencia; no hay reparación destructiva automática.

## Límites pendientes

El escaneo cubre objetos alcanzables por las referencias del clon actual; no objetos eliminados/inaccesibles, ramas remotas no recuperadas ni sistemas externos. Las reglas detectan ciertos patrones y pueden producir falsos positivos o no reconocer otros secretos. No se inspeccionaron claves del hosting, secretos de ejecución, bundles generados del navegador ni todas las variantes de exposición. El examen del frontend y la configuración real de despliegue siguen pendientes, al igual que push protection y permisos remotos. No hay una auditoría exhaustiva ni certificación de seguridad.
